from django.urls import path
from . import views

app_name = "fournisseurs"

urlpatterns = [
    path("", views.liste_fournisseurs, name="liste_fournisseurs"),
    path("nouveau/", views.creer_fournisseur, name="creer_fournisseur"),
    path("<int:pk>/modifier/", views.modifier_fournisseur, name="modifier_fournisseur"),
    path("<int:pk>/supprimer/", views.supprimer_fournisseur, name="supprimer_fournisseur"),
    path("<int:pk>/historique/", views.historique_fournisseur, name="historique_fournisseur"),
]