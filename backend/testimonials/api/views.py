from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from ..models import Testimonial
from .serializers import TestimonialSerializer
from accounts.permissions import IsAdmin
from core.services.ai import ask_ai, AIServiceUnavailable


class TestimonialViewSet(viewsets.ModelViewSet):
    queryset = Testimonial.objects.filter(is_approved=True)
    serializer_class = TestimonialSerializer

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy", "ai_polish"]:
            return [IsAdmin()]
        return [AllowAny()]

    def get_queryset(self):
        # Admins reviewing submissions need to see unapproved ones too.
        if self.action in ["retrieve", "update", "partial_update", "list"] and \
                self.request.user.is_authenticated and self.request.user.role == "ADMIN":
            return Testimonial.objects.all()
        return Testimonial.objects.filter(is_approved=True)

    @action(detail=True, methods=["post"])
    def ai_polish(self, request, pk=None):
        """
        Suggests a tightened, publish-ready version of a raw submitted quote.
        Returned for review only — never overwrites the original automatically,
        since it's someone else's words and approval must stay a human step.
        """
        testimonial = self.get_object()
        try:
            polished = ask_ai(
                system_prompt=(
                    "You lightly copy-edit a client testimonial for a company website: fix grammar, "
                    "tighten wording, keep it in first person and keep the same meaning and sentiment. "
                    "Never invent claims, numbers, or details that aren't in the original. Return only "
                    "the edited quote, 1-3 sentences, no quotation marks."
                ),
                user_prompt=testimonial.quote,
                max_tokens=200,
            )
        except AIServiceUnavailable as e:
            return Response({"error": str(e)}, status=503)
        return Response({"polished_quote": polished, "original_quote": testimonial.quote})
