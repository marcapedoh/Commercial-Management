from django.urls import path
from . import views

app_name = "clients"

urlpatterns = [
    path("", views.liste_clients, name="liste_clients"),
    path("nouveau/", views.creer_client, name="creer_client"),
    path("<int:pk>/modifier/", views.modifier_client, name="modifier_client"),
    path("<int:pk>/supprimer/", views.supprimer_client, name="supprimer_client"),
    path("<int:pk>/historique/", views.historique_client, name="historique_client"),
]