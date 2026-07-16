from django.urls import path
from . import views

app_name = "produits"

urlpatterns = [
    # Produits
    path("", views.liste_produits, name="liste_produits"),
    path("nouveau/", views.creer_produit, name="creer_produit"),
    path("<int:pk>/modifier/", views.modifier_produit, name="modifier_produit"),
    path("<int:pk>/supprimer/", views.supprimer_produit, name="supprimer_produit"),

    # Categories
    path("categories/", views.liste_categories, name="liste_categories"),
    path("categories/nouvelle/", views.creer_categorie, name="creer_categorie"),
    path("categories/<int:pk>/modifier/", views.modifier_categorie, name="modifier_categorie"),
    path("categories/<int:pk>/supprimer/", views.supprimer_categorie, name="supprimer_categorie"),
]