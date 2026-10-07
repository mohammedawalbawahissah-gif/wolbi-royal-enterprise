"""
End-to-end tests for client emails and staff notifications.

Run:  python manage.py test notifications --settings=config.settings_test
"""
from datetime import timedelta
from unittest import mock

from django.core import mail
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import User
from assignments.models import Assignment
from leads.models import Lead, LeadReply
from notifications.models import EmailLog, Notification
from teleconsultations.models import ConsultationSession


def emails_to(address):
    return [m for m in mail.outbox if address in m.to]


class Base(TestCase):
    def setUp(self):
        # AI triage runs in a thread against the real DB; not needed here
        patcher = mock.patch.object(Lead, "_run_ai_triage", lambda self: None)
        patcher.start()
        self.addCleanup(patcher.stop)

        self.client = APIClient()
        self.admin = User.objects.create_user("admin", "admin@wolbiroyal.com", "x", role="ADMIN", first_name="Ama")
        self.medic = User.objects.create_user("medic", "medic@wolbiroyal.com", "x", role="MEDICAL")
        self.va = User.objects.create_user("va", "va@wolbiroyal.com", "x", role="VA")
        self.found = User.objects.create_user("found", "found@wolbiroyal.com", "x", role="FOUNDATION")


class LeadTests(Base):
    def post_lead(self, **extra):
        data = {"name": "Kofi Mensah", "email": "kofi@example.com", "phone": "0240000000",
                "subject": "Website help", "message": "I need a website for my shop.",
                "inquiry_type": "GENERAL", **extra}
        return self.client.post("/api/v1/leads/", data, format="json")

    def test_contact_form_emails_client_and_alerts_staff(self):
        res = self.post_lead()
        self.assertEqual(res.status_code, 201)

        client_mail = emails_to("kofi@example.com")
        self.assertEqual(len(client_mail), 1)
        m = client_mail[0]
        self.assertIn("received your message", m.subject)
        self.assertIn("Hi Kofi", m.body)
        self.assertIn("I need a website", m.body)           # their message echoed back
        self.assertEqual(m.reply_to, ["hello@wolbiroyal.com"])
        self.assertIn("text/html", m.alternatives[0][1])

        # General lead → admins only (in-app + email) + alert inbox
        self.assertEqual(Notification.objects.filter(user=self.admin, kind="LEAD").count(), 1)
        self.assertFalse(Notification.objects.filter(user=self.medic).exists())
        self.assertEqual(len(emails_to("admin@wolbiroyal.com")), 1)
        self.assertEqual(len(emails_to("alerts@wolbiroyal.com")), 1)
        self.assertEqual(len(emails_to("medic@wolbiroyal.com")), 0)
        self.assertEqual(EmailLog.objects.filter(status="SENT").count(), 3)

    def test_medical_booking_routes_to_medical_and_keeps_health_details_out(self):
        self.post_lead(subject="Service Booking: Lab Diagnostics", inquiry_type="MEDICAL",
                       message="Symptoms: persistent fever")
        m = emails_to("kofi@example.com")[0]
        self.assertIn("received your booking", m.subject)
        self.assertNotIn("persistent fever", m.body)
        self.assertIn("haven't repeated your health details", m.body)
        self.assertTrue(Notification.objects.filter(user=self.medic).exists())
        self.assertTrue(Notification.objects.filter(user=self.admin).exists())
        # Staff still see the full message
        self.assertIn("persistent fever", emails_to("medic@wolbiroyal.com")[0].body)

    def test_each_form_gets_its_own_wording(self):
        cases = {
            "Schedule a Call: Strategy": "call request",
            "Demo Request: NeoMatCare": "demo request",
            "Partnership Inquiry: NGO": "partnership interest",
            "Service Request: Web App": "service request",
        }
        for subject, phrase in cases.items():
            mail.outbox.clear()
            self.post_lead(subject=subject)
            self.assertIn(phrase, emails_to("kofi@example.com")[0].subject, subject)

    def test_ai_concierge_handoff(self):
        Lead.objects.create(name="Esi", email="esi@example.com", subject="AI Concierge escalation",
                            message="Wants pricing", inquiry_type="GENERAL")
        self.assertEqual(Notification.objects.get(user=self.admin).kind, "LEAD_ESCALATION")
        self.assertIn("follow up", emails_to("esi@example.com")[0].subject)

    def test_user_input_is_html_escaped(self):
        self.post_lead(name="<script>alert(1)</script>")
        html = emails_to("kofi@example.com")[0].alternatives[0][0]
        self.assertNotIn("<script>alert", html)
        self.assertIn("&lt;script&gt;", html)

    def test_email_failure_never_breaks_the_form(self):
        with mock.patch("django.core.mail.EmailMultiAlternatives.send", side_effect=RuntimeError("Resend down")):
            res = self.post_lead()
        self.assertEqual(res.status_code, 201)
        self.assertTrue(EmailLog.objects.filter(status="FAILED", error__contains="Resend down").exists())

    def test_staff_can_turn_off_email_but_keep_in_app(self):
        self.admin.email_notifications = False
        self.admin.save()
        self.post_lead()
        self.assertEqual(len(emails_to("admin@wolbiroyal.com")), 0)
        self.assertTrue(Notification.objects.filter(user=self.admin).exists())

    def test_staff_reply_goes_to_client_with_reply_to_staff(self):
        self.post_lead()
        lead = Lead.objects.get()
        mail.outbox.clear()
        self.client.force_authenticate(self.admin)
        res = self.client.post(f"/api/v1/leads/{lead.pk}/reply/", {"message": "Happy to help!"}, format="json")
        self.assertEqual(res.status_code, 201)
        m = emails_to("kofi@example.com")[0]
        self.assertEqual(m.subject, "Re: Website help")
        self.assertIn("Happy to help!", m.body)
        self.assertEqual(m.reply_to, ["admin@wolbiroyal.com"])
        self.assertTrue(LeadReply.objects.get().email_sent)


class TeleconsultationTests(Base):
    def request(self, mode="INSTANT", reason="I need a lab test for malaria"):
        data = {"name": "Abena", "email": "abena@example.com", "reason": reason, "mode": mode}
        if mode == "SCHEDULED":
            data["scheduled_time"] = (timezone.now() + timedelta(days=2)).isoformat()
        return self.client.post("/api/v1/teleconsultations/request/", data, format="json")

    def test_instant_request_full_lifecycle(self):
        self.medic.is_available_for_calls = True
        self.medic.save()
        res = self.request()
        self.assertEqual(res.status_code, 201)
        session = ConsultationSession.objects.get()

        m = emails_to("abena@example.com")[0]
        self.assertIn("connecting you", m.subject)
        self.assertIn(f"session={session.pk}&token={session.access_token}", m.body)
        # Only the available medical staffer is alerted (plus the alert inbox)
        self.assertTrue(Notification.objects.filter(user=self.medic, kind="TELECONSULTATION").exists())
        self.assertFalse(Notification.objects.filter(user=self.admin).exists())

        # Staff claims → client gets the join email
        self.client.force_authenticate(self.medic)
        with mock.patch("teleconsultations.api.views.create_room",
                        return_value={"name": "room-1", "url": "https://wolbi.daily.co/room-1"}):
            self.assertEqual(self.client.post(f"/api/v1/teleconsultations/sessions/{session.pk}/claim/").status_code, 200)
        self.assertIn("specialist is ready", emails_to("abena@example.com")[-1].subject)

        # Client can join with the token from the email (no email typed)
        self.client.force_authenticate(None)
        with mock.patch("teleconsultations.api.views.create_meeting_token", return_value="tok"):
            ok = self.client.post(f"/api/v1/teleconsultations/{session.pk}/join/",
                                  {"token": session.access_token}, format="json")
            bad = self.client.post(f"/api/v1/teleconsultations/{session.pk}/join/",
                                   {"token": "wrong"}, format="json")
        self.assertEqual(ok.status_code, 200)
        self.assertEqual(bad.status_code, 403)

        # Complete → thank-you email
        self.client.force_authenticate(self.medic)
        with mock.patch("teleconsultations.api.views.delete_room"):
            self.client.post(f"/api/v1/teleconsultations/sessions/{session.pk}/complete/")
        self.assertIn("Thank you", emails_to("abena@example.com")[-1].subject)

    def test_scheduled_booking_and_cancellation(self):
        self.request(mode="SCHEDULED", reason="Need help organising my inbox")  # → VIRTUAL division
        session = ConsultationSession.objects.get()
        m = emails_to("abena@example.com")[0]
        self.assertIn("is booked", m.subject)
        self.assertIn("Requested time", m.body)
        # Nobody available → whole VA division + admins
        self.assertTrue(Notification.objects.filter(user=self.va).exists())
        self.assertTrue(Notification.objects.filter(user=self.admin).exists())

        self.client.force_authenticate(self.admin)
        self.client.post(f"/api/v1/teleconsultations/sessions/{session.pk}/cancel/")
        self.assertIn("cancelled", emails_to("abena@example.com")[-1].subject)

    def test_tokens_are_unique(self):
        self.request()
        self.request()
        a, b = ConsultationSession.objects.all()
        self.assertNotEqual(a.access_token, b.access_token)


class FoundationAndNewsletterTests(Base):
    def test_volunteer_application(self):
        res = self.client.post("/api/v1/foundation/volunteers/",
                               {"name": "Yaw", "email": "yaw@example.com", "interest": "Teaching kids"}, format="json")
        self.assertEqual(res.status_code, 201)
        self.assertIn("volunteering", emails_to("yaw@example.com")[0].subject)
        self.assertTrue(Notification.objects.filter(user=self.found, kind="VOLUNTEER").exists())
        self.assertFalse(Notification.objects.filter(user=self.medic).exists())

    def test_newsletter_welcome_only_once(self):
        for _ in range(2):
            self.client.post("/api/v1/newsletter/subscribe/", {"email": "Reader@Example.com"}, format="json")
        self.assertEqual(len(emails_to("reader@example.com")), 1)
        # Re-subscribing after unsubscribing sends a fresh welcome
        self.client.post("/api/v1/newsletter/unsubscribe/", {"email": "reader@example.com"}, format="json")
        self.client.post("/api/v1/newsletter/subscribe/", {"email": "reader@example.com"}, format="json")
        self.assertEqual(len(emails_to("reader@example.com")), 2)


class AssignmentTests(Base):
    def test_assign_status_and_comment(self):
        self.client.force_authenticate(self.admin)
        res = self.client.post("/api/v1/assignments/", {"title": "Lab report", "assigned_to": self.medic.pk}, format="json")
        self.assertEqual(res.status_code, 201, res.data)
        a = Assignment.objects.get()
        self.assertTrue(Notification.objects.filter(user=self.medic, kind="ASSIGNMENT").exists())
        self.assertFalse(Notification.objects.filter(user=self.admin).exists())  # actor not notified
        self.assertEqual(len(emails_to("medic@wolbiroyal.com")), 1)
        self.assertEqual(len(emails_to("alerts@wolbiroyal.com")), 0)  # internal: no alert inbox

        # Assignee moves it → creator is told
        self.client.force_authenticate(self.medic)
        self.client.patch(f"/api/v1/assignments/{a.pk}/", {"status": "IN_PROGRESS"}, format="json")
        self.assertTrue(Notification.objects.filter(user=self.admin, title__contains="In Progress").exists())

        # Editing without a status/assignee change → no new notification
        before = Notification.objects.count()
        self.client.patch(f"/api/v1/assignments/{a.pk}/", {"description": "typo fix"}, format="json")
        self.assertEqual(Notification.objects.count(), before)

        # Comment saves (was broken) and notifies the other party in-app only
        res = self.client.post("/api/v1/assignments/comments/", {"assignment": a.pk, "comment": "Done soon"}, format="json")
        self.assertEqual(res.status_code, 201, res.data)
        self.assertTrue(Notification.objects.filter(user=self.admin, kind="COMMENT").exists())


class NotificationApiTests(Base):
    def test_bell_endpoints(self):
        for i in range(3):
            Notification.objects.create(user=self.admin, title=f"n{i}", message="m", link="/dashboard/leads")
        Notification.objects.create(user=self.medic, title="other", message="m")
        self.client.force_authenticate(self.admin)

        self.assertEqual(self.client.get("/api/v1/notifications/unread-count/").data["unread"], 3)
        listing = self.client.get("/api/v1/notifications/").data
        self.assertEqual(listing["count"], 3)  # only own notifications
        first = listing["results"][0]
        self.assertEqual(first["link"], "/dashboard/leads")

        self.client.patch(f"/api/v1/notifications/{first['id']}/read/")
        self.assertEqual(self.client.get("/api/v1/notifications/?unread=1").data["count"], 2)
        self.client.post("/api/v1/notifications/read-all/")
        self.assertEqual(self.client.get("/api/v1/notifications/unread-count/").data["unread"], 0)

        other = Notification.objects.get(user=self.medic)
        self.assertEqual(self.client.patch(f"/api/v1/notifications/{other.pk}/read/").status_code, 404)

    def test_preferences(self):
        self.client.force_authenticate(self.admin)
        self.assertTrue(self.client.get("/api/v1/notifications/preferences/").data["email_notifications"])
        self.client.patch("/api/v1/notifications/preferences/", {"email_notifications": False}, format="json")
        self.admin.refresh_from_db()
        self.assertFalse(self.admin.email_notifications)

    def test_requires_login(self):
        self.assertEqual(self.client.get("/api/v1/notifications/unread-count/").status_code, 401)


@override_settings(STAFF_ALERT_EMAILS=[])
class AdminResendTests(Base):
    def test_failed_email_can_be_resent(self):
        from notifications.services import EmailContent, retry_email, send_email
        with mock.patch("django.core.mail.EmailMultiAlternatives.send", side_effect=RuntimeError("down")):
            log = send_email("x@example.com", EmailContent(subject="s", heading="h"), audience="CLIENT")
        log.refresh_from_db()
        self.assertEqual(log.status, "FAILED")
        self.assertEqual(retry_email(log).status, "SENT")
        self.assertEqual(log.attempts, 2)
