import logging
import secrets
from datetime import timedelta

import requests
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)

DAILY_API_BASE = "https://api.daily.co/v1"

# Rooms outlive the booked slot by this much, so a call that overruns is not cut off.
ROOM_BUFFER_MINUTES = 120


class DailyServiceUnavailable(Exception):
    pass


def _headers():
    if not settings.DAILY_API_KEY:
        raise DailyServiceUnavailable("Video calling is not configured. Please contact us directly instead.")
    return {
        "Authorization": f"Bearer {settings.DAILY_API_KEY}",
        "Content-Type": "application/json",
    }


def create_room(session_id, expires_at):
    """
    Creates a Daily.co room for one consultation. Rooms auto-expire at
    `expires_at` (Daily deletes them server-side) so abandoned sessions never
    leave stale rooms behind. Each room gets a unique name, so a replacement
    room can always be created for the same session.
    """
    payload = {
        "name": f"wolbi-tc-{session_id}-{secrets.token_hex(3)}",
        "privacy": "private",
        "properties": {
            "exp": int(expires_at.timestamp()),
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


def create_meeting_token(room_name, user_name, is_owner=False, expires_at=None):
    """Token so each participant joins with their name attached, and staff
    join with owner privileges. Valid until the room itself expires."""
    expires_at = expires_at or (timezone.now() + timedelta(minutes=180))
    payload = {
        "properties": {
            "room_name": room_name,
            "user_name": user_name,
            "is_owner": is_owner,
            "exp": int(expires_at.timestamp()),
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


def ensure_room(session):
    """
    Make sure `session` has a live Daily room, creating (or replacing an
    expiring one) when needed. Called when someone is allowed to join — NOT when
    staff accept — so a booking made days ahead never gets a room that has
    expired by the time of the call.
    Returns (room_url, room_name, room_expires_at). Raises DailyServiceUnavailable.
    """
    now = timezone.now()
    if session.room_name and session.room_url and session.room_expires_at \
            and session.room_expires_at > now + timedelta(minutes=10):
        return session.room_url, session.room_name, session.room_expires_at

    start = session.scheduled_time if (session.is_scheduled and session.scheduled_time > now) else now
    expires_at = start + timedelta(minutes=session.duration_minutes + ROOM_BUFFER_MINUTES)
    old_room = session.room_name

    room = create_room(session.pk, expires_at)
    session.room_name = room["name"]
    session.room_url = room["url"]
    session.room_expires_at = expires_at
    session.save(update_fields=["room_name", "room_url", "room_expires_at", "updated_at"])
    if old_room:
        delete_room(old_room)
    return session.room_url, session.room_name, session.room_expires_at
