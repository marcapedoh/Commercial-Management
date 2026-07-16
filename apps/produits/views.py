from django.shortcuts import redirect, render
import json
# Create your views here. 
from django.contrib.auth import authenticate, login, logout
from django.contrib import messages
from .models import Produit
from django.urls import reverse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
from .forms import CategorieForm,ProduitForm
from django.http import JsonResponse


@require_POST
def ajouter_categorie(request):

    form = CategorieForm(request.POST)

    if form.is_valid():

        categorie = form.save()

        return JsonResponse({
            "success": True,
            "id": categorie.id,
            "nom": categorie.nom,
            "message": f"La catégorie {categorie.nom} a été ajoutée."
        })


    return JsonResponse({
        "success": False,
        "errors": form.errors
    }, status=400)

def produit_page_view(request):

    categorie_added = False
    categorie_name = ""


    if request.session.get("categorie_added"):

        categorie_added = True
        categorie_name = request.session.get("categorie_name")


        del request.session["categorie_added"]
        del request.session["categorie_name"]



    # Récupération des produits depuis la base
    produits = Produit.objects.select_related(
        "categorie"
    ).all()


   
    produits_json = []


    for produit in produits:

        produits_json.append({

            "id": produit.id,

            "name": produit.designation,

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


    form = ProduitForm()

    categorie_form = CategorieForm()



    return render(
        request,
        "produits/catalogue.html",
        {
            "form": form,

            "categorie_form": categorie_form,


            # tes anciennes données conservées
            "categorie_added": categorie_added,

            "categorie_name": categorie_name,


            # nouvelles données pour JS
            "produits_json": produits_json,
        }
    )


def ajouter_produit(request):

    if request.method == "POST":

        form = ProduitForm(request.POST)


        if form.is_valid():

            produit = form.save()

            messages.success(
                request,
                f"Le produit {produit.designation} a été ajouté avec succès."
            )

        else:

            errors = []

            for field in form.errors.values():

                errors.extend(field)


            messages.error(
                request,
                " ".join(errors)
            )


        return redirect(
            "produits:produit"
        )


    return redirect(
        "produits:produit"
    )