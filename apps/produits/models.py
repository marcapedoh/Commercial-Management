from django.db import models
import random
import string
# Create your models here.
class Categorie(models.Model):

    nom = models.CharField(
        max_length=100,
        unique=True
    )

    description = models.TextField(
        blank=True,
        null=True
    )

    created_at=models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return self.nom

class Produit(models.Model):

    reference=models.CharField(
        max_length=50,
        unique=True
    )

    designation=models.CharField(
        max_length=200
    )

    categorie=models.ForeignKey(
        Categorie,
        on_delete=models.PROTECT
    )


    prix_achat=models.DecimalField(
        max_digits=12,
        decimal_places=2
    )


    prix_vente=models.DecimalField(
        max_digits=12,
        decimal_places=2
    )


    # Stock
    stock_actuel=models.IntegerField(
        default=0
    )

    seuil_alerte=models.IntegerField(
        default=10
    )


    # Nouvelle fonctionnalité
    stock_securite=models.IntegerField(
        default=5
    )


    # Prévision
    stock_min=models.IntegerField(
        default=0
    )


    actif=models.BooleanField(
        default=True
    )


    created_at=models.DateTimeField(
        auto_now_add=True
    )

    def generate_reference(self):

        prefix = "PRD"

        code = ''.join(
            random.choices(
                string.digits,
                k=6
            )
        )

        return f"{prefix}-{code}"


    def save(self, *args, **kwargs):

        if not self.reference:
            self.reference = self.generate_reference()

        super().save(*args, **kwargs)


    @property
    def marge_unitaire(self):
        return self.prix_vente-self.prix_achat