from django.shortcuts import render,redirect
from django.contrib.auth.decorators import login_required
from .forms import FournisseurForm
from .models import Fournisseur
import json
from django.contrib import messages
# Create your views here.


@login_required
def fournisseur_page_view(request):
    form = FournisseurForm()
    
    # Récupération des fournisseurs depuis la base
    fournisseurs = Fournisseur.objects.all()


   
    fournisseurs_json = []


    for fournisseur in fournisseurs:

        fournisseurs_json.append({

            "id": fournisseur.id,
            "nom": fournisseur.nom,
            "raison_sociale": fournisseur.raison_sociale,
            "telephone": fournisseur.telephone,
            "email": fournisseur.email,
            "adresse":fournisseur.adresse,

        })
    fournisseurs_json = json.dumps(fournisseurs_json)

    return render(request, "fournisseurs/fournisseur.html",{
            "form": form,
            "fournisseurs_json": fournisseurs_json,
    })




def ajouter_fournisseur(request):

    if request.method == "POST":

        form = FournisseurForm(request.POST)


        if form.is_valid():

            fournisseur = form.save()

            messages.success(
                request,
                f"Le fournisseur {fournisseur.nom} a été ajouté avec succès."
            )

        else:

            errors = []

            for field in form.errors.values():

                errors.extend(field)


            messages.error(
                request,
                " ".join(errors)
            )


        return redirect("fournisseurs:fournisseur")


    return redirect("fournisseurs:fournisseur")