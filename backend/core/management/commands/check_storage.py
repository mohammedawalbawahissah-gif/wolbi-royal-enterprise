import uuid

import requests
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    """
    Round-trips a tiny file through the configured media storage:
    upload -> build public URL -> download it over HTTP -> delete.

    Run it locally after filling in the R2_* values in backend/.env, and again
    on Railway (service -> Console: `python manage.py check_storage`) after
    deploying, to prove uploads will work before anyone tries one for real.
    """

    help = "Verify media storage (Cloudflare R2) is configured and publicly readable."

    def add_arguments(self, parser):
        parser.add_argument(
            "--keep", action="store_true",
            help="Leave the test file in the bucket instead of deleting it.",
        )

    def handle(self, *args, **options):
        backend = settings.STORAGES["default"]["BACKEND"]
        self.stdout.write(f"Storage backend: {backend}")

        if not getattr(settings, "USE_R2", False):
            self.stdout.write(self.style.WARNING(
                "R2 is NOT active — files are saved to the local media/ folder.\n"
                "Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and "
                "R2_BUCKET_NAME in backend/.env to enable it."
            ))
            return

        self.stdout.write(f"Bucket:          {settings.R2_BUCKET_NAME}")
        self.stdout.write(f"Endpoint:        {settings.R2_ENDPOINT_URL}")
        self.stdout.write(
            f"Public domain:   {settings.R2_PUBLIC_DOMAIN or '(none — signed URLs)'}"
        )

        body = f"wolbi storage check {uuid.uuid4()}".encode()
        name = f"_healthcheck/{uuid.uuid4().hex}.txt"

        try:
            saved = default_storage.save(name, ContentFile(body))
        except Exception as exc:
            raise CommandError(
                f"Upload failed: {exc}\n"
                "Check the access key/secret, that the token has Object Read & "
                "Write on this bucket, and the bucket name/account ID."
            ) from exc
        self.stdout.write(self.style.SUCCESS(f"✔ Uploaded     {saved}"))

        url = default_storage.url(saved)
        self.stdout.write(f"  URL          {url}")

        try:
            resp = requests.get(url, timeout=15)
            if resp.status_code == 200 and resp.content == body:
                self.stdout.write(self.style.SUCCESS("✔ Public read OK — the frontend can display this URL"))
            else:
                self.stdout.write(self.style.ERROR(
                    f"✘ Download returned HTTP {resp.status_code}. "
                    "Uploads work, but browsers can't load the files yet. "
                    "If R2_PUBLIC_DOMAIN is set, make sure that domain is connected "
                    "to this bucket (R2 → bucket → Settings → Public access)."
                ))
        except requests.RequestException as exc:
            self.stdout.write(self.style.ERROR(f"✘ Could not fetch URL: {exc}"))

        if options["keep"]:
            self.stdout.write("Left test file in bucket (--keep).")
        else:
            default_storage.delete(saved)
            self.stdout.write(self.style.SUCCESS("✔ Deleted test file"))
