from django.core.exceptions import ValidationError
from rest_framework.test import APITestCase

from accounts.models import User
from .models import PortalApp


def make(slug, **kw):
    data = dict(name=slug.title(), slug=slug, tagline="t", url=f"https://{slug}.wolbiroyal.com")
    data.update(kw)
    return PortalApp.objects.create(**data)


class PortalAppsAPITests(APITestCase):
    def setUp(self):
        make("public-app", order=2)
        make("members-app", visibility="MEMBERS", order=1)
        make("medical-only", visibility="MEMBERS", allowed_roles="medical")
        make("hidden", is_active=False)
        self.admin = User.objects.create_user("a", password="x", role="ADMIN")
        self.tech = User.objects.create_user("t", password="x", role="TECH")
        self.med = User.objects.create_user("m", password="x", role="MEDICAL")

    def slugs(self, user=None):
        if user:
            self.client.force_authenticate(user)
        else:
            self.client.force_authenticate(None)
        res = self.client.get("/api/v1/portal/apps/")
        self.assertEqual(res.status_code, 200)
        return [a["slug"] for a in res.json()]

    def test_anonymous_sees_only_public(self):
        self.assertEqual(self.slugs(), ["public-app"])

    def test_role_filtering_and_order(self):
        self.assertEqual(self.slugs(self.tech), ["members-app", "public-app"])
        self.assertEqual(self.slugs(self.med), ["members-app", "public-app", "medical-only"])

    def test_admin_sees_all_active(self):
        self.assertEqual(set(self.slugs(self.admin)), {"public-app", "members-app", "medical-only"})

    def test_validation(self):
        with self.assertRaises(ValidationError):
            make("bad", color="red").full_clean()
        with self.assertRaises(ValidationError):
            make("bad2", allowed_roles="WIZARD").full_clean()
        with self.assertRaises(ValidationError):
            make("bad3", url="javascript:alert(1)").full_clean()
