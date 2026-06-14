from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),

    path("api/v1/auth/",          include("accounts.api.urls")),
    path("api/v1/core/",          include("core.api.urls")),
    path("api/v1/blog/",          include("blog.api.urls")),
    path("api/v1/services/",      include("services.api.urls")),
    path("api/v1/products/",      include("products.api.urls")),
    path("api/v1/projects/",      include("projects.api.urls")),
    path("api/v1/leads/",         include("leads.api.urls")),
    path("api/v1/assignments/",   include("assignments.api.urls")),
    path("api/v1/files/",         include("files.api.urls")),
    path("api/v1/notifications/", include("notifications.api.urls")),
    path("api/v1/newsletter/",    include("newsletter.api.urls")),
    path("api/v1/industries/",    include("industries.api.urls")),
    path("api/v1/foundation/",    include("foundation.api.urls")),
    path("api/v1/testimonials/",  include("testimonials.api.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
