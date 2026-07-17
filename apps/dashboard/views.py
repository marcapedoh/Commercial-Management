# ---------------------------------------------------------------------------
# Vue "dashboard" — à placer dans l'app où vit déjà ta vue actuelle
# (probablement apps/users/views.py puisque l'URL est 'users:dashboard').
# Remplace simplement ta fonction dashboard() existante par celle-ci,
# ou fusionne le contenu si tu as déjà d'autres éléments dedans.
# ---------------------------------------------------------------------------

import json
from decimal import Decimal
from datetime import timedelta

from django.contrib.auth.decorators import login_required
from django.db.models import Sum, F, ExpressionWrapper, DecimalField
from django.shortcuts import render
from django.utils import timezone

from apps.ventes.models import Vente, LigneVente
from apps.produits.models import Produit
from apps.achats.models import Achat
# Adapte ce chemin selon l'app réelle où vit MouvementStock chez toi
# from apps.stocks.models import MouvementStock


def _add_months(d, months):
    """Retourne le 1er jour du mois obtenu en ajoutant `months` mois à d."""
    month = d.month - 1 + months
    year = d.year + month // 12
    month = month % 12 + 1
    return d.replace(year=year, month=month, day=1)


def _to_float(value):
    return float(value) if value is not None else 0.0


@login_required
def dashboard(request):
    today = timezone.localdate()
    start_month = today.replace(day=1)
    start_year = today.replace(month=1, day=1)

    ventes_qs = Vente.objects.all()

    # =====================================================================
    # BENEFICES / CA — JOUR / MOIS / ANNEE (Fonctionnalité 3)
    # =====================================================================
    def agg_periode(start=None, end=None):
        qs = ventes_qs
        if start:
            qs = qs.filter(date__date__gte=start)
        if end:
            qs = qs.filter(date__date__lte=end)
        agg = qs.aggregate(ca=Sum('total_ttc'), marge=Sum('marge_totale'))
        return {'ca': agg['ca'] or Decimal('0'), 'marge': agg['marge'] or Decimal('0')}

    ca_jour = agg_periode(start=today, end=today)
    ca_mois = agg_periode(start=start_month, end=today)
    ca_annee = agg_periode(start=start_year, end=today)

    total_ca_global = ventes_qs.aggregate(s=Sum('total_ttc'))['s'] or Decimal('0')
    total_marge_global = ventes_qs.aggregate(s=Sum('marge_totale'))['s'] or Decimal('0')
    taux_marge_global = (total_marge_global / total_ca_global * 100) if total_ca_global else Decimal('0')

    # Achats du mois (pour la carte "Achats")
    achats_mois = Achat.objects.filter(date__gte=start_month, date__lte=today).aggregate(
        s=Sum('total')
    )['s'] or Decimal('0')

    # =====================================================================
    # FONCTIONNALITE 2 : VALORISATION FINANCIERE DU STOCK
    # Valeur du stock = Prix d'achat x Quantité restante
    # =====================================================================
    produits = list(Produit.objects.filter(actif=True))

    produits_valorises = []
    valeur_totale_stock = Decimal('0')
    for p in produits:
        valeur = (p.prix_achat or Decimal('0')) * (p.stock_actuel or 0)
        valeur_totale_stock += valeur
        produits_valorises.append({
            'id': p.id,
            'nom': p.designation,
            'valeur': _to_float(valeur),
            'stock': p.stock_actuel,
            'prix_achat': _to_float(p.prix_achat),
        })

    top10_valorisation = sorted(produits_valorises, key=lambda x: x['valeur'], reverse=True)[:10]

    # =====================================================================
    # FONCTIONNALITE 3 (suite) : PRODUITS + / - RENTABLES
    # =====================================================================
    marge_expr = ExpressionWrapper(
        (F('prix_vente_unitaire') - F('prix_achat_unitaire')) * F('quantite'),
        output_field=DecimalField(max_digits=14, decimal_places=2)
    )
    rentabilite = list(
        LigneVente.objects
        .values('produit__id', 'produit__designation')
        .annotate(marge_totale=Sum(marge_expr), quantite_vendue=Sum('quantite'))
        .order_by('-marge_totale')
    )
    top_rentables = rentabilite[:5]
    moins_rentables = sorted(rentabilite, key=lambda r: r['marge_totale'])[:5]

    # =====================================================================
    # FONCTIONNALITE 4 : PREVISION DE REAPPROVISIONNEMENT
    # basé sur la vente moyenne/jour des 30 derniers jours
    # =====================================================================
    depuis_30j = today - timedelta(days=30)
    ventes_recentes = (
        LigneVente.objects
        .filter(vente__date__date__gte=depuis_30j)
        .values('produit_id')
        .annotate(qte_totale=Sum('quantite'))
    )
    ventes_moyennes = {v['produit_id']: (v['qte_totale'] or 0) / 30 for v in ventes_recentes}

    reappro = []
    rotation_dormants = []
    for p in produits:
        moyenne = ventes_moyennes.get(p.id, 0)

        # --- Réappro (Fonctionnalité 4) ---
        if moyenne > 0:
            jours_restants = round(p.stock_actuel / moyenne, 1)
            if jours_restants <= 7:
                reappro.append({
                    'nom': p.designation,
                    'jours_restants': jours_restants,
                    'vente_moyenne': round(moyenne, 1),
                    'stock_actuel': p.stock_actuel,
                    'quantite_recommandee': max(0, round(moyenne * 15) - p.stock_actuel),
                })

        # --- Rotation / produits dormants (Fonctionnalité 6) ---
        derniere_ligne = (
            LigneVente.objects.filter(produit=p).order_by('-vente__date').first()
        )
        jours_derniere_vente = (today - derniere_ligne.vente.date.date()).days if derniere_ligne else None
        est_dormant = jours_derniere_vente is None or jours_derniere_vente > 90
        if est_dormant:
            rotation_dormants.append({
                'nom': p.designation,
                'jours_derniere_vente': jours_derniere_vente,
                'stock_actuel': p.stock_actuel,
            })

    reappro.sort(key=lambda x: x['jours_restants'])
    reappro = reappro[:10]
    rotation_dormants = rotation_dormants[:10]

    # =====================================================================
    # BILAN FINANCIER GLOBAL : ventes encaissées - achats décaissés
    # =====================================================================
    total_achats_global = Achat.objects.aggregate(s=Sum('total'))['s'] or Decimal('0')
    bilan = total_ca_global - total_achats_global
    en_profit = bilan >= 0

    # --- Relevé façon "relevé bancaire" (ventes = crédit, achats = débit) ---
    mouvements = []
    for v in ventes_qs.select_related('client').order_by('date'):
        mouvements.append((
            v.date,
            {
                'date': v.date.strftime('%d/%m/%Y %H:%M'),
                'libelle': f"Vente {v.reference}" + (f" — {v.client.nom}" if v.client else " — Client comptant"),
                'type': 'credit',
                'montant': _to_float(v.total_ttc),
            }
        ))
    for a in Achat.objects.select_related('fournisseur').order_by('date'):
        mouvements.append((
            timezone.make_aware(timezone.datetime.combine(a.date, timezone.datetime.min.time())),
            {
                'date': a.date.strftime('%d/%m/%Y'),
                'libelle': f"Achat {a.reference}" + (f" — {a.fournisseur.nom}" if a.fournisseur else ''),
                'type': 'debit',
                'montant': _to_float(a.total),
            }
        ))
    mouvements.sort(key=lambda m: m[0])

    solde = Decimal('0')
    releve = []
    for _, m in mouvements:
        if m['type'] == 'credit':
            solde += Decimal(str(m['montant']))
        else:
            solde -= Decimal(str(m['montant']))
        m['solde'] = _to_float(solde)
        releve.append(m)
    releve.reverse()  # les plus récents en premier

    # =====================================================================
    # ACTIVITES RECENTES (remplace le tableau statique)
    # =====================================================================
    activites_recentes = []
    for v in ventes_qs.select_related('client').order_by('-date')[:5]:
        activites_recentes.append({
            'reference': v.reference,
            'activity': f"Vente — {v.client.nom if v.client else 'Client comptant'}",
            'price': _to_float(v.total_ttc),
            'date': v.date.strftime('%d %b, %Y'),
        })

    # =====================================================================
    # GRAPHIQUE CA / MARGE SUR LES 8 DERNIERS MOIS
    # =====================================================================
    mois_labels, ca_mensuel, marge_mensuelle = [], [], []
    for i in range(7, -1, -1):
        mois_ref = _add_months(start_month, -i)
        mois_suivant = _add_months(start_month, -i + 1)
        agg = ventes_qs.filter(date__date__gte=mois_ref, date__date__lt=mois_suivant).aggregate(
            ca=Sum('total_ttc'), marge=Sum('marge_totale')
        )
        mois_labels.append(mois_ref.strftime('%b'))
        ca_mensuel.append(_to_float(agg['ca']))
        marge_mensuelle.append(_to_float(agg['marge']))

    chart_mensuel = {'labels': mois_labels, 'ca': ca_mensuel, 'marge': marge_mensuelle}

    context = {
        'user_data': request.user,

        # cartes stats principales (repositionnées sur les 4 mini-cards existantes)
        'ca_jour': ca_jour['ca'],
        'benefice_jour': ca_jour['marge'],
        'ca_mois': ca_mois['ca'],
        'benefice_mois': ca_mois['marge'],
        'benefice_annee': ca_annee['marge'],
        'achats_mois': achats_mois,
        'taux_marge_global': round(taux_marge_global, 1),

        # Fonctionnalité 2
        'valeur_totale_stock': valeur_totale_stock,
        'top10_valorisation': top10_valorisation,
        'top10_valorisation_json': json.dumps(top10_valorisation),

        # Fonctionnalité 3
        'top_rentables': top_rentables,
        'moins_rentables': moins_rentables,

        # Fonctionnalité 4
        'reappro': reappro,

        # Fonctionnalité 6
        'rotation_dormants': rotation_dormants,

        # Bilan financier + relevé
        'bilan': bilan,
        'en_profit': en_profit,
        'releve_json': json.dumps(releve),

        # activités récentes + graphique
        'activites_recentes': activites_recentes,
        'chart_mensuel_json': json.dumps(chart_mensuel),
    }

    return render(request, 'dashboard/dashboard.html', context)