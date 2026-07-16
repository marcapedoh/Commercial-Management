from django import forms
from .models import Client


class ClientForm(forms.ModelForm):
    class Meta:
        model = Client
        fields = ["nom", "prenom", "telephone", "email", "adresse"]
        widgets = {
            "nom": forms.TextInput(attrs={"class": "border rounded-lg px-3 py-2 w-full"}),
            "prenom": forms.TextInput(attrs={"class": "border rounded-lg px-3 py-2 w-full"}),
            "telephone": forms.TextInput(attrs={"class": "border rounded-lg px-3 py-2 w-full"}),
            "email": forms.EmailInput(attrs={"class": "border rounded-lg px-3 py-2 w-full"}),
            "adresse": forms.Textarea(attrs={"class": "border rounded-lg px-3 py-2 w-full", "rows": 3}),
        }
        labels = {
            "nom": "Nom",
            "prenom": "Prénom",
            "telephone": "Téléphone",
            "email": "Email",
            "adresse": "Adresse",
        }