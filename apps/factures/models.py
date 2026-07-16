# Create your models here.
from django.db import models

# Create your models here.
class Facture(models.Model):

    numero=models.CharField(
        max_length=50,
        unique=True
    )


    montant_ht=models.DecimalField(
        max_digits=12,
        decimal_places=2
    )


    tva=models.DecimalField(
        max_digits=12,
        decimal_places=2
    )


    montant_ttc=models.DecimalField(
        max_digits=12,
        decimal_places=2
    )


    soldee=models.BooleanField(
        default=False
    )