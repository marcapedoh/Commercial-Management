from django import forms
from .models import Fournisseur


class FournisseurForm(forms.ModelForm):
    class Meta:
        model = Fournisseur
        fields = ["nom", "email", "telephone", "adresse", "ville", "actif"]
        widgets = {
            "nom": forms.TextInput(attrs={"class": "border rounded-lg px-3 py-2 w-full"}),
            "email": forms.EmailInput(attrs={"class": "border rounded-lg px-3 py-2 w-full"}),
            "telephone": forms.TextInput(attrs={"class": "border rounded-lg px-3 py-2 w-full"}),
            "adresse": forms.Textarea(attrs={"class": "border rounded-lg px-3 py-2 w-full", "rows": 3}),
            "ville": forms.TextInput(attrs={"class": "border rounded-lg px-3 py-2 w-full"}),
            "actif": forms.CheckboxInput(attrs={"class": "rounded"}),
        }
        labels = {
            "nom": "Nom du fournisseur",
            "email": "Email",
            "telephone": "Téléphone",
            "adresse": "Adresse",
            "ville": "Ville",
            "actif": "Fournisseur actif",
        }