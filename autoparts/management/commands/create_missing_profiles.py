from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from autoparts.models import Perfil

class Command(BaseCommand):
    help = 'Crea perfiles faltantes para usuarios existentes'

    def handle(self, *args, **kwargs):
        users = User.objects.all()
        count = 0
        for user in users:
            try:
                # Intenta acceder al perfil
                profile = user.perfil
            except Perfil.DoesNotExist:
                # Si no existe, créalo
                Perfil.objects.create(usuario=user)
                count += 1
                self.stdout.write(f'Perfil creado para {user.username}')
        
        self.stdout.write(self.style.SUCCESS(f'Se crearon {count} perfiles faltantes')) 