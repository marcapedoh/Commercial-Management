from django import forms
from .models import  Facture


INPUT_CLASSES = (
    "w-full rounded-lg px-3 py-2.5 text-sm transition focus:outline-none "
    "bg-white/60 border border-amber-200 text-neutral-700 placeholder-neutral-400 focus:border-amber-400 "
    "dark:bg-[#1a1d23] dark:border-gray-700 dark:text-gray-300 dark:placeholder-gray-500 dark:focus:border-[#1ecb8b]"
)


class FactureForm(forms.ModelForm):
    class Meta:
        model = Facture
        fields = ['fournisseur', 'numero', 'montant_ht', 'tva', 'montant_ttc', 'soldee']
        widgets = {
            'fournisseur': forms.Select(attrs={'class': INPUT_CLASSES}),
            'numero': forms.TextInput(attrs={'class': INPUT_CLASSES, 'placeholder': 'Ex. FACT-2026-045'}),
            'montant_ht': forms.NumberInput(attrs={'class': INPUT_CLASSES, 'step': '0.01', 'id': 'id_montant_ht'}),
            'tva': forms.NumberInput(attrs={'class': INPUT_CLASSES, 'step': '0.01', 'id': 'id_tva', 'readonly': 'readonly'}),
            'montant_ttc': forms.NumberInput(attrs={'class': INPUT_CLASSES, 'step': '0.01', 'id': 'id_montant_ttc', 'readonly': 'readonly'}),
            'soldee': forms.CheckboxInput(attrs={'class': 'w-4 h-4 rounded accent-amber-500 dark:accent-[#1ecb8b]'}),
        }