from django.db import models
from apps.clients.models import Client
from apps.produits.models import Produit
from apps.users.models import User


class Vente(models.Model):
    client = models.ForeignKey(Client, on_delete=models.PROTECT, null=True, blank=True)
    reference = models.CharField(max_length=50, unique=True)
    date = models.DateTimeField(auto_now_add=True)

    total_ht = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tva = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_ttc = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    marge_totale = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    utilisateur = models.ForeignKey(User, on_delete=models.PROTECT)

    # Facture generee automatiquement, stockee en base64 (string)
    facture_pdf_base64 = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.reference


class LigneVente(models.Model):
    vente = models.ForeignKey(Vente, related_name="lignes", on_delete=models.CASCADE)
    produit = models.ForeignKey(Produit, on_delete=models.PROTECT)
    quantite = models.PositiveIntegerField()
    prix_vente_unitaire = models.DecimalField(max_digits=12, decimal_places=2)
    prix_achat_unitaire = models.DecimalField(max_digits=12, decimal_places=2)  # snapshot au moment de la vente

    @property
    def total_ligne(self):
        return self.prix_vente_unitaire * self.quantite

    @property
    def marge_unitaire(self):
        return self.prix_vente_unitaire - self.prix_achat_unitaire

    @property
    def marge_ligne(self):
        return self.marge_unitaire * self.quantite