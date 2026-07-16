from django import forms
from .models import Produit, Categorie

INPUT_CLASSES = (
    "w-full rounded-lg px-3 py-2.5 text-sm transition focus:outline-none "
    "bg-white/60 border border-amber-200 text-neutral-700 placeholder-neutral-400 focus:border-amber-400 "
    "dark:bg-[#1a1d23] dark:border-gray-700 dark:text-gray-300 dark:placeholder-gray-500 dark:focus:border-[#1ecb8b]"
)

class ProduitForm(forms.ModelForm):
    class Meta:
        model = Produit
        fields = [
            'designation', 'categorie', 'prix_achat', 'prix_vente',
            'stock_actuel', 'seuil_alerte', 'stock_securite', 'stock_min', 'actif',
        ]
        widgets = {
            
            'designation': forms.TextInput(attrs={'class': INPUT_CLASSES, 'placeholder': 'Ex. Clavier HP'}),
            'categorie': forms.Select(attrs={'class': INPUT_CLASSES, 'id': 'id_categorie'}),
            'prix_achat': forms.NumberInput(attrs={'class': INPUT_CLASSES, 'step': '0.01'}),
            'prix_vente': forms.NumberInput(attrs={'class': INPUT_CLASSES, 'step': '0.01'}),
            'stock_actuel': forms.NumberInput(attrs={'class': INPUT_CLASSES}),
            'seuil_alerte': forms.NumberInput(attrs={'class': INPUT_CLASSES}),
            'stock_securite': forms.NumberInput(attrs={'class': INPUT_CLASSES}),
            'stock_min': forms.NumberInput(attrs={'class': INPUT_CLASSES}),
            'actif': forms.CheckboxInput(attrs={'class': 'w-4 h-4 rounded accent-amber-500 dark:accent-[#1ecb8b]'}),
        }


class CategorieForm(forms.ModelForm):
    class Meta:
        model = Categorie
        fields = ['nom', 'description']
        widgets = {
            'nom': forms.TextInput(attrs={'class': INPUT_CLASSES, 'placeholder': 'Ex. Informatique'}),
            'description': forms.Textarea(attrs={'class': INPUT_CLASSES, 'rows': 3, 'placeholder': 'Description courte (optionnel)'}),
        }

    def clean_nom(self):

        nom = self.cleaned_data.get("nom")

        if Categorie.objects.filter(
            nom__iexact=nom
        ).exists():

            raise forms.ValidationError(
                "Cette catégorie existe déjà."
            )


        return nom