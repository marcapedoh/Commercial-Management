# Create your views here.
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db.models import Q, ProtectedError

from .models import Categorie, Produit
from .forms import CategorieForm, ProduitForm


# ---------- PRODUITS ----------

@login_required
def liste_produits(request):
    produits = Produit.objects.select_related("categorie").all().order_by("designation")

    # Recherche multicritères
    q = request.GET.get("q", "")
    categorie_id = request.GET.get("categorie", "")

    if q:
        produits = produits.filter(
            Q(reference__icontains=q) | Q(designation__icontains=q)
        )

    if categorie_id:
        produits = produits.filter(categorie_id=categorie_id)

    context = {
        "produits": produits,
        "categories": Categorie.objects.all(),
        "q": q,
        "categorie_id": categorie_id,
    }
    return render(request, "produits/liste_produits.html", context)


@login_required
def creer_produit(request):
    if request.method == "POST":
        form = ProduitForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, "Produit créé avec succès.")
            return redirect("produits:liste_produits")
    else:
        form = ProduitForm()

    return render(request, "produits/form_produit.html", {
        "form": form,
        "titre": "Nouveau produit",
    })


@login_required
def modifier_produit(request, pk):
    produit = get_object_or_404(Produit, pk=pk)

    if request.method == "POST":
        form = ProduitForm(request.POST, instance=produit)
        if form.is_valid():
            form.save()
            messages.success(request, "Produit modifié avec succès.")
            return redirect("produits:liste_produits")
    else:
        form = ProduitForm(instance=produit)

    return render(request, "produits/form_produit.html", {
        "form": form,
        "titre": f"Modifier {produit.designation}",
    })


@login_required
def supprimer_produit(request, pk):
    produit = get_object_or_404(Produit, pk=pk)

    if request.method == "POST":
        produit.delete()
        messages.success(request, "Produit supprimé.")
        return redirect("produits:liste_produits")

    return render(request, "produits/confirmer_suppression.html", {"produit": produit})


# ---------- CATEGORIES ----------

@login_required
def liste_categories(request):
    categories = Categorie.objects.all().order_by("nom")
    return render(request, "produits/liste_categories.html", {"categories": categories})


@login_required
def creer_categorie(request):
    if request.method == "POST":
        form = CategorieForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, "Catégorie créée avec succès.")
            return redirect("produits:liste_categories")
    else:
        form = CategorieForm()

    return render(request, "produits/form_categorie.html", {
        "form": form,
        "titre": "Nouvelle catégorie",
    })


@login_required
def modifier_categorie(request, pk):
    categorie = get_object_or_404(Categorie, pk=pk)

    if request.method == "POST":
        form = CategorieForm(request.POST, instance=categorie)
        if form.is_valid():
            form.save()
            messages.success(request, "Catégorie modifiée avec succès.")
            return redirect("produits:liste_categories")
    else:
        form = CategorieForm(instance=categorie)

    return render(request, "produits/form_categorie.html", {
        "form": form,
        "titre": f"Modifier {categorie.nom}",
    })


@login_required
def supprimer_categorie(request, pk):
    categorie = get_object_or_404(Categorie, pk=pk)

    if request.method == "POST":
        try:
            categorie.delete()
            messages.success(request, "Catégorie supprimée.")
        except ProtectedError:
            messages.error(
                request,
                "Impossible de supprimer cette catégorie : des produits y sont encore rattachés."
            )
        return redirect("produits:liste_categories")

    return render(request, "produits/confirmer_suppression_categorie.html", {"categorie": categorie})