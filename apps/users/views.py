from django.shortcuts import redirect, render

# Create your views here. 
from django.contrib.auth import authenticate, login, logout
from django.contrib import messages
from django.urls import reverse
from django.contrib.auth.decorators import login_required

def login_view(request):

    if request.user.is_authenticated:
        return render(request, "users/login.html", {
            "redirect_url": reverse("users:dashboard")
        })

    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")

        user = authenticate(request, username=username, password=password)

        if user:
            login(request, user)

            messages.success(
                request,
                f"Bienvenue {user.username} 👋"
            )

            return render(
                request,
                "users/login.html",
                {
                    "redirect_url": reverse("users:dashboard")
                }
            )

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
    return render(request, 'dashboard/dashboard.html')