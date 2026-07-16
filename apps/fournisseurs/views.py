from django.shortcuts import render

# Create your views here.
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db.models import Q, ProtectedError

from .models import Fournisseur
from .forms import FournisseurForm


@login_required
def liste_fournisseurs(request):
    fournisseurs = Fournisseur.objects.all().order_by("nom")

    q = request.GET.get("q", "")
    if q:
        fournisseurs = fournisseurs.filter(
            Q(nom__icontains=q) | Q(ville__icontains=q) | Q(email__icontains=q)
        )

    return render(request, "fournisseurs/liste_fournisseurs.html", {
        "fournisseurs": fournisseurs,
        "q": q,
    })


@login_required
def creer_fournisseur(request):
    if request.method == "POST":
        form = FournisseurForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, "Fournisseur créé avec succès.")
            return redirect("fournisseurs:liste_fournisseurs")
    else:
        form = FournisseurForm()

    return render(request, "fournisseurs/form_fournisseur.html", {
        "form": form,
        "titre": "Nouveau fournisseur",
    })


@login_required
def modifier_fournisseur(request, pk):
    fournisseur = get_object_or_404(Fournisseur, pk=pk)

    if request.method == "POST":
        form = FournisseurForm(request.POST, instance=fournisseur)
        if form.is_valid():
            form.save()
            messages.success(request, "Fournisseur modifié avec succès.")
            return redirect("fournisseurs:liste_fournisseurs")
    else:
        form = FournisseurForm(instance=fournisseur)

    return render(request, "fournisseurs/form_fournisseur.html", {
        "form": form,
        "titre": f"Modifier {fournisseur.nom}",
    })


@login_required
def supprimer_fournisseur(request, pk):
    fournisseur = get_object_or_404(Fournisseur, pk=pk)

    if request.method == "POST":
        try:
            fournisseur.delete()
            messages.success(request, "Fournisseur supprimé.")
        except ProtectedError:
            messages.error(
                request,
                "Impossible de supprimer ce fournisseur : des achats y sont encore rattachés."
            )
        return redirect("fournisseurs:liste_fournisseurs")

    return render(request, "fournisseurs/confirmer_suppression.html", {"fournisseur": fournisseur})


@login_required
def historique_fournisseur(request, pk):
    """Historique des livraisons (achats) d'un fournisseur."""
    fournisseur = get_object_or_404(Fournisseur, pk=pk)
    achats = fournisseur.achat_set.all().order_by("-date")

    return render(request, "fournisseurs/historique_fournisseur.html", {
        "fournisseur": fournisseur,
        "achats": achats,
    })