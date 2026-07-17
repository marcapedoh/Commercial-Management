from django import forms
from .models import Fournisseur


INPUT_CLASSES = (
    "w-full rounded-lg px-3 py-2.5 text-sm transition focus:outline-none "
    "bg-white/60 border border-amber-200 text-neutral-700 placeholder-neutral-400 "
    "focus:border-amber-400 "
    "dark:bg-[#1a1d23] dark:border-gray-700 dark:text-gray-300 "
    "dark:placeholder-gray-500 dark:focus:border-[#1ecb8b]"
)


class FournisseurForm(forms.ModelForm):

    class Meta:

        model = Fournisseur

        fields = [
            "nom",
            "raison_sociale",
            "telephone",
            "email",
            "adresse",
        ]


        widgets = {

            "nom": forms.TextInput(
                attrs={
                    "class": INPUT_CLASSES,
                    "placeholder": "Ex. Société ABC"
                }
            ),


            "raison_sociale": forms.TextInput(
                attrs={
                    "class": INPUT_CLASSES,
                    "placeholder": "Ex. ABC SARL"
                }
            ),


            "telephone": forms.TextInput(
                attrs={
                    "class": INPUT_CLASSES,
                    "placeholder": "Ex. +241 06 00 00 00"
                }
            ),


            "email": forms.EmailInput(
                attrs={
                    "class": INPUT_CLASSES,
                    "placeholder": "contact@entreprise.com"
                }
            ),


            "adresse": forms.Textarea(
                attrs={
                    "class": INPUT_CLASSES,
                    "rows": 3,
                    "placeholder": "Adresse complète du fournisseur"
                }
            ),

        }
    def clean_nom(self):
        nom = self.cleaned_data["nom"]

        if Fournisseur.objects.filter(
            nom__iexact=nom
        ).exists():

            raise forms.ValidationError(
                "Ce fournisseur existe déjà."
            )

        return nom