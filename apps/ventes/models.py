from django.db import models

# Create your models here.
from django.db import models

from apps.clients.models import Client
from apps.produits.models import Produit
from apps.users.models import User

# Create your models here.
class Vente(models.Model):

    client=models.ForeignKey(
        Client,
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
        decimal_places=2
    )


    utilisateur=models.ForeignKey(
        User,
        on_delete=models.PROTECT
    )

class LigneVente(models.Model):

    vente=models.ForeignKey(
        Vente,
        related_name="lignes",
        on_delete=models.CASCADE
    )


    produit=models.ForeignKey(
        Produit,
        on_delete=models.PROTECT
    )


    quantite=models.PositiveIntegerField()


    prix_vente=models.DecimalField(
        max_digits=12,
        decimal_places=2
    )


    prix_achat=models.DecimalField(
        max_digits=12,
        decimal_places=2
    )


    @property
    def marge(self):

        return (
          self.prix_vente-self.prix_achat
        )*self.quantite