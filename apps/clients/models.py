from django.db import models


class Client(models.Model):

    nom = models.CharField(max_length=100)

    prenom = models.CharField(
        max_length=100,
        blank=True
    )

    telephone = models.CharField(
        max_length=20
    )

    email = models.EmailField(
        blank=True
    )

    adresse = models.TextField(
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.nom} {self.prenom}"