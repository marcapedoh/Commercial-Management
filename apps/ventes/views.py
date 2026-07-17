import json
import base64
from decimal import Decimal
from io import BytesIO

from django.db import transaction
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.utils import timezone
from django.http import HttpResponse

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from django.contrib.auth.decorators import login_required

from apps.produits.models import Produit
from apps.stocks.models import MouvementStock
from apps.clients.models import Client
from .models import Vente, LigneVente
from .forms import VenteForm
# Create your views here.


@login_required
def vente_page_view(request):
    form = VenteForm()
    
    produits = Produit.objects.filter(
        actif=True
    ).order_by("designation")
    # Récupération des fournisseurs depuis la base
    ventes = Vente.objects.select_related("client").prefetch_related("lignes")
   
    ventes_json = []

       
    produits_json = []


    for produit in produits:

        produits_json.append({

            "id": produit.id,

            "nom": produit.designation,

            "category": (
                produit.categorie.nom
                if produit.categorie
                else "Sans catégorie"
            ),

            "price": float(produit.prix_vente),

            "stock": produit.stock_actuel,

            "status": (
                "active"
                if produit.actif
                else "inactive"
            ),


            "image": (
                produit.image.url
                if getattr(produit, "image", None)
                else ""
            )

        })
    produits_json = json.dumps(produits_json)


    for vente in ventes:

        ventes_json.append({

        "id": vente.id,

        "reference": vente.reference,

        "client": vente.client.nom,

        "date": vente.date.isoformat(),

        "nb_lignes": vente.lignes.count(),

        "has_facture": bool(vente.facture_pdf_base64),
        
        "marge_totale": float(vente.marge_totale),

        "total_ttc": float(vente.total_ttc),

        "utilisateur": vente.utilisateur.username,

        })
    ventes_json = json.dumps(ventes_json)

    return render(request, "ventes/vente.html",{
            "form": form,
            "ventes_json": ventes_json,
            "produits": produits,
            "produits_json": produits_json,
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

TVA_TAUX = Decimal('0.18')


def generer_reference_vente():
    date_str = timezone.now().strftime('%Y%m%d')
    dernier = Vente.objects.filter(reference__startswith=f'VTE-{date_str}').order_by('-id').first()
    numero = 1
    if dernier:
        try:
            numero = int(dernier.reference.split('-')[-1]) + 1
        except (ValueError, IndexError):
            numero = 1
    return f'VTE-{date_str}-{numero:03d}'


def fmt_fcfa(valeur):
    return f"{valeur:,.0f}".replace(',', ' ') + ' FCFA'


def generer_facture_pdf(vente):
    """Genere le PDF de la facture et retourne les bytes bruts."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=20*mm, bottomMargin=20*mm)
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle('LogoTitle', parent=styles['Heading1'], fontSize=22, textColor=colors.HexColor('#149766'))
    subtitle_style = ParagraphStyle('Subtitle', parent=styles['Normal'], fontSize=9, textColor=colors.HexColor('#78716c'))
    label_style = ParagraphStyle('Label', parent=styles['Normal'], fontSize=10)

    elements = []

    # EN-TETE / LOGO
    elements.append(Paragraph("GestFin", title_style))
    elements.append(Paragraph("Gestion commerciale et financière", subtitle_style))
    elements.append(Spacer(1, 14))

    elements.append(Paragraph(f"<b>Facture N°</b> {vente.reference}", label_style))
    elements.append(Paragraph(f"<b>Date</b> {vente.date.strftime('%d/%m/%Y %H:%M')}", label_style))
    if vente.client:
        elements.append(Paragraph(f"<b>Client</b> {vente.client.prenom} {vente.client.nom}", label_style))
        elements.append(Paragraph(f"<b>Téléphone</b> {vente.client.telephone}", label_style))
    elements.append(Spacer(1, 16))

    # TABLEAU DES ARTICLES
    data = [["Produit", "Qté", "Prix unitaire", "Total"]]
    for ligne in vente.lignes.all():
        data.append([
            ligne.produit.designation,
            str(ligne.quantite),
            fmt_fcfa(ligne.prix_vente_unitaire),
            fmt_fcfa(ligne.total_ligne),
        ])

    table = Table(data, colWidths=[70*mm, 20*mm, 40*mm, 40*mm])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#161b24')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e0d5')),
        ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
    ]))
    elements.append(table)
    elements.append(Spacer(1, 16))

    # TOTAUX
    totaux_data = [
        ["Total HT", fmt_fcfa(vente.total_ht)],
        [f"TVA ({int(TVA_TAUX * 100)}%)", fmt_fcfa(vente.tva)],
        ["Total TTC", fmt_fcfa(vente.total_ttc)],
    ]
    totaux_table = Table(totaux_data, colWidths=[130*mm, 40*mm])
    totaux_table.setStyle(TableStyle([
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('FONTNAME', (0, 2), (-1, 2), 'Helvetica-Bold'),
        ('LINEABOVE', (0, 2), (-1, 2), 1, colors.HexColor('#149766')),
        ('TOPPADDING', (0, 2), (-1, 2), 6),
    ]))
    elements.append(totaux_table)

    doc.build(elements)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes


@transaction.atomic
def ajouter_vente(request):
    if request.method == 'POST':
        form = VenteForm(request.POST)
        lignes_raw = request.POST.get('lignes_json', '[]')

        try:
            lignes_data = json.loads(lignes_raw)
        except (json.JSONDecodeError, TypeError):
            lignes_data = []

        if form.is_valid() and lignes_data:
            # Fusion des lignes cote serveur (meme regle qu'a l'achat)
            lignes_fusionnees = {}
            for ligne in lignes_data:
                pid = str(ligne.get('produit_id'))
                quantite = int(ligne.get('quantite', 0))
                prix_vente = Decimal(str(ligne.get('prix_vente_unitaire', 0)))
                if pid in lignes_fusionnees:
                    lignes_fusionnees[pid]['quantite'] += quantite
                    lignes_fusionnees[pid]['prix_vente_unitaire'] = prix_vente
                else:
                    lignes_fusionnees[pid] = {'quantite': quantite, 'prix_vente_unitaire': prix_vente}

            # Verification du stock disponible AVANT toute ecriture
            for pid, data in lignes_fusionnees.items():
                produit = get_object_or_404(Produit, pk=pid)
                if data['quantite'] > produit.stock_actuel:
                    messages.error(
                        request,
                        f"Stock insuffisant pour \"{produit.designation}\" "
                        f"(disponible : {produit.stock_actuel}, demandé : {data['quantite']})."
                    )
                    return redirect('ventes:creer_vente')

            vente = form.save(commit=False)
            vente.utilisateur = request.user
            vente.reference = generer_reference_vente()
            vente.save()

            total_ht = Decimal('0')
            marge_totale = Decimal('0')

            for pid, data in lignes_fusionnees.items():
                produit = Produit.objects.select_for_update().get(pk=pid)

                ligne = LigneVente.objects.create(
                    vente=vente,
                    produit=produit,
                    quantite=data['quantite'],
                    prix_vente_unitaire=data['prix_vente_unitaire'],
                    prix_achat_unitaire=produit.prix_achat,
                )

                # Decrement du stock du produit concerne
                produit.stock_actuel -= data['quantite']
                produit.save(update_fields=['stock_actuel'])

                # Mouvement de stock : sortie
                MouvementStock.objects.create(
                    produit=produit,
                    type='SORTIE',
                    quantite=data['quantite'],
                    utilisateur=request.user,
                )

                total_ht += ligne.total_ligne
                marge_totale += ligne.marge_ligne

            tva = (total_ht * TVA_TAUX).quantize(Decimal('0.01'))
            total_ttc = total_ht + tva

            vente.total_ht = total_ht
            vente.tva = tva
            vente.total_ttc = total_ttc
            vente.marge_totale = marge_totale
            vente.save()

            # Generation de la facture PDF -> base64 en base
            pdf_bytes = generer_facture_pdf(vente)
            vente.facture_pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
            vente.save(update_fields=['facture_pdf_base64'])

            messages.success(request, f"Vente {vente.reference} enregistrée. Facture générée.")
            return redirect('ventes:vente')

        messages.error(request, "Veuillez ajouter au moins un produit valide à la vente.")

    form = VenteForm()
    produits = Produit.objects.filter(actif=True).order_by('designation')
    clients = Client.objects.all().order_by('nom')
    return render(request, 'ventes/vente.html', {'form': form, 'produits': produits, 'clients': clients})


def apercu_facture(request, vente_id):
    """Affiche le PDF dans le navigateur (inline)."""
    vente = get_object_or_404(Vente, pk=vente_id)
    if not vente.facture_pdf_base64:
        return HttpResponse("Facture introuvable.", status=404)
    pdf_bytes = base64.b64decode(vente.facture_pdf_base64)
    response = HttpResponse(pdf_bytes, content_type='application/pdf')
    response['Content-Disposition'] = f'inline; filename="{vente.reference}.pdf"'
    return response


def telecharger_facture(request, vente_id):
    """Force le telechargement du PDF."""
    vente = get_object_or_404(Vente, pk=vente_id)
    if not vente.facture_pdf_base64:
        return HttpResponse("Facture introuvable.", status=404)
    pdf_bytes = base64.b64decode(vente.facture_pdf_base64)
    response = HttpResponse(pdf_bytes, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="{vente.reference}.pdf"'
    return response