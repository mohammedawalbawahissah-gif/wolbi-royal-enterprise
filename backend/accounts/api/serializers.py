from rest_framework import serializers
from accounts.models import User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "phone",
            "profile_image",
            "job_title",
            "bio",
            "is_active",
            "date_joined",
        )


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = (
            "username",
            "email",
            "password",
            "first_name",
            "last_name",
            "phone",
        )

    def create(self, validated_data):
        password = validated_data.pop("password")
        # Public registration always creates CLIENT role
        user = User(**validated_data, role=User.Role.CLIENT)
        user.set_password(password)
        user.save()
        return user


class AdminCreateUserSerializer(serializers.ModelSerializer):
    """
    Used only by ADMIN users to create staff accounts (or other admins)
    with an explicit role. Public registration cannot set roles — this
    endpoint is the only way to create MEDICAL, VA, FOUNDATION, or ADMIN users.
    """
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = (
            "username",
            "email",
            "password",
            "first_name",
            "last_name",
            "phone",
            "role",
            "job_title",
        )

    def validate_role(self, value):
        valid_roles = [choice[0] for choice in User.Role.choices]
        if value not in valid_roles:
            raise serializers.ValidationError(
                f"Invalid role. Must be one of: {', '.join(valid_roles)}"
            )
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        # Staff roles get is_staff=True so they can access Django Admin if needed
        if validated_data.get("role") in ["ADMIN", "MEDICAL", "VA", "FOUNDATION"]:
            user.is_staff = True
        if validated_data.get("role") == "ADMIN":
            user.is_superuser = True
        user.save()
        return user


class UpdateProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "first_name",
            "last_name",
            "phone",
            "job_title",
            "bio",
            "profile_image",
        )


class AdminUpdateUserSerializer(serializers.ModelSerializer):
    """Used by ADMIN to update any user's role or active status."""
    class Meta:
        model = User
        fields = (
            "first_name",
            "last_name",
            "phone",
            "job_title",
            "role",
            "is_active",
        )

    def validate_role(self, value):
        valid_roles = [choice[0] for choice in User.Role.choices]
        if value not in valid_roles:
            raise serializers.ValidationError(
                f"Invalid role. Must be one of: {', '.join(valid_roles)}"
            )
        return value


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["username"] = user.username
        token["email"] = user.email
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = {
            "id": self.user.id,
            "username": self.user.username,
            "email": self.user.email,
            "role": self.user.role,
            "first_name": self.user.first_name,
            "last_name": self.user.last_name,
        }
        return data
