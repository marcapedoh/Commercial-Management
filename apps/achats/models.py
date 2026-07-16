# Create your models here.
from django.db import models
from apps.fournisseurs.models import Fournisseur
from apps.produits.models import Produit
from apps.users.models import User
# Create your models here.
class Achat(models.Model):

    fournisseur=models.ForeignKey(
        Fournisseur,
        on_delete=models.PROTECT
    )


    reference=models.CharField(
        max_length=50,
        unique=True
    )


    date=models.DateField(
        auto_now_add=True
    )


    total=models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )


    utilisateur=models.ForeignKey(
        User,
        on_delete=models.PROTECT
    )

class LigneAchat(models.Model):

    achat=models.ForeignKey(
        Achat,
        related_name="lignes",
        on_delete=models.CASCADE
    )


    produit=models.ForeignKey(
        Produit,
        on_delete=models.PROTECT
    )


    quantite=models.PositiveIntegerField()


    prix_unitaire=models.DecimalField(
        max_digits=12,
        decimal_places=2
    )