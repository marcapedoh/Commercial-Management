from django.db import models

from apps.users.models import User

# Create your models here.
class Reglement(models.Model):

    MODE_CHOICES=(
        ("ESPECES","Espèces"),
        ("CARTE","Carte"),
        ("VIREMENT","Virement"),
        ("CHEQUE","Chèque"),
    )


    montant=models.DecimalField(
        max_digits=12,
        decimal_places=2
    )


    date=models.DateField(
        auto_now_add=True
    )


    mode=models.CharField(
        max_length=20,
        choices=MODE_CHOICES
    )


    utilisateur=models.ForeignKey(
        User,
        on_delete=models.PROTECT
    )