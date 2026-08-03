import logging
from datetime import timedelta

import requests
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)

DAILY_API_BASE = "https://api.daily.co/v1"


class DailyServiceUnavailable(Exception):
    pass


def _headers():
    if not settings.DAILY_API_KEY:
        raise DailyServiceUnavailable("Video calling is not configured. Please contact us directly instead.")
    return {
        "Authorization": f"Bearer {settings.DAILY_API_KEY}",
        "Content-Type": "application/json",
    }


def create_room(session_id, expires_minutes=90):
    """
    Creates a Daily.co room for a single consultation session. Rooms
    auto-expire (Daily deletes them server-side) so we never accumulate
    stale rooms even if a session is abandoned.
    """
    exp = int((timezone.now() + timedelta(minutes=expires_minutes)).timestamp())
    payload = {
        "name": f"wolbi-teleconsult-{session_id}",
        "privacy": "private",
        "properties": {
            "exp": exp,
            "enable_chat": True,
            "enable_screenshare": True,
            "enable_knocking": False,
            "max_participants": 4,
        },
    }
    try:
        resp = requests.post(f"{DAILY_API_BASE}/rooms", json=payload, headers=_headers(), timeout=10)
        resp.raise_for_status()
        return resp.json()  # includes "url", "name"
    except requests.RequestException as e:
        logger.warning(f"Daily room creation failed for session {session_id}: {e}")
        raise DailyServiceUnavailable("Couldn't set up the video room. Please try again shortly.")


def create_meeting_token(room_name, user_name, is_owner=False):
    """Short-lived token so each participant joins with their name attached,
    and staff join with owner privileges (can end the call for everyone)."""
    payload = {
        "properties": {
            "room_name": room_name,
            "user_name": user_name,
            "is_owner": is_owner,
            "exp": int((timezone.now() + timedelta(minutes=120)).timestamp()),
        }
    }
    try:
        resp = requests.post(f"{DAILY_API_BASE}/meeting-tokens", json=payload, headers=_headers(), timeout=10)
        resp.raise_for_status()
        return resp.json()["token"]
    except requests.RequestException as e:
        logger.warning(f"Daily token creation failed for room {room_name}: {e}")
        raise DailyServiceUnavailable("Couldn't prepare your call access. Please try again shortly.")


def delete_room(room_name):
    """Best-effort cleanup when a session ends early. Never raises —
    Daily's own room expiry (`exp`) is the real safety net."""
    try:
        requests.delete(f"{DAILY_API_BASE}/rooms/{room_name}", headers=_headers(), timeout=10)
    except Exception as e:
        logger.info(f"Daily room cleanup skipped for {room_name}: {e}")
