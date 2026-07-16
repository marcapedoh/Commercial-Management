from django.shortcuts import redirect, render

# Create your views here. 
from django.contrib.auth import authenticate, login, logout
from django.contrib import messages
from django.urls import reverse
from django.contrib.auth.decorators import login_required


def produit_page_view(request):
    return render(request, 'produits/catalogue.html')