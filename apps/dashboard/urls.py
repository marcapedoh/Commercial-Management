from django.urls import path
from .views import dashboard

app_name = "dashboards"

urlpatterns = [
    path( "",dashboard, name="dashboard"),
]