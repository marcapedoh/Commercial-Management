from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth.decorators import login_required
import json
from .models import Facture
from .forms import FactureForm
# Create your views here.


@login_required
def facture_page_view(request):
    form = FactureForm()
    
    factures = Facture.objects.all().order_by("numero")
    # Récupération des fournisseurs depuis la base
    
    factures_json = []


    for facture in factures:

        factures_json.append({

        "id": facture.id,

        "numero": facture.numero,

        "fournisseur": facture.fournisseur.nom if facture.fournisseur else None,

        "montant_ht": float(facture.montant_ht),

        "date": facture.date.isoformat(),

        "tva": float(facture.tva),

        "montant_ttc": float(facture.montant_ttc),

        "soldee": bool(facture.soldee),

       

        })
    factures_json = json.dumps(factures_json)

    return render(request, "factures/facture.html",{
            "form": form,
            "factures_json": factures_json,
    })



def ajouter_facture(request):
    if request.method == 'POST':
        form = FactureForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, "Facture fournisseur enregistrée avec succès.")
            return redirect('factures:facture')
        messages.error(request, "Veuillez corriger les erreurs du formulaire.")
    else:
        form = FactureForm()

    return render(request, 'factures/facture.html', {'form': form})
