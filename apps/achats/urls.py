from django.urls import path
from . import views

app_name = 'achats'

urlpatterns = [
    path('', views.achat_page_view, name='achat'),
    path('ajouter/', views.ajouter_achat, name='ajouter_achat'),
    #path( 'ajouter/',views.ajouter_produit, name='ajouter_produit'),
]