# Create your models here.
from django.db import models

from apps.produits.models import Produit
from apps.users.models import User

# Create your models here.
class MouvementStock(models.Model):

    TYPE_CHOICES=(
        ("ENTREE","Entrée"),
        ("SORTIE","Sortie"),
    )


    produit=models.ForeignKey(
        Produit,
        on_delete=models.PROTECT
    )


    type=models.CharField(
        max_length=20,
        choices=TYPE_CHOICES
    )


    quantite=models.IntegerField()


    date=models.DateTimeField(
        auto_now_add=True
    )


    utilisateur=models.ForeignKey(
        User,
        on_delete=models.PROTECT
    )