from django import forms
from django.forms import inlineformset_factory
from .models import Vente, LigneVente


class VenteForm(forms.ModelForm):
    class Meta:
        model = Vente
        fields = ["client", "reference"]
        widgets = {
            "client": forms.Select(attrs={"class": "border rounded-lg px-3 py-2 w-full"}),
            "reference": forms.TextInput(attrs={"class": "border rounded-lg px-3 py-2 w-full"}),
        }
        labels = {
            "client": "Client",
            "reference": "Référence de la vente",
        }


LigneVenteFormSet = inlineformset_factory(
    Vente,
    LigneVente,
    fields=["produit", "quantite"],
    extra=3,
    can_delete=True,
    widgets={
        "produit": forms.Select(attrs={"class": "border rounded-lg px-2 py-1.5 w-full"}),
        "quantite": forms.NumberInput(attrs={"class": "border rounded-lg px-2 py-1.5 w-full"}),
    },
)