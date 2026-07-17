from django.urls import path
from . import views

app_name = 'factures'

urlpatterns = [
    path('', views.facture_page_view, name='facture'),
    path('ajouter/', views.ajouter_facture, name='ajouter_facture'),
    #path( 'ajouter/',views.ajouter_produit, name='ajouter_produit'),
]