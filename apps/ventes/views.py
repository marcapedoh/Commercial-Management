from django.shortcuts import render

# Create your views here.
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth.decorators import login_required

from .models import Vente
from .forms import VenteForm, LigneVenteFormSet


@login_required
def liste_ventes(request):
    ventes = Vente.objects.select_related("client").order_by("-date")
    return render(request, "ventes/liste_ventes.html", {"ventes": ventes})


@login_required
def creer_vente(request):
    if request.method == "POST":
        form = VenteForm(request.POST)
        formset = LigneVenteFormSet(request.POST)

        if form.is_valid() and formset.is_valid():
            # Vérifier le stock disponible avant de valider la vente
            stock_insuffisant = []
            for ligne_form in formset:
                data = ligne_form.cleaned_data
                if not data or data.get("DELETE"):
                    continue
                produit = data.get("produit")
                quantite = data.get("quantite")
                if produit and quantite and produit.stock_actuel < quantite:
                    stock_insuffisant.append(produit.designation)

            if stock_insuffisant:
                messages.error(
                    request,
                    f"Stock insuffisant pour : {', '.join(stock_insuffisant)}."
                )
            else:
                vente = form.save(commit=False)
                vente.utilisateur = request.user
                vente.total = 0
                vente.save()

                formset.instance = vente
                lignes = formset.save(commit=False)

                total = 0
                for ligne in lignes:
                    ligne.prix_vente = ligne.produit.prix_vente
                    ligne.prix_achat = ligne.produit.prix_achat
                    ligne.save()

                    ligne.produit.stock_actuel -= ligne.quantite
                    ligne.produit.save()

                    total += ligne.prix_vente * ligne.quantite

                vente.total = total
                vente.save()

                messages.success(request, "Vente enregistrée, le stock a été mis à jour.")
                return redirect("ventes:liste_ventes")
    else:
        form = VenteForm()
        formset = LigneVenteFormSet()

    return render(request, "ventes/form_vente.html", {
        "form": form,
        "formset": formset,
        "titre": "Nouvelle vente",
    })


@login_required
def detail_vente(request, pk):
    vente = get_object_or_404(Vente, pk=pk)
    return render(request, "ventes/detail_vente.html", {"vente": vente})