from django.db import models

# Create your models here.
class Categorie(models.Model):

    nom = models.CharField(
        max_length=100
    )

    description = models.TextField(
        blank=True
    )

    created_at=models.DateTimeField(
        auto_now_add=True
    )

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


    @property
    def marge_unitaire(self):

        return self.prix_vente-self.prix_achat