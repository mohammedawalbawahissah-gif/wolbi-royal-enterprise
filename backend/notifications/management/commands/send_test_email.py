from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from notifications.models import EmailLog
from notifications.services import EmailContent, send_email


class Command(BaseCommand):
    """
    Sends one branded test email synchronously and reports exactly what
    happened. Run locally or in Railway's Console:

        python manage.py send_test_email you@example.com
    """

    help = "Send a test email through the configured provider (Resend)."

    def add_arguments(self, parser):
        parser.add_argument("to", help="Address to send the test email to")

    def handle(self, *args, **options):
        settings.EMAIL_ASYNC = False  # wait for the result
        self.stdout.write(f"Backend:   {settings.EMAIL_BACKEND}")
        self.stdout.write(f"From:      {settings.DEFAULT_FROM_EMAIL}")
        self.stdout.write(f"Reply-To:  {settings.REPLY_TO_EMAIL or '(not set — replies go to the From address)'}")
        self.stdout.write(f"Staff inbox copies: {', '.join(settings.STAFF_ALERT_EMAILS) or '(none set)'}")
        if "resend" in settings.EMAIL_BACKEND.lower() and not settings.RESEND_API_KEY:
            raise CommandError("RESEND_API_KEY is not set.")

        log = send_email(
            options["to"],
            EmailContent(
                subject="Wolbi Royal email test",
                eyebrow="Test",
                heading="Email delivery is working",
                paragraphs=["If you can read this, wolbiroyal.com can send client and staff emails."],
                details=[("Sent from", settings.SITE_URL)],
                cta_label="Open wolbiroyal.com",
                cta_url=settings.SITE_URL,
            ),
            audience=EmailLog.Audience.STAFF,
            kind="test",
        )
        log.refresh_from_db()
        if log.status == EmailLog.Status.SENT:
            self.stdout.write(self.style.SUCCESS(
                f"✔ Sent to {log.to}" + (f" (Resend id {log.provider_id})" if log.provider_id else "")
            ))
        else:
            raise CommandError(
                f"✘ Failed: {log.error}\n"
                "Common causes: wolbiroyal.com not verified in Resend (Domains), "
                "wrong RESEND_API_KEY, or DEFAULT_FROM_EMAIL on an unverified domain."
            )
