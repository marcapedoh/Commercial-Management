from django.urls import path
from . import views

app_name = 'fournisseurs'

urlpatterns = [
    path('', views.fournisseur_page_view, name='fournisseur'),
    path('ajouter/', views.ajouter_fournisseur, name='ajouter_fournisseur'),
    #path( 'ajouter/',views.ajouter_produit, name='ajouter_produit'),
]