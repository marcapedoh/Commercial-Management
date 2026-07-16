from django import forms
from .models import Categorie, Produit


class CategorieForm(forms.ModelForm):
    class Meta:
        model = Categorie
        fields = ["nom", "description"]
        widgets = {
            "nom": forms.TextInput(attrs={
                "class": "border rounded-lg px-3 py-2 w-full",
                "placeholder": "Nom de la catégorie",
            }),
            "description": forms.Textarea(attrs={
                "class": "border rounded-lg px-3 py-2 w-full",
                "rows": 3,
                "placeholder": "Description (optionnel)",
            }),
        }


class ProduitForm(forms.ModelForm):
    class Meta:
        model = Produit
        fields = [
            "reference", "designation", "categorie",
            "prix_achat", "prix_vente",
            "stock_actuel", "seuil_alerte",
            "stock_securite", "actif",
        ]
        widgets = {
            "reference": forms.TextInput(attrs={"class": "border rounded-lg px-3 py-2 w-full"}),
            "designation": forms.TextInput(attrs={"class": "border rounded-lg px-3 py-2 w-full"}),
            "categorie": forms.Select(attrs={"class": "border rounded-lg px-3 py-2 w-full"}),
            "prix_achat": forms.NumberInput(attrs={"class": "border rounded-lg px-3 py-2 w-full", "step": "0.01"}),
            "prix_vente": forms.NumberInput(attrs={"class": "border rounded-lg px-3 py-2 w-full", "step": "0.01"}),
            "stock_actuel": forms.NumberInput(attrs={"class": "border rounded-lg px-3 py-2 w-full"}),
            "seuil_alerte": forms.NumberInput(attrs={"class": "border rounded-lg px-3 py-2 w-full"}),
            "stock_securite": forms.NumberInput(attrs={"class": "border rounded-lg px-3 py-2 w-full"}),
            "actif": forms.CheckboxInput(attrs={"class": "rounded"}),
        }
        labels = {
           "reference": "Référence",
           "designation": "Désignation",
           "categorie": "Catégorie",
           "prix_achat": "Prix d'achat (FCFA)",
           "prix_vente": "Prix de vente (FCFA)",
           "stock_actuel": "stock actuel",
           "seuil_alerte":"Seuil d'alerte",
           "stock_securite": "Stock de sécurité",
           "actif": "Produit actif",
}