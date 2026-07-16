# Register your models here.
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User
from .forms import CustomUserCreationForm

# Register your models here.
@admin.register(User)
class CustomUserAdmin(UserAdmin):

    add_form = CustomUserCreationForm

    fieldsets = UserAdmin.fieldsets + (
        (
            "Informations supplémentaires",
            {
                "fields": (
                    "nom",
                    "prenom",
                    "telephone",
                    "role",
                )
            }
        ),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": (
                    "wide",
                ),
                "fields": (
                    "username",
                    "password1",
                    "password2",
                    "first_name",
                    "last_name",
                    "email",
                    "telephone",
                    "role",
                ),
            },
        ),
    )

    list_display = (
        "nom",
        "prenom",
        "username",
        "email",
        "role",
        "is_staff",
        "is_active",
    )