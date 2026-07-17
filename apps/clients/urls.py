from django.urls import path
from . import views

app_name = 'clients'

urlpatterns = [
    path('', views.client_page_view, name='client'),
    path('ajouter/', views.ajouter_client, name='ajouter_client'),
    #path( 'ajouter/',views.ajouter_produit, name='ajouter_produit'),
]