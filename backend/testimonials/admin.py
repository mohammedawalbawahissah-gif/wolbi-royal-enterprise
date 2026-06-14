from django.contrib import admin
from .models import Testimonial


@admin.register(Testimonial)
class TestimonialAdmin(admin.ModelAdmin):
    list_display  = ("author_name", "author_company", "division", "rating", "featured", "is_approved")
    list_filter   = ("division", "featured", "is_approved")
    search_fields = ("author_name", "author_company", "quote")
