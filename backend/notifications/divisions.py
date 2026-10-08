"""
Which mailbox each division sends from and receives replies at.

    sender_for("MEDICAL")  ->  Sender("Wolbi Medical Services", "medical@wolbiroyal.com")
    sender_for(None)       ->  the general Wolbi Royal Enterprise sender

Addresses come from settings.DIVISION_EMAILS, so they can be changed with
environment variables and never need a code change.
"""
from dataclasses import dataclass
from email.utils import parseaddr

from django.conf import settings

DIVISION_NAMES = {
    "TECHNOLOGY": "Wolbi Technologies",
    "MEDICAL":    "Wolbi Medical Services",
    "VIRTUAL":    "Wolbi Virtual Solutions",
    "FOUNDATION": "Wolbi Foundation",
}

# Lead.InquiryType -> division. Anything not listed (GENERAL, PARTNERSHIP) uses
# the general Wolbi Royal Enterprise mailbox.
INQUIRY_TO_DIVISION = {
    "TECHNOLOGY":  "TECHNOLOGY",
    "AGRICULTURE": "TECHNOLOGY",   # FarmaSyst is built by Wolbi Technologies
    "DEMO":        "TECHNOLOGY",   # product demos are run by Technologies
    "MEDICAL":     "MEDICAL",
    "VIRTUAL":     "VIRTUAL",
    "FOUNDATION":  "FOUNDATION",
}


@dataclass(frozen=True)
class Sender:
    name: str
    address: str
    division: str = ""     # "" for the general sender

    @property
    def from_header(self):
        return f"{self.name} <{self.address}>"

    @property
    def team(self):
        return f"The {self.name} team"


def general_sender():
    address = parseaddr(settings.DEFAULT_FROM_EMAIL)[1] or "noreply@wolbiroyal.com"
    # Replies to general mail go to the shared inbox if one is configured
    return Sender(settings.EMAIL_FROM_NAME, settings.REPLY_TO_EMAIL or address)


def sender_for(division=None):
    """Sender for a division key (TECHNOLOGY, MEDICAL, VIRTUAL, FOUNDATION)."""
    key = (division or "").upper()
    address = settings.DIVISION_EMAILS.get(key)
    if not address:
        return general_sender()
    return Sender(DIVISION_NAMES[key], address, key)


def sender_for_inquiry(inquiry_type):
    """Sender for a Lead.inquiry_type."""
    return sender_for(INQUIRY_TO_DIVISION.get(inquiry_type or "", ""))


def all_division_inboxes():
    return list(settings.DIVISION_EMAILS.values())
