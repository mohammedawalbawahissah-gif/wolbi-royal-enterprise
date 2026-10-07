"""
Settings for running the test suite anywhere (no Postgres, no Resend, no R2):

    python manage.py test --settings=config.settings_test
"""
import os

os.environ.setdefault("SECRET_KEY", "test-only-secret-key")
os.environ.setdefault("DB_PASSWORD", "unused")

from .settings import *  # noqa: E402,F401,F403

DATABASES = {"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"}}
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
EMAIL_ASYNC = False
STAFF_ALERT_EMAILS = ["alerts@wolbiroyal.com"]
REPLY_TO_EMAIL = "hello@wolbiroyal.com"
SITE_URL = "https://wolbiroyal.com"
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.InMemoryStorage"},
    "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
}
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
