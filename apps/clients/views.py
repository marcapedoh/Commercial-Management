from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db.models import Q, ProtectedError

from .models import Client
from .forms import ClientForm


@login_required
def liste_clients(request):
    clients = Client.objects.all().order_by("nom")

    q = request.GET.get("q", "")
    if q:
        clients = clients.filter(
            Q(nom__icontains=q) | Q(prenom__icontains=q) | Q(telephone__icontains=q)
        )

    return render(request, "clients/liste_clients.html", {
        "clients": clients,
        "q": q,
    })


@login_required
def creer_client(request):
    if request.method == "POST":
        form = ClientForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, "Client créé avec succès.")
            return redirect("clients:liste_clients")
    else:
        form = ClientForm()

    return render(request, "clients/form_client.html", {
        "form": form,
        "titre": "Nouveau client",
    })


@login_required
def modifier_client(request, pk):
    client = get_object_or_404(Client, pk=pk)

    if request.method == "POST":
        form = ClientForm(request.POST, instance=client)
        if form.is_valid():
            form.save()
            messages.success(request, "Client modifié avec succès.")
            return redirect("clients:liste_clients")
    else:
        form = ClientForm(instance=client)

    return render(request, "clients/form_client.html", {
        "form": form,
        "titre": f"Modifier {client.nom}",
    })


@login_required
def supprimer_client(request, pk):
    client = get_object_or_404(Client, pk=pk)

    if request.method == "POST":
        try:
            client.delete()
            messages.success(request, "Client supprimé.")
        except ProtectedError:
            messages.error(
                request,
                "Impossible de supprimer ce client : des ventes y sont encore rattachées."
            )
        return redirect("clients:liste_clients")

    return render(request, "clients/confirmer_suppression.html", {"client": client})


@login_required
def historique_client(request, pk):
    client = get_object_or_404(Client, pk=pk)
    ventes = client.vente_set.all().order_by("-date")

    return render(request, "clients/historique_client.html", {
        "client": client,
        "ventes": ventes,
    })