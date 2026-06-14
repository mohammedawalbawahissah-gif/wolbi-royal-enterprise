from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterView,
    ProfileView,
    UpdateProfileView,
    CustomTokenObtainPairView,
    UserListView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/",    CustomTokenObtainPairView.as_view(), name="login"),
    path("refresh/",  TokenRefreshView.as_view(), name="token_refresh"),
    path("profile/",  ProfileView.as_view(), name="profile"),
    path("profile/update/", UpdateProfileView.as_view(), name="profile_update"),
    path("users/",    UserListView.as_view(), name="users"),
]
