from rest_framework import generics, permissions
from accounts.models import User
from accounts.permissions import IsAdmin
from .serializers import (
    UserSerializer,
    RegisterSerializer,
    AdminCreateUserSerializer,
    UpdateProfileSerializer,
    AdminUpdateUserSerializer,
    CustomTokenObtainPairSerializer,
)
from rest_framework_simplejwt.views import TokenObtainPairView


class RegisterView(generics.CreateAPIView):
    """Public registration — always creates CLIENT role."""
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class AdminCreateUserView(generics.CreateAPIView):
    """
    Admin-only endpoint to create staff users with any role —
    ADMIN, MEDICAL, VA, FOUNDATION, or CLIENT.
    This replaces the need to use `createsuperuser` or Django Admin
    for every new staff account.
    """
    queryset = User.objects.all()
    serializer_class = AdminCreateUserSerializer
    permission_classes = [IsAdmin]


class ProfileView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class UpdateProfileView(generics.UpdateAPIView):
    serializer_class = UpdateProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class UserListView(generics.ListAPIView):
    queryset = User.objects.all().order_by("-date_joined")
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]


class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Admin can view, update role/status, or deactivate any user."""
    queryset = User.objects.all()
    serializer_class = AdminUpdateUserSerializer
    permission_classes = [IsAdmin]

    def perform_destroy(self, instance):
        # Soft-delete: deactivate rather than hard delete, to preserve
        # foreign key relationships (assignments, leads, blog posts, etc.)
        instance.is_active = False
        instance.save()
