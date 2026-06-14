from rest_framework import viewsets
from ..models import Product
from .serializers import ProductSerializer, ProductWriteSerializer
from accounts.permissions import IsStaff


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.filter(active=True).order_by("sort_order")

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return ProductWriteSerializer
        return ProductSerializer

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsStaff()]
        return []
