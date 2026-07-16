from django import forms
from django.forms import inlineformset_factory
from .models import Achat, LigneAchat


class AchatForm(forms.ModelForm):
    class Meta:
        model = Achat
        fields = ["fournisseur", "reference"]
        widgets = {
            "fournisseur": forms.Select(attrs={"class": "border rounded-lg px-3 py-2 w-full"}),
            "reference": forms.TextInput(attrs={"class": "border rounded-lg px-3 py-2 w-full"}),
        }
        labels = {
            "fournisseur": "Fournisseur",
            "reference": "Référence de l'achat",
        }


LigneAchatFormSet = inlineformset_factory(
    Achat,
    LigneAchat,
    fields=["produit", "quantite", "prix_unitaire"],
    extra=3,
    can_delete=True,
    widgets={
        "produit": forms.Select(attrs={"class": "border rounded-lg px-2 py-1.5 w-full"}),
        "quantite": forms.NumberInput(attrs={"class": "border rounded-lg px-2 py-1.5 w-full"}),
        "prix_unitaire": forms.NumberInput(attrs={"class": "border rounded-lg px-2 py-1.5 w-full", "step": "0.01"}),
    },
)