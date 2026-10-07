"""
Sends email via Resend's HTTPS API instead of SMTP.

Railway (like most PaaS platforms — Render, Heroku, etc.) blocks or heavily
throttles outbound SMTP ports (25, 465, 587) by default to prevent abuse.
That's why send_mail() via smtp.resend.com:587 was timing out even with
correct credentials — the connection itself was never getting through.

HTTPS to api.resend.com has no such restriction (it's the same kind of
outbound call already working fine for the Anthropic API), so this routes
every existing send_mail() call in the codebase through Resend's REST API
instead, with zero changes needed at any call site.
"""
import logging

import resend
from django.conf import settings
from django.core.mail.backends.base import BaseEmailBackend

logger = logging.getLogger(__name__)


class ResendAPIBackend(BaseEmailBackend):
    def send_messages(self, email_messages):
        if not email_messages:
            return 0

        resend.api_key = settings.RESEND_API_KEY
        sent = 0

        for message in email_messages:
            payload = {
                "from": message.from_email,
                "to": list(message.to),
                "subject": message.subject,
                "text": message.body,
            }
            # HTML version (EmailMultiAlternatives.attach_alternative)
            for content, mimetype in getattr(message, "alternatives", []) or []:
                if mimetype == "text/html":
                    payload["html"] = content
            if message.cc:
                payload["cc"] = list(message.cc)
            if message.bcc:
                payload["bcc"] = list(message.bcc)
            if message.reply_to:
                payload["reply_to"] = list(message.reply_to)
            try:
                result = resend.Emails.send(payload)
                # Expose Resend's id so callers (EmailLog) can record it
                message.provider_id = (result or {}).get("id", "") if isinstance(result, dict) else ""
                sent += 1
            except Exception as e:
                logger.warning(f"Resend API email failed: {e}")
                if not self.fail_silently:
                    raise

        return sent
