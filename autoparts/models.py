from django.db import models
from django.core.validators import MinValueValidator
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from decimal import Decimal

# Create your models here.

class Categoria(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True)
    
    def __str__(self):
        return self.nombre
    
    class Meta:
        verbose_name_plural = "Categorías"

class Producto(models.Model):
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField()
    precio = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    categoria = models.ForeignKey(Categoria, on_delete=models.CASCADE, related_name='productos')
    imagen = models.ImageField(upload_to='productos/', null=True, blank=True)
    stock = models.PositiveIntegerField(default=0)
    codigo = models.CharField(max_length=50, unique=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    activo = models.BooleanField(default=True)

    def __str__(self):
        return self.nombre

    class Meta:
        verbose_name_plural = "Productos"
        ordering = ['-fecha_creacion']

class Perfil(models.Model):
    TIPO_USUARIO_CHOICES = [
        ('cliente', 'Cliente'),
        ('distribuidor', 'Distribuidor'),
    ]
    
    usuario = models.OneToOneField(User, on_delete=models.CASCADE)
    tipo_usuario = models.CharField(
        max_length=20,
        choices=TIPO_USUARIO_CHOICES,
        default='cliente'
    )
    fecha_registro = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.usuario.username} - {self.get_tipo_usuario_display()}"

@receiver(post_save, sender=User)
def crear_perfil_usuario(sender, instance, created, **kwargs):
    if created:
        Perfil.objects.create(usuario=instance)

@receiver(post_save, sender=User)
def guardar_perfil_usuario(sender, instance, **kwargs):
    instance.perfil.save()

class CarritoItem(models.Model):
    usuario = models.ForeignKey(User, on_delete=models.CASCADE)
    producto = models.ForeignKey('Producto', on_delete=models.CASCADE)
    cantidad = models.PositiveIntegerField(default=1)
    fecha_agregado = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('usuario', 'producto')

    def __str__(self):
        return f"{self.usuario.username} - {self.producto.nombre} x {self.cantidad}"

    def get_subtotal(self):
        return self.producto.precio * self.cantidad

    @property
    def subtotal(self):
        return self.get_subtotal()

    def get_descuento(self):
        if self.usuario.perfil.tipo_usuario == 'distribuidor' and self.cantidad >= 10:
            return self.get_subtotal() * Decimal('0.05')
        return Decimal('0')

    @property
    def descuento(self):
        return self.get_descuento()

    def get_total(self):
        return self.get_subtotal() - self.get_descuento()

    @property
    def total(self):
        return self.get_total()

    def clean(self):
        from django.core.exceptions import ValidationError
        # Validar cantidad mínima para distribuidores
        if self.usuario.perfil.tipo_usuario == 'distribuidor' and self.cantidad < 10:
            raise ValidationError('Los distribuidores deben agregar al menos 10 unidades.')

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
