from django.urls import path
from . import views

app_name = "ventes"

urlpatterns = [
    path("", views.liste_ventes, name="liste_ventes"),
    path("nouveau/", views.creer_vente, name="creer_vente"),
    path("<int:pk>/", views.detail_vente, name="detail_vente"),
]