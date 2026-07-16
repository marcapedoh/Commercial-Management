# Create your models here.
from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.
class User(AbstractUser):

    ROLE_CHOICES = (
        ("ADMIN", "Administrateur"),
        ("COMMERCIAL", "Commercial"),
        ("CAISSIER", "Caissier"),
        ("GESTIONNAIRE", "Gestionnaire Stock"),
    )

    nom = models.CharField(
        max_length=20,
        blank=True
    )

    prenom = models.CharField(
        max_length=30,
        blank=True
    )

    telephone = models.CharField(
        max_length=20,
        blank=True
    )

    role = models.CharField(
        max_length=30,
        choices=ROLE_CHOICES,
        default="COMMERCIAL"
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )