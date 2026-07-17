from django.shortcuts import render,redirect
from django.contrib.auth.decorators import login_required
from .forms import ClientForm
from .models import Client
import json
from django.contrib import messages
# Create your views here.


@login_required
def client_page_view(request):
    form = ClientForm()
    
    # Récupération des fournisseurs depuis la base
    clients = Client.objects.all()


   
    clients_json = []


    for client in clients:

        clients_json.append({

            "id": client.id,
            "nom": client.nom,
            "prenom": client.prenom,
            "telephone": client.telephone,
            "email": client.email,
            "adresse": client.adresse,

        })
    clients_json = json.dumps(clients_json)

    return render(request, "clients/client.html",{
            "form": form,
            "clients_json": clients_json,
    })

def ajouter_client(request):

    if request.method == "POST":

        form = ClientForm(request.POST)


        if form.is_valid():

            client = form.save()

            messages.success(
                request,
                f"Le client {client.nom} a été ajouté avec succès."
            )

        else:

            errors = []

            for field in form.errors.values():

                errors.extend(field)


            messages.error(
                request,
                " ".join(errors)
            )


        return redirect("clients:client")


    return redirect("clients:client")