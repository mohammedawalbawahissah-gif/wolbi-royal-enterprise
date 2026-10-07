from pathlib import Path
from datetime import timedelta
from decouple import config, Csv

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config("SECRET_KEY")
DEBUG = config("DEBUG", default=False, cast=bool)
ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="localhost", cast=Csv())

INSTALLED_APPS = [
    "accounts",

    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    "rest_framework",
    "corsheaders",
    "django_filters",
    "storages",

    "core",
    "blog",
    "services",
    "products",
    "projects",
    "leads",
    "assignments",
    "files",
    "notifications",
    "newsletter",
    "industries",
    "foundation",
    "testimonials",
    "teleconsultations",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

CORS_ALLOWED_ORIGINS = config("CORS_ALLOWED_ORIGINS", default="http://localhost:3000", cast=Csv())
CORS_ALLOW_CREDENTIALS = True

# Origins allowed to POST to Django admin / session views over HTTPS
# (needed once the site is served from https://wolbiroyal.com)
CSRF_TRUSTED_ORIGINS = config("CSRF_TRUSTED_ORIGINS", default="http://localhost:3000", cast=Csv())

# Railway terminates TLS at its edge and forwards plain HTTP to gunicorn;
# trust its X-Forwarded-Proto header so Django knows the request was HTTPS.
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

DB_SCHEMA = config("DB_SCHEMA", default="public")

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": config("DB_NAME", default="wolbi_db"),
        "USER": config("DB_USER", default="wolbi_admin"),
        "PASSWORD": config("DB_PASSWORD"),
        "HOST": config("DB_HOST", default="localhost"),
        "PORT": config("DB_PORT", default="5432"),
        "OPTIONS": {
            "options": f"-c search_path={DB_SCHEMA}"
        },
    }
}

AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Africa/Accra"
USE_I18N = True
USE_TZ = True

# ─── Static & Media Storage ───────────────────────────────────────────────────
# Django 5.1+ removed DEFAULT_FILE_STORAGE / STATICFILES_STORAGE — the STORAGES
# dict below is the only setting Django reads. (The old Cloudinary setting was
# silently ignored, so uploads were landing on Railway's ephemeral disk.)
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# Cloudflare R2 (S3-compatible). Media goes to R2 when the credentials are set;
# otherwise it falls back to the local media/ folder (handy for offline dev).
R2_ACCOUNT_ID        = config("R2_ACCOUNT_ID", default="")
R2_ACCESS_KEY_ID     = config("R2_ACCESS_KEY_ID", default="")
R2_SECRET_ACCESS_KEY = config("R2_SECRET_ACCESS_KEY", default="")
R2_BUCKET_NAME       = config("R2_BUCKET_NAME", default="")
# Public host serving the bucket, e.g. media.wolbiroyal.com (custom domain
# connected to the bucket) or pub-xxxx.r2.dev. Leave empty for a private bucket:
# files are then served through signed URLs that expire after R2_URL_EXPIRY secs.
R2_PUBLIC_DOMAIN     = config("R2_PUBLIC_DOMAIN", default="").removeprefix("https://").rstrip("/")
R2_URL_EXPIRY        = config("R2_URL_EXPIRY", default=3600, cast=int)
# Override only to point at another S3-compatible endpoint (e.g. local testing)
R2_ENDPOINT_URL      = config(
    "R2_ENDPOINT_URL",
    default=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com" if R2_ACCOUNT_ID else "",
)

USE_R2 = bool(R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY and R2_BUCKET_NAME and R2_ENDPOINT_URL)

if USE_R2:
    from botocore.config import Config as _BotoConfig

    _media_storage = {
        "BACKEND": "storages.backends.s3.S3Storage",
        "OPTIONS": {
            "bucket_name": R2_BUCKET_NAME,
            "endpoint_url": R2_ENDPOINT_URL,
            "access_key": R2_ACCESS_KEY_ID,
            "secret_key": R2_SECRET_ACCESS_KEY,
            "region_name": "auto",
            "default_acl": None,          # R2 has no per-object ACLs
            "file_overwrite": False,      # same filename → unique suffix, never clobber
            "custom_domain": R2_PUBLIC_DOMAIN or None,
            "querystring_auth": not R2_PUBLIC_DOMAIN,
            "querystring_expire": R2_URL_EXPIRY,
            "object_parameters": {"CacheControl": "public, max-age=86400"},
            # (django-storages ignores its own signature_version/addressing_style
            # options once client_config is given, so they live here.)
            # Newer boto3 adds checksum headers by default; only send them when
            # an operation requires it to stay compatible with R2.
            "client_config": _BotoConfig(
                signature_version="s3v4",
                s3={"addressing_style": "path"},
                request_checksum_calculation="when_required",
                response_checksum_validation="when_required",
            ),
        },
    }
else:
    _media_storage = {"BACKEND": "django.core.files.storage.FileSystemStorage"}

STORAGES = {
    "default": _media_storage,
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
}

# ─── REST Framework ───────────────────────────────────────────────────────────
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.AllowAny",
    ),
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# ─── Email via Resend ─────────────────────────────────────────────────────────
# ─── Email via Resend (HTTP API, not SMTP — see core/services/mail_backend.py) ─
EMAIL_BACKEND = "core.services.mail_backend.ResendAPIBackend"
RESEND_API_KEY = config("RESEND_API_KEY", default="")
# Sender shown to recipients. The domain (wolbiroyal.com) must be verified in Resend.
EMAIL_FROM_NAME = config("EMAIL_FROM_NAME", default="Wolbi Royal Enterprise")
_from_address = config("DEFAULT_FROM_EMAIL", default="noreply@wolbiroyal.com")
DEFAULT_FROM_EMAIL = _from_address if "<" in _from_address else f"{EMAIL_FROM_NAME} <{_from_address}>"
# Where client replies land — a real inbox someone reads (noreply@ is never read).
REPLY_TO_EMAIL = config("REPLY_TO_EMAIL", default="")
# Extra inbox(es) that receive a copy of every staff alert (new requests,
# bookings, volunteers), on top of each staff user's own email. Comma-separated.
STAFF_ALERT_EMAILS = config("STAFF_ALERT_EMAILS", default="", cast=Csv())
# Public site, used to build links inside emails.
SITE_URL = config("SITE_URL", default="https://wolbiroyal.com").rstrip("/")
# Send emails in a background thread so requests never wait on Resend.
# Tests set this to False to send synchronously.
EMAIL_ASYNC = config("EMAIL_ASYNC", default=True, cast=bool)
if not RESEND_API_KEY and DEBUG:
    # Local dev without a Resend key: print emails to the terminal instead.
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# ─── AI (Anthropic Claude) ─────────────────────────────────────────────────────
ANTHROPIC_API_KEY = config("ANTHROPIC_API_KEY", default="")
ANTHROPIC_MODEL = config("ANTHROPIC_MODEL", default="claude-sonnet-5")

# ─── Video (Daily.co) ──────────────────────────────────────────────────────
DAILY_API_KEY = config("DAILY_API_KEY", default="")

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
