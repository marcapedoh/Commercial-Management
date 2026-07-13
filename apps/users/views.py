from django.shortcuts import redirect, render

# Create your views here. 
from django.contrib.auth import authenticate, login, logout
from django.contrib import messages
from django.contrib.auth.decorators import login_required

def login_view(request):
    if request.user.is_authenticated:
        return redirect('users:dashboard')
    
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            login(request, user)
            return redirect('users:dashboard')
        else:
            messages.error(request, 'Identifiants invalides. Veuillez réessayer.')
    
    return render(request, 'users/login.html')

def logout_view(request):
    logout(request)
    return redirect('users:login')

@login_required
def dashboard_view(request):
    return render(request, 'users/dashboard.html')