from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib.auth import login, authenticate, logout
from django.contrib import messages
from django.core.paginator import Paginator
from .models import Producto, Categoria, Perfil, CarritoItem
from django.db.models import Q
from django.contrib.auth.models import User
from django.contrib.auth.forms import UserCreationForm
from decimal import Decimal
from django.db import transaction
from django.http import JsonResponse
from django.core.exceptions import ValidationError

def get_default_image(categoria_nombre):
    """Retorna la imagen por defecto según la categoría"""
    imagenes_por_categoria = {
        'Suspensión': 'suspension.jpg',
        'Motor': 'motor.jpg',
        'Frenos': 'frenos.jpg',
        'Transmisión': 'transmision.jpg',
        'Eléctrico': 'electrico.jpg',
        'Carrocería': 'carroceria.jpg',
    }
    return f'autoparts/img/categorias/{imagenes_por_categoria.get(categoria_nombre, "default.jpg")}'

def index(request):
    return render(request, 'autoparts/index.html')

def catalogo(request):
    productos = Producto.objects.all()
    categorias = Categoria.objects.all()
    
    categoria_seleccionada = request.GET.get('categoria')
    if categoria_seleccionada:
        productos = productos.filter(categoria_id=categoria_seleccionada)
    
    query = request.GET.get('q')
    if query:
        productos = productos.filter(
            Q(nombre__icontains=query) |
            Q(descripcion__icontains=query) |
            Q(codigo__icontains=query)
        )
    
    disponibilidad = request.GET.get('disponibilidad')
    if disponibilidad == 'stock':
        productos = productos.filter(stock__gt=0)
    
    orden = request.GET.get('orden')
    if orden:
        if orden == 'precio_asc':
            productos = productos.order_by('precio')
        elif orden == 'precio_desc':
            productos = productos.order_by('-precio')
        elif orden == 'nombre':
            productos = productos.order_by('nombre')
    
    paginator = Paginator(productos, 9)
    page = request.GET.get('page')
    productos = paginator.get_page(page)
    
    context = {
        'productos': productos,
        'categorias': categorias,
        'categoria_seleccionada': categoria_seleccionada,
        'query': query,
    }
    
    return render(request, 'autoparts/catalogo.html', context)

def producto_detalle(request, producto_id):
    producto = get_object_or_404(Producto, id=producto_id)
    # Obtener productos relacionados de la misma categoría
    productos_relacionados = Producto.objects.filter(
        categoria=producto.categoria,
        activo=True
    ).exclude(id=producto.id)[:4]
    
    context = {
        'producto': producto,
        'productos_relacionados': productos_relacionados,
        'messages': messages.get_messages(request)
    }
    return render(request, 'autoparts/producto_detalle.html', context)

def registro_view(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            try:
                with transaction.atomic():
                    # Crear el usuario
                    user = form.save()
                    
                    # Obtener el tipo de usuario del formulario
                    tipo_usuario = request.POST.get('tipo_usuario', 'cliente')
                    
                    # Actualizar el perfil del usuario
                    perfil = user.perfil
                    perfil.tipo_usuario = tipo_usuario
                    perfil.save()
                    
                    # Iniciar sesión
                    login(request, user)
                    messages.success(request, '¡Registro exitoso! Bienvenido.')
                    return redirect('home')
            except Exception as e:
                messages.error(request, 'Error al crear el usuario. Por favor, intente nuevamente.')
                return render(request, 'registration/registro.html', {'form': form})
        else:
            for error in form.errors.values():
                messages.error(request, error)
    else:
        form = UserCreationForm()
    
    return render(request, 'registration/registro.html', {'form': form})

def login_view(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            login(request, user)
            messages.success(request, '¡Bienvenido de vuelta!')
            next_url = request.GET.get('next', 'home')
            return redirect(next_url)
        else:
            messages.error(request, 'Usuario o contraseña incorrectos.')
    
    return render(request, 'login.html')

@login_required
def cliente(request):
    return render(request, 'autoparts/cliente.html')

@login_required
def distribuidor(request):
    return render(request, 'autoparts/distribuidor.html')

def logout_view(request):
    if request.user.is_authenticated:
        messages.success(request, '¡Gracias por tu visita! Esperamos verte pronto de vuelta en la pista.')
        logout(request)
    return render(request, 'logout.html')

@login_required
def ver_carrito(request):
    items = CarritoItem.objects.filter(usuario=request.user)
    es_distribuidor = request.user.perfil.tipo_usuario == 'distribuidor'
    
    subtotal = sum(item.get_subtotal() for item in items)
    iva = subtotal * Decimal('0.19')
    descuento = Decimal('0')
    
    if es_distribuidor:
        for item in items:
            if item.cantidad >= 10:
                descuento += item.get_subtotal() * Decimal('0.05')
    
    total = subtotal + iva - descuento
    
    context = {
        'items': items,
        'subtotal': subtotal,
        'iva': iva,
        'descuento': descuento,
        'total': total,
        'es_distribuidor': es_distribuidor
    }
    
    return render(request, 'autoparts/carrito.html', context)

@login_required
def agregar_al_carrito(request, producto_id):
    if request.method == 'POST':
        try:
            cantidad = int(request.POST.get('cantidad', 1))
            producto = get_object_or_404(Producto, id=producto_id)
            
            if request.user.perfil.tipo_usuario == 'distribuidor' and cantidad < 10:
                messages.error(request, 'Los distribuidores deben agregar al menos 10 unidades.')
                return redirect('producto_detalle', producto_id=producto_id)
            
            if cantidad > producto.stock:
                messages.error(request, 'No hay suficiente stock disponible.')
                return redirect('producto_detalle', producto_id=producto_id)
            
            carrito_item, created = CarritoItem.objects.get_or_create(
                usuario=request.user,
                producto=producto,
                defaults={'cantidad': cantidad}
            )
            
            if not created:
                carrito_item.cantidad += cantidad
                carrito_item.save()
            
            messages.success(request, 'Producto agregado al carrito exitosamente.')
            return redirect('ver_carrito')
            
        except Exception as e:
            messages.error(request, f'Error al agregar al carrito: {str(e)}')
            return redirect('producto_detalle', producto_id=producto_id)
    
    return redirect('catalogo')

@login_required
def actualizar_carrito(request, item_id):
    if request.method == 'POST':
        item = get_object_or_404(CarritoItem, id=item_id, usuario=request.user)
        cantidad = int(request.POST.get('cantidad', 0))
        
        if cantidad > 0:
            item.cantidad = cantidad
            item.save()
            messages.success(request, 'Carrito actualizado.')
        else:
            item.delete()
            messages.success(request, 'Producto eliminado del carrito.')
    
    return redirect('ver_carrito')

@login_required
def eliminar_del_carrito(request, item_id):
    item = get_object_or_404(CarritoItem, id=item_id, usuario=request.user)
    item.delete()
    messages.success(request, 'Producto eliminado del carrito.')
    return redirect('ver_carrito')

@login_required
def checkout(request):
    items = CarritoItem.objects.filter(usuario=request.user)
    es_distribuidor = request.user.perfil.tipo_usuario == 'distribuidor'
    
    if not items.exists():
        messages.warning(request, 'Tu carrito está vacío.')
        return redirect('ver_carrito')
    
    subtotal = sum(item.get_subtotal() for item in items)
    iva = subtotal * Decimal('0.19')
    descuento = Decimal('0')
    
    if es_distribuidor:
        for item in items:
            if item.cantidad >= 10:
                descuento += item.get_subtotal() * Decimal('0.05')
    
    total = subtotal + iva - descuento
    
    context = {
        'items': items,
        'subtotal': subtotal,
        'iva': iva,
        'descuento': descuento,
        'total': total,
        'es_distribuidor': es_distribuidor
    }
    
    return render(request, 'autoparts/checkout.html', context)

@login_required
def procesar_pago(request):
    if request.method == 'POST':
        # Aquí se implementaría la lógica de procesamiento de pago
        # Por ahora solo mostraremos un mensaje de éxito
        messages.success(request, 'Pedido procesado exitosamente. Gracias por tu compra.')
        
        # Limpiar el carrito
        CarritoItem.objects.filter(usuario=request.user).delete()
        
        return redirect('home')
    
    return redirect('checkout')
