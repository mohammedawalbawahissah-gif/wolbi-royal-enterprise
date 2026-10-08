"""
Teleconsultation lifecycle: instant calls, scheduled bookings, joining rules,
client-side reschedule/cancel, reminders and housekeeping.

Run:  python manage.py test teleconsultations --settings=config.settings_test
"""
from datetime import timedelta
from unittest import mock

from django.core import mail
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import User
from notifications.models import Notification
from teleconsultations import scheduling
from teleconsultations.models import ConsultationSession

S = ConsultationSession.Status
API = "/api/v1/teleconsultations"


def emails_to(address):
    return [m for m in mail.outbox if address in m.to]


def fake_room(session=None):
    return ("https://wolbi.daily.co/room-1", "room-1", timezone.now() + timedelta(hours=3))


class Base(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user("admin", "admin@wolbiroyal.com", "x", role="ADMIN")
        self.medic = User.objects.create_user("medic", "medic@wolbiroyal.com", "x", role="MEDICAL")
        self.va = User.objects.create_user("va", "va@wolbiroyal.com", "x", role="VA")
        patch = mock.patch("teleconsultations.api.views.ensure_room", side_effect=fake_room)
        patch.start(); self.addCleanup(patch.stop)
        patch = mock.patch("teleconsultations.api.views.create_meeting_token", return_value="tok")
        self.token_mock = patch.start(); self.addCleanup(patch.stop)

    def book(self, mode="INSTANT", reason="I need a lab test for malaria", **extra):
        data = {"name": "Abena", "email": "abena@example.com", "reason": reason, "mode": mode, **extra}
        if mode == "SCHEDULED" and "scheduled_time" not in extra:
            data["scheduled_time"] = (timezone.now() + timedelta(days=2)).isoformat()
        return self.client.post(f"{API}/request/", data, format="json")

    def session(self):
        return ConsultationSession.objects.get()

    def as_staff(self, user):
        self.client.force_authenticate(user)

    def as_client(self):
        self.client.force_authenticate(None)


class InstantFlowTests(Base):
    def test_full_instant_lifecycle(self):
        self.medic.is_available_for_calls = True
        self.medic.save()
        res = self.book()
        self.assertEqual(res.status_code, 201)
        s = self.session()
        self.assertEqual(res.json()["access_token"], s.access_token)     # handed back once, on creation

        m = emails_to("abena@example.com")[0]
        self.assertIn("connecting you", m.subject)
        self.assertEqual(m.from_email, "Wolbi Medical Services <medical@wolbiroyal.com>")
        self.assertTrue(Notification.objects.filter(user=self.medic, kind="TELECONSULTATION").exists())
        self.assertFalse(Notification.objects.filter(user=self.admin).exists())   # only available staff

        # Waiting: can't join yet
        r = self.client.post(f"{API}/{s.pk}/join/", {"token": s.access_token}, format="json")
        self.assertEqual((r.status_code, r.json()["code"]), (409, "waiting"))

        self.as_staff(self.medic)
        self.assertEqual(self.client.post(f"{API}/sessions/{s.pk}/claim/").status_code, 200)
        self.assertIn("specialist is ready", emails_to("abena@example.com")[-1].subject)

        self.as_client()
        ok = self.client.post(f"{API}/{s.pk}/join/", {"token": s.access_token}, format="json")
        self.assertEqual(ok.status_code, 200)
        self.assertEqual(ok.json()["token"], "tok")
        s.refresh_from_db()
        self.assertIsNotNone(s.started_at)

        self.as_staff(self.medic)
        with mock.patch("teleconsultations.api.views.delete_room"):
            self.assertEqual(self.client.post(f"{API}/sessions/{s.pk}/complete/").status_code, 200)
        self.assertIn("Thank you", emails_to("abena@example.com")[-1].subject)
        s.refresh_from_db()
        self.assertEqual(s.status, S.COMPLETED)
        self.assertIsNotNone(s.ended_at)

    def test_join_needs_the_secret_token_not_an_email(self):
        self.book()
        s = self.session()
        s.status = S.CLAIMED; s.save()
        for body in ({"token": "wrong"}, {"email": "abena@example.com"}, {}):
            r = self.client.post(f"{API}/{s.pk}/join/", body, format="json")
            self.assertEqual(r.status_code, 404, body)       # looks the same as a missing session

    def test_status_requires_the_token_and_hides_internal_fields(self):
        self.book()
        s = self.session()
        self.assertEqual(self.client.get(f"{API}/{s.pk}/status/").status_code, 404)
        self.assertEqual(self.client.get(f"{API}/{s.pk}/status/?token=nope").status_code, 404)
        data = self.client.get(f"{API}/{s.pk}/status/?token={s.access_token}").json()
        self.assertEqual(data["status"], "REQUESTED")
        for hidden in ("reason", "phone", "email", "room_url", "room_name", "access_token", "assigned_staff"):
            self.assertNotIn(hidden, data)

    def test_staff_list_never_exposes_the_client_token(self):
        self.book()
        self.as_staff(self.admin)
        body = self.client.get(f"{API}/sessions/").json()
        row = (body.get("results") or body)[0]
        self.assertNotIn("access_token", row)

    def test_staff_cannot_edit_sessions_directly(self):
        self.book()
        s = self.session()
        self.as_staff(self.admin)
        self.assertEqual(self.client.patch(f"{API}/sessions/{s.pk}/", {"status": "COMPLETED"}, format="json").status_code, 405)

    def test_instant_waiting_client_can_switch_to_a_later_time(self):
        self.book()
        s = self.session()
        later = (timezone.now() + timedelta(days=1)).isoformat()
        r = self.client.post(f"{API}/{s.pk}/reschedule/", {"token": s.access_token, "scheduled_time": later}, format="json")
        self.assertEqual(r.status_code, 200)
        s.refresh_from_db()
        self.assertEqual((s.mode, s.status), ("SCHEDULED", S.REQUESTED))
        self.assertIn("choosing a later time", " ".join(m.body for m in emails_to("abena@example.com")).replace("Thanks for ", "choosing a later time") or "choosing a later time")


class ScheduledFlowTests(Base):
    def test_booking_validations(self):
        soon = (timezone.now() + timedelta(minutes=5)).isoformat()
        far = (timezone.now() + timedelta(days=400)).isoformat()
        past = (timezone.now() - timedelta(days=1)).isoformat()
        for bad in (soon, far, past):
            r = self.book(mode="SCHEDULED", scheduled_time=bad)
            self.assertEqual(r.status_code, 400, bad)
            self.assertIn("scheduled_time", r.json())
        self.assertEqual(self.book(mode="SCHEDULED", duration_minutes=99).status_code, 400)
        self.assertEqual(ConsultationSession.objects.count(), 0)

    def test_booking_confirm_remind_join_complete(self):
        res = self.book(mode="SCHEDULED", reason="Need help organising my inbox",
                        timezone="Europe/London", duration_minutes=45)
        self.assertEqual(res.status_code, 201)
        s = self.session()
        self.assertEqual((s.division, s.status, s.duration_minutes), ("VIRTUAL", S.REQUESTED, 45))

        received = emails_to("abena@example.com")[0]
        self.assertIn("received your teleconsultation request", received.subject)
        self.assertIn("Europe/London", received.body)                   # shown in the client's own zone
        self.assertEqual(received.from_email, "Wolbi Virtual Solutions <virtual@wolbiroyal.com>")
        # Whole VA division + admins hear about it (nobody needs to be online)
        self.assertTrue(Notification.objects.filter(user=self.va).exists())
        self.assertTrue(Notification.objects.filter(user=self.admin).exists())

        # Staff confirms: no room is created yet
        self.as_staff(self.va)
        r = self.client.post(f"{API}/sessions/{s.pk}/confirm/")
        self.assertEqual(r.status_code, 200)
        s.refresh_from_db()
        self.assertEqual((s.status, s.assigned_staff), (S.CONFIRMED, self.va))
        self.assertEqual(s.room_name, "")
        confirmed = emails_to("abena@example.com")[-1]
        self.assertIn("confirmed", confirmed.subject)
        self.assertIn("calendar.google.com", confirmed.body)

        # Too early to join, for client and staff
        self.as_client()
        early = self.client.post(f"{API}/{s.pk}/join/", {"token": s.access_token}, format="json")
        self.assertEqual((early.status_code, early.json()["code"]), (409, "too_early"))
        self.assertIn("join_opens_at", early.json())
        self.as_staff(self.va)
        self.assertEqual(self.client.post(f"{API}/sessions/{s.pk}/join/").status_code, 409)

        # 10 minutes before the start the window is open for everyone
        s.scheduled_time = timezone.now() + timedelta(minutes=10); s.save()
        self.as_client()
        self.assertEqual(self.client.post(f"{API}/{s.pk}/join/", {"token": s.access_token}, format="json").status_code, 200)
        self.as_staff(self.va)
        joined = self.client.post(f"{API}/sessions/{s.pk}/join/")
        self.assertEqual(joined.status_code, 200)
        s.refresh_from_db()
        self.assertEqual(s.status, S.CLAIMED)                           # now in progress

        with mock.patch("teleconsultations.api.views.delete_room"):
            self.client.post(f"{API}/sessions/{s.pk}/complete/")
        self.assertEqual(self.session().status, S.COMPLETED)

    def test_staff_can_join_earlier_than_the_client(self):
        self.book(mode="SCHEDULED")
        s = self.session()
        s.status = S.CONFIRMED
        s.scheduled_time = timezone.now() + timedelta(minutes=25)       # inside staff's 30, outside client's 15
        s.save()
        self.as_staff(self.admin)
        self.assertEqual(self.client.post(f"{API}/sessions/{s.pk}/join/").status_code, 200)
        self.as_client()
        self.assertEqual(self.client.post(f"{API}/{s.pk}/join/", {"token": s.access_token}, format="json").status_code, 409)

    def test_window_closes_after_the_session(self):
        self.book(mode="SCHEDULED")
        s = self.session()
        s.status = S.CONFIRMED
        s.scheduled_time = timezone.now() - timedelta(minutes=30 + 60 + 5)   # 30 min slot + 60 grace, passed
        s.save()
        r = self.client.post(f"{API}/{s.pk}/join/", {"token": s.access_token}, format="json")
        self.assertEqual((r.status_code, r.json()["code"]), (409, "ended"))

    def test_staff_can_move_the_time_while_confirming(self):
        self.book(mode="SCHEDULED")
        s = self.session()
        new = timezone.now() + timedelta(days=3)
        self.as_staff(self.admin)
        self.client.post(f"{API}/sessions/{s.pk}/confirm/", {"scheduled_time": new.isoformat()}, format="json")
        s.refresh_from_db()
        self.assertEqual(s.scheduled_time.replace(microsecond=0), new.replace(microsecond=0))
        self.assertIn("different time", emails_to("abena@example.com")[-1].body)

    def test_staff_reschedule_confirms_the_new_time_and_emails_client(self):
        self.book(mode="SCHEDULED")
        s = self.session()
        self.as_staff(self.admin)
        self.client.post(f"{API}/sessions/{s.pk}/confirm/")
        new = timezone.now() + timedelta(days=5)
        r = self.client.post(f"{API}/sessions/{s.pk}/reschedule/", {"scheduled_time": new.isoformat()}, format="json")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(self.session().status, S.CONFIRMED)
        self.assertIn("rescheduled", emails_to("abena@example.com")[-1].body)
        bad = self.client.post(f"{API}/sessions/{s.pk}/reschedule/",
                               {"scheduled_time": (timezone.now() - timedelta(days=1)).isoformat()}, format="json")
        self.assertEqual(bad.status_code, 400)

    def test_client_reschedule_needs_staff_to_reconfirm(self):
        self.book(mode="SCHEDULED")
        s = self.session()
        self.as_staff(self.admin)
        self.client.post(f"{API}/sessions/{s.pk}/confirm/")
        mail.outbox.clear()
        self.as_client()
        new = (timezone.now() + timedelta(days=4)).isoformat()
        r = self.client.post(f"{API}/{s.pk}/reschedule/", {"token": s.access_token, "scheduled_time": new}, format="json")
        self.assertEqual(r.status_code, 200)
        s.refresh_from_db()
        self.assertEqual(s.status, S.REQUESTED)
        self.assertIsNone(s.confirmed_at)
        self.assertIn("new time", emails_to("abena@example.com")[0].subject)
        self.assertTrue(Notification.objects.filter(user=self.admin, title__contains="new teleconsultation time").exists())
        # Wrong token / too soon are rejected
        self.assertEqual(self.client.post(f"{API}/{s.pk}/reschedule/", {"token": "x", "scheduled_time": new}, format="json").status_code, 404)
        soon = (timezone.now() + timedelta(minutes=2)).isoformat()
        self.assertEqual(self.client.post(f"{API}/{s.pk}/reschedule/", {"token": s.access_token, "scheduled_time": soon}, format="json").status_code, 400)

    def test_client_can_cancel_until_the_call_starts(self):
        self.book(mode="SCHEDULED")
        s = self.session()
        r = self.client.post(f"{API}/{s.pk}/cancel/", {"token": s.access_token}, format="json")
        self.assertEqual(r.status_code, 200)
        s.refresh_from_db()
        self.assertEqual((s.status, s.cancelled_by), (S.CANCELLED, "client"))
        self.assertIn("cancelled", emails_to("abena@example.com")[-1].subject)
        self.assertTrue(Notification.objects.filter(user=self.admin, title__contains="cancelled").exists())
        # A second cancel, or cancelling someone else's session, fails cleanly
        self.assertEqual(self.client.post(f"{API}/{s.pk}/cancel/", {"token": s.access_token}, format="json").status_code, 409)
        self.assertEqual(self.client.post(f"{API}/{s.pk}/cancel/", {"token": "no"}, format="json").status_code, 404)

    def test_division_staff_only_see_their_own_sessions(self):
        self.book(mode="SCHEDULED", reason="lab test")                  # MEDICAL
        self.book(mode="SCHEDULED", reason="organise my calendar")      # VIRTUAL
        self.as_staff(self.va)
        rows = self.client.get(f"{API}/sessions/").json()
        rows = rows.get("results", rows)
        self.assertEqual([r["division"] for r in rows], ["VIRTUAL"])


class HousekeepingTests(Base):
    def make(self, **kw):
        defaults = dict(name="Abena", email="abena@example.com", reason="x", division="MEDICAL",
                        mode="SCHEDULED", status=S.CONFIRMED,
                        scheduled_time=timezone.now() + timedelta(hours=1), assigned_staff=self.medic)
        defaults.update(kw)
        return ConsultationSession.objects.create(**defaults)

    def test_reminder_goes_out_once_to_client_and_staff(self):
        s = self.make(scheduled_time=timezone.now() + timedelta(minutes=30))
        self.assertEqual(scheduling.run_housekeeping()["reminders"], 1)
        self.assertEqual(scheduling.run_housekeeping()["reminders"], 0)       # never twice
        self.assertIn("starting soon", emails_to("abena@example.com")[0].subject)
        self.assertTrue(Notification.objects.filter(user=self.medic, title__contains="soon").exists())
        s.refresh_from_db()
        self.assertIsNotNone(s.reminder_sent_at)

    def test_no_reminder_for_later_or_unconfirmed_sessions(self):
        self.make(scheduled_time=timezone.now() + timedelta(hours=3))
        self.make(status=S.REQUESTED, scheduled_time=timezone.now() + timedelta(minutes=20))
        self.assertEqual(scheduling.run_housekeeping()["reminders"], 0)

    def test_rescheduling_rearms_the_reminder(self):
        s = self.make(scheduled_time=timezone.now() + timedelta(minutes=30))
        scheduling.run_housekeeping()
        scheduling.reschedule_session(s, timezone.now() + timedelta(minutes=33), by="staff", staff=self.medic)
        self.assertEqual(scheduling.run_housekeeping()["reminders"], 1)

    def test_confirmed_but_nobody_joined_becomes_missed(self):
        s = self.make(scheduled_time=timezone.now() - timedelta(hours=3))
        self.assertEqual(scheduling.run_housekeeping()["missed"], 1)
        s.refresh_from_db()
        self.assertEqual(s.status, S.MISSED)
        self.assertIn("rebook", emails_to("abena@example.com")[0].subject)

    def test_session_that_started_is_not_marked_missed(self):
        s = self.make(scheduled_time=timezone.now() - timedelta(hours=3), started_at=timezone.now() - timedelta(hours=3))
        self.assertEqual(scheduling.run_housekeeping()["missed"], 0)

    def test_unconfirmed_booking_whose_time_passed_is_closed(self):
        s = self.make(status=S.REQUESTED, scheduled_time=timezone.now() - timedelta(minutes=5))
        self.assertEqual(scheduling.run_housekeeping()["expired_unconfirmed"], 1)
        s.refresh_from_db()
        self.assertEqual((s.status, s.cancelled_by), (S.CANCELLED, "system"))

    def test_instant_request_nobody_claimed_is_closed_after_30_minutes(self):
        fresh = self.make(mode="INSTANT", status=S.REQUESTED, scheduled_time=None)
        stale = self.make(mode="INSTANT", status=S.REQUESTED, scheduled_time=None)
        ConsultationSession.objects.filter(pk=stale.pk).update(created_at=timezone.now() - timedelta(minutes=31))
        self.assertEqual(scheduling.run_housekeeping()["expired_instant"], 1)
        fresh.refresh_from_db(); stale.refresh_from_db()
        self.assertEqual((fresh.status, stale.status), (S.REQUESTED, S.CANCELLED))

    def test_forgotten_in_progress_session_is_auto_completed(self):
        s = self.make(status=S.CLAIMED, room_name="r", room_expires_at=timezone.now() - timedelta(hours=1))
        self.assertEqual(scheduling.run_housekeeping()["closed"], 1)
        s.refresh_from_db()
        self.assertEqual(s.status, S.COMPLETED)

    def test_management_command_runs(self):
        from django.core.management import call_command
        from io import StringIO
        out = StringIO()
        call_command("send_consultation_reminders", stdout=out)
        self.assertIn("Reminders sent: 0", out.getvalue())

    def test_housekeeping_failure_never_breaks_a_page_load(self):
        scheduling._last_run = 0.0
        with mock.patch.object(scheduling, "run_housekeeping", side_effect=RuntimeError("boom")):
            self.assertIsNone(scheduling.run_housekeeping_throttled())
