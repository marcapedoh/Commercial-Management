from django.db import models
from apps.fournisseurs.models import Fournisseur


class Facture(models.Model):

    fournisseur = models.ForeignKey(
        Fournisseur,
        null=True,
        on_delete=models.PROTECT,
        related_name="factures"
    )

    numero = models.CharField(
        max_length=50,
        unique=True
    )

    montant_ht = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    tva = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    montant_ttc = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    soldee = models.BooleanField(
        default=False
    )

    date = models.DateField(
        auto_now_add=True
    )

    def __str__(self):
        return self.numero