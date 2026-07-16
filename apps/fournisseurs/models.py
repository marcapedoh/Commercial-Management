

# Create your models here.
from django.db import models

# Create your models here.
class Fournisseur(models.Model):

    raison_sociale=models.CharField(
        max_length=150
    )

    telephone=models.CharField(
        max_length=20
    )

    email=models.EmailField(
        blank=True
    )


    adresse=models.TextField(
        blank=True
    )