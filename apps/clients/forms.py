from django import forms
from .models import Client


INPUT_CLASSES = (
    "w-full rounded-lg px-3 py-2.5 text-sm transition focus:outline-none "
    "bg-white/60 border border-amber-200 text-neutral-700 placeholder-neutral-400 "
    "focus:border-amber-400 "
    "dark:bg-[#1a1d23] dark:border-gray-700 dark:text-gray-300 "
    "dark:placeholder-gray-500 dark:focus:border-[#1ecb8b]"
)


class ClientForm(forms.ModelForm):
    class Meta:
        model = Client
        fields = ['nom', 'prenom', 'telephone', 'email', 'adresse']
        widgets = {
            'nom': forms.TextInput(attrs={'class': INPUT_CLASSES, 'placeholder': 'Ex. Kouassi'}),
            'prenom': forms.TextInput(attrs={'class': INPUT_CLASSES, 'placeholder': 'Ex. Aya'}),
            'telephone': forms.TextInput(attrs={'class': INPUT_CLASSES, 'placeholder': 'Ex. +228 90 11 22 33'}),
            'email': forms.EmailInput(attrs={'class': INPUT_CLASSES, 'placeholder': 'nom@mail.com'}),
            'adresse': forms.Textarea(attrs={'class': INPUT_CLASSES, 'rows': 3, 'placeholder': 'Adresse complète'}),
        }