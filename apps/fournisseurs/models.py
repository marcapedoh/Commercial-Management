from django.db import models


class Fournisseur(models.Model):

    nom = models.CharField(
        max_length=150,
        unique=True
    )

    email = models.EmailField(
        blank=True
    )

    telephone = models.CharField(
        max_length=20,
        blank=True
    )

    adresse = models.TextField(
        blank=True
    )

    ville = models.CharField(
        max_length=100,
        blank=True
    )

    actif = models.BooleanField(
        default=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return self.nom