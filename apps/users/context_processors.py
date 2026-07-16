def current_user(request):
    if request.user.is_authenticated:
        return {
            "user_data": {
                "id": request.user.id,
                "username": request.user.username,
                "first_name": request.user.first_name,
                "last_name": request.user.last_name,
                "email": request.user.email,
                "role": request.user.role,
            }
        }

    return {
        "user_data": None
    }