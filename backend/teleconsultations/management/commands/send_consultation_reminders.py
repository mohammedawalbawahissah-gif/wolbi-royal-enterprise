from django.core.management.base import BaseCommand

from teleconsultations.scheduling import run_housekeeping


class Command(BaseCommand):
    """
    Sends reminders for teleconsultations starting soon and closes out sessions
    nobody picked up. Schedule it to run every 10 minutes:

        python manage.py send_consultation_reminders
    """

    help = "Send teleconsultation reminders and tidy up unclaimed/missed sessions."

    def handle(self, *args, **options):
        done = run_housekeeping()
        self.stdout.write(self.style.SUCCESS(
            "Reminders sent: {reminders} · missed: {missed} · "
            "unconfirmed closed: {expired_unconfirmed} · instant closed: {expired_instant} · "
            "auto-completed: {closed}".format(**done)
        ))
