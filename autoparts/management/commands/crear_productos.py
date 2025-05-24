from django.core.management.base import BaseCommand
from autoparts.models import Categoria, Producto
from django.core.files.base import ContentFile
import requests
from decimal import Decimal

class Command(BaseCommand):
    help = 'Crea productos de ejemplo para el catálogo'

    def handle(self, *args, **kwargs):
        # Crear categorías
        categorias = {
            'Frenos': 'Todo tipo de sistemas de frenos y componentes relacionados',
            'Motor': 'Partes y componentes para el motor',
            'Suspensión': 'Sistemas de suspensión y amortiguación',
        }

        for nombre, descripcion in categorias.items():
            Categoria.objects.get_or_create(
                nombre=nombre,
                defaults={'descripcion': descripcion}
            )

        # Lista de productos a crear
        productos = [
            {
                'nombre': 'Kit de Frenos Delanteros',
                'descripcion': 'Kit completo de frenos delanteros de alta calidad. Incluye pastillas, discos y accesorios de montaje.',
                'precio': Decimal('125000'),
                'categoria': 'Frenos',
                'stock': 15,
                'codigo': 'FRE-001',
                'imagen_url': 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=500'
            },
            {
                'nombre': 'Aceite de Motor Sintético',
                'descripcion': 'Aceite sintético de alta calidad para motores modernos. Proporciona protección superior y rendimiento óptimo.',
                'precio': Decimal('45000'),
                'categoria': 'Motor',
                'stock': 50,
                'codigo': 'MOT-001',
                'imagen_url': 'https://images.unsplash.com/photo-1635764700453-a902a64cd3d9?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=500'
            },
            {
                'nombre': 'Amortiguadores Deportivos',
                'descripcion': 'Par de amortiguadores deportivos de alto rendimiento. Mejora la estabilidad y el manejo del vehículo.',
                'precio': Decimal('180000'),
                'categoria': 'Suspensión',
                'stock': 8,
                'codigo': 'SUS-001',
                'imagen_url': 'https://images.unsplash.com/photo-1581288952064-47fe8f769a25?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=500'
            },
            {
                'nombre': 'Pastillas de Freno Cerámicas',
                'descripcion': 'Pastillas de freno cerámicas de alta durabilidad. Excelente rendimiento y baja generación de polvo.',
                'precio': Decimal('35000'),
                'categoria': 'Frenos',
                'stock': 30,
                'codigo': 'FRE-002',
                'imagen_url': 'https://images.unsplash.com/photo-1600497900863-2a4a5c6a4e68?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=500'
            },
            {
                'nombre': 'Kit de Distribución Completo',
                'descripcion': 'Kit completo de distribución incluyendo correa, tensores y rodamientos. Compatible con múltiples modelos.',
                'precio': Decimal('95000'),
                'categoria': 'Motor',
                'stock': 12,
                'codigo': 'MOT-002',
                'imagen_url': 'https://images.unsplash.com/photo-1617886903355-9354bb57fc68?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=500'
            },
            {
                'nombre': 'Resortes Deportivos',
                'descripcion': 'Set de resortes deportivos para una conducción más firme y deportiva. Reduce la altura del vehículo.',
                'precio': Decimal('150000'),
                'categoria': 'Suspensión',
                'stock': 6,
                'codigo': 'SUS-002',
                'imagen_url': 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=500'
            },
        ]

        # Limpiar productos existentes
        Producto.objects.all().delete()

        # Crear productos
        for producto_data in productos:
            categoria = Categoria.objects.get(nombre=producto_data['categoria'])
            
            # Crear el producto
            producto = Producto.objects.create(
                codigo=producto_data['codigo'],
                nombre=producto_data['nombre'],
                descripcion=producto_data['descripcion'],
                precio=producto_data['precio'],
                categoria=categoria,
                stock=producto_data['stock'],
            )

            # Descargar y guardar la imagen
            response = requests.get(producto_data['imagen_url'])
            if response.status_code == 200:
                imagen_nombre = f"{producto_data['codigo']}.jpg"
                producto.imagen.save(
                    imagen_nombre,
                    ContentFile(response.content),
                    save=True
                )
            self.stdout.write(
                self.style.SUCCESS(f'Producto creado exitosamente: {producto.nombre}')
            ) 