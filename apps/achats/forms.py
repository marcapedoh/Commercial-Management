from django import forms
from .models import Achat


INPUT_CLASSES = (
    "w-full rounded-lg px-3 py-2.5 text-sm transition focus:outline-none "
    "bg-white/60 border border-amber-200 text-neutral-700 placeholder-neutral-400 focus:border-amber-400 "
    "dark:bg-[#1a1d23] dark:border-gray-700 dark:text-gray-300 dark:placeholder-gray-500 dark:focus:border-[#1ecb8b]"
)


class AchatForm(forms.ModelForm):
    class Meta:
        model = Achat
        fields = ['fournisseur']
        widgets = {
            'fournisseur': forms.Select(attrs={'class': INPUT_CLASSES}),
        }