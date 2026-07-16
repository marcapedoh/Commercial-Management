from django.shortcuts import render

# Create your views here.
from django.shortcuts import redirect, render

# Create your views here.
from django.contrib.auth import authenticate, login, logout
from django.contrib import messages
from django.urls import reverse
from django.contrib.auth.decorators import login_required

def login_view(request):
    if request.user.is_authenticated:
        
        return redirect("users:dashboard")

    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")
        print(f"username{ username}, pass {password}")
        user = authenticate(request, username=username, password=password)

        if user:
            login(request, user)

            messages.success(
                request,
                f"Bienvenue {user.username} 👋"
            )

            return redirect("users:dashboard")
                
                


        messages.error(
            request,
            "Identifiants invalides."
        )

    return render(request, "users/login.html")

def logout_view(request):
    logout(request)
    return redirect('users:login')

@login_required
def dashboard_view(request):
    return render(request, 'index.html')