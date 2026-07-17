import json
from decimal import Decimal
from django.db import transaction
from django.shortcuts import render, redirect
from django.contrib import messages
from django.utils import timezone
from django.contrib.auth.decorators import login_required
from apps.produits.models import Produit
from apps.stocks.models import MouvementStock
from .models import Achat, LigneAchat
from .forms import AchatForm
# Create your views here.


@login_required
def achat_page_view(request):
    form = AchatForm()
    
    produits = Produit.objects.filter(
        actif=True
    ).order_by("designation")
    # Récupération des fournisseurs depuis la base
    achats = Achat.objects.select_related("fournisseur","utilisateur").prefetch_related("lignes")
   
    achats_json = []


    for achat in achats:

        achats_json.append({

        "id": achat.id,

        "reference": achat.reference,

        "fournisseur": achat.fournisseur.nom,

        "date": achat.date.isoformat(),

        "nb_lignes": achat.lignes.count(),

        "total": float(achat.total),

        "utilisateur": achat.utilisateur.username,

        })
    achats_json = json.dumps(achats_json)

    return render(request, "achats/achat.html",{
            "form": form,
            "produits": produits,
            "achats_json": achats_json,
    })

# def ajouter_achat(request):

#     if request.method == "POST":

#         form = AchatForm(request.POST)


#         if form.is_valid():

#             client = form.save()

#             messages.success(
#                 request,
#                 f"L'achat {achat.nom} a été ajouté avec succès."
#             )

#         else:

#             errors = []

#             for field in form.errors.values():

#                 errors.extend(field)


#             messages.error(
#                 request,
#                 " ".join(errors)
#             )


#         return redirect("clients:client")


#     return redirect("clients:client")


def generer_reference_achat():
    date_str = timezone.now().strftime('%Y%m%d')
    dernier = Achat.objects.filter(reference__startswith=f'ACH-{date_str}').order_by('-id').first()
    numero = 1
    if dernier:
        try:
            numero = int(dernier.reference.split('-')[-1]) + 1
        except (ValueError, IndexError):
            numero = 1
    return f'ACH-{date_str}-{numero:03d}'


@transaction.atomic
def ajouter_achat(request):
    if request.method == 'POST':
        form = AchatForm(request.POST)
        lignes_raw = request.POST.get('lignes_json', '[]')

        try:
            lignes_data = json.loads(lignes_raw)
        except (json.JSONDecodeError, TypeError):
            lignes_data = []

        if form.is_valid() and lignes_data:
            # Sécurité supplémentaire côté serveur : on fusionne aussi ici
            # au cas où le JSON contiendrait malgré tout un produit en double.
            lignes_fusionnees = {}
            for ligne in lignes_data:
                pid = str(ligne.get('produit_id'))
                quantite = int(ligne.get('quantite', 0))
                prix = Decimal(str(ligne.get('prix_unitaire', 0)))
                if pid in lignes_fusionnees:
                    lignes_fusionnees[pid]['quantite'] += quantite
                    lignes_fusionnees[pid]['prix_unitaire'] = prix
                else:
                    lignes_fusionnees[pid] = {'quantite': quantite, 'prix_unitaire': prix}

            achat = form.save(commit=False)
            achat.utilisateur = request.user
            achat.reference = generer_reference_achat()
            achat.total = Decimal('0')
            achat.save()

            total = Decimal('0')
            for pid, data in lignes_fusionnees.items():
                if data['quantite'] <= 0:
                    continue

                produit = Produit.objects.select_for_update().get(pk=pid)

                LigneAchat.objects.create(
                    achat=achat,
                    produit=produit,
                    quantite=data['quantite'],
                    prix_unitaire=data['prix_unitaire'],
                )

                # Incrémentation du stock du produit concerné
                produit.stock_actuel += data['quantite']
                produit.save(update_fields=['stock_actuel'])

                # Traçabilité : un mouvement d'entrée par produit
                MouvementStock.objects.create(
                    produit=produit,
                    type='ENTREE',
                    quantite=data['quantite'],
                    utilisateur=request.user,
                )

                total += data['quantite'] * data['prix_unitaire']

            achat.total = total
            achat.save(update_fields=['total'])

            messages.success(request, f"Achat {achat.reference} enregistré avec succès.")
            return redirect("achats:achat")

        messages.error(request, "Veuillez ajouter au moins un produit valide à l'achat.")

    form = AchatForm()
    produits = Produit.objects.filter(actif=True).order_by('designation')
    return redirect("achats:achat")