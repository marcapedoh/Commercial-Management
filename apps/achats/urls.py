from django.urls import path
from . import views

app_name = "achats"

urlpatterns = [
    path("", views.liste_achats, name="liste_achats"),
    path("nouveau/", views.creer_achat, name="creer_achat"),
    path("<int:pk>/", views.detail_achat, name="detail_achat"),
]