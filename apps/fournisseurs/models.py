from django.db import models

# Create your models here.
class Fournisseur(models.Model):

    nom= models.CharField(
        max_length=80,
        unique=True
    )
    raison_sociale=models.CharField(
        max_length=150
    )

    telephone=models.CharField(
        max_length=20
    )

    email=models.EmailField(
        blank=True,
        null=True,
        unique=True
    )

    adresse=models.TextField(
        blank=True
    )

    def __str__(self):
        return self.nom