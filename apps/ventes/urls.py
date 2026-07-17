from django.urls import path
from . import views

app_name = 'ventes'

urlpatterns = [
    path('', views.vente_page_view, name='vente'),
    path('ajouter/', views.ajouter_vente, name='ajouter_vente'),
    path("<int:vente_id>/apercu/", views.apercu_facture, name="apercu_facture"),
    path("<int:vente_id>/telecharger/", views.telecharger_facture, name="telecharger_facture"),
]