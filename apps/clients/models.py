# Create your models here.
from django.db import models

# Create your models here.
class Client(models.Model):

    nom=models.CharField(max_length=100)

    prenom=models.CharField(
        max_length=100,
        blank=True
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


    created_at=models.DateTimeField(
        auto_now_add=True
    )