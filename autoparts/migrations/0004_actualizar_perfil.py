from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('autoparts', '0003_carritoitem'),
    ]

    operations = [
        migrations.AddField(
            model_name='perfil',
            name='telefono',
            field=models.CharField(blank=True, max_length=15),
        ),
        migrations.AddField(
            model_name='perfil',
            name='direccion',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='perfil',
            name='rut',
            field=models.CharField(blank=True, max_length=12),
        ),
        migrations.AddField(
            model_name='perfil',
            name='empresa',
            field=models.CharField(blank=True, help_text='Solo para distribuidores', max_length=100),
        ),
        migrations.CreateModel(
            name='HistorialCompra',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('fecha_compra', models.DateTimeField(auto_now_add=True)),
                ('total', models.DecimalField(decimal_places=2, max_digits=10)),
                ('estado', models.CharField(choices=[('pendiente', 'Pendiente'), ('completado', 'Completado'), ('cancelado', 'Cancelado')], default='pendiente', max_length=20)),
                ('numero_orden', models.CharField(max_length=20, unique=True)),
                ('perfil', models.ForeignKey(on_delete=models.deletion.CASCADE, related_name='compras', to='autoparts.perfil')),
            ],
        ),
        migrations.CreateModel(
            name='DetalleCompra',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('cantidad', models.PositiveIntegerField()),
                ('precio_unitario', models.DecimalField(decimal_places=2, max_digits=10)),
                ('descuento_aplicado', models.DecimalField(decimal_places=2, default=0, max_digits=5)),
                ('historial', models.ForeignKey(on_delete=models.deletion.CASCADE, related_name='detalles', to='autoparts.historialcompra')),
                ('producto', models.ForeignKey(null=True, on_delete=models.deletion.SET_NULL, to='autoparts.producto')),
            ],
        ),
    ] 