from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth.decorators import login_required

from .models import Achat
from .forms import AchatForm, LigneAchatFormSet


@login_required
def liste_achats(request):
    achats = Achat.objects.select_related("fournisseur").order_by("-date")
    return render(request, "achats/liste_achats.html", {"achats": achats})


@login_required
def creer_achat(request):
    if request.method == "POST":
        form = AchatForm(request.POST)
        formset = LigneAchatFormSet(request.POST)

        if form.is_valid() and formset.is_valid():
            achat = form.save(commit=False)
            achat.utilisateur = request.user
            achat.save()

            formset.instance = achat
            formset.save()

            # Mise à jour automatique du stock + calcul du montant total
            total = 0
            for ligne in achat.lignes.all():
                ligne.produit.stock_actuel += ligne.quantite
                ligne.produit.save()
                total += ligne.sous_total

            achat.total = total
            achat.save()

            messages.success(request, "Achat enregistré avec succès, le stock a été mis à jour.")
            return redirect("achats:liste_achats")
    else:
        form = AchatForm()
        formset = LigneAchatFormSet()

    return render(request, "achats/form_achat.html", {
        "form": form,
        "formset": formset,
        "titre": "Nouvel achat",
    })


@login_required
def detail_achat(request, pk):
    achat = get_object_or_404(Achat, pk=pk)
    return render(request, "achats/detail_achat.html", {"achat": achat})