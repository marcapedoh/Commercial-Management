from django.urls import path
from . import views

app_name = 'produits'

urlpatterns = [
    path('', views.produit_page_view, name='produit'),
    path('categories/ajouter/', views.ajouter_categorie, name='ajouter_categorie'),
    path( 'ajouter/',views.ajouter_produit, name='ajouter_produit'),
]