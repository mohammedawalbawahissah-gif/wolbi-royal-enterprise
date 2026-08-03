# Teleconsultation feature — file map & setup

# Teleconsultation feature — file map & setup

> **Update:** `backend/leads/api/views.py` and `backend/config/settings.py` below now also
> include a fix for the "Reply fails to send" 502 bug (the reply email was sent
> synchronously, blocking the request until it hung past gunicorn's timeout —
> now backgrounded, same pattern as everything else) plus a new `suggest_reply`
> AI-drafting action, surfaced as an "✨ AI Draft" button in the leads dashboard.

All paths below are relative to your existing repo roots (`backend/` and `frontend/`).
Files marked (NEW) are brand new; everything else replaces an existing file at that exact path.

## Backend

```
backend/teleconsultations/__init__.py                          (NEW)
backend/teleconsultations/apps.py                               (NEW)
backend/teleconsultations/models.py                              (NEW)
backend/teleconsultations/services.py                            (NEW — Daily.co API wrapper)
backend/teleconsultations/migrations/__init__.py                 (NEW)
backend/teleconsultations/migrations/0001_initial.py             (NEW)
backend/teleconsultations/api/__init__.py                        (NEW)
backend/teleconsultations/api/serializers.py                     (NEW)
backend/teleconsultations/api/views.py                           (NEW)
backend/teleconsultations/api/urls.py                            (NEW)

backend/accounts/models.py                                       (replaces — adds is_available_for_calls)
backend/accounts/api/serializers.py                               (replaces — exposes the toggle)
backend/accounts/migrations/0006_user_is_available_for_calls.py  (NEW)

backend/config/settings.py                                        (replaces — registers app + DAILY_API_KEY)
backend/config/urls.py                                            (replaces — routes /api/v1/teleconsultations/)

backend/core/api/views.py                                        (replaces — AI concierge site-wide context + escalation, from earlier in this session)
backend/leads/models.py                                          (replaces — LeadReply model, from earlier)
backend/leads/api/serializers.py                                 (replaces)
backend/leads/api/views.py                                       (replaces)
backend/leads/migrations/0005_leadreply.py                       (NEW)
```

## Frontend

```
frontend/src/app/(public)/teleconsultation/page.js               (NEW — public booking/call page)
frontend/src/app/dashboard/teleconsultations/page.js             (NEW — staff dashboard)
frontend/src/components/TeleconsultationRoom.js                  (NEW — shared Daily.co video embed)

frontend/src/app/(public)/layout.js                              (replaces — adds "Teleconsult" nav link)
frontend/src/app/dashboard/layout.js                              (replaces — adds sidebar link for ADMIN/MEDICAL/VA)
frontend/src/app/dashboard/leads/page.js                          (replaces — Reply feature, from earlier)
frontend/src/components/AIConcierge.js                            (replaces — escalation banner, from earlier)
```

## One env var to add

On the **backend** Railway service, add:

```
DAILY_API_KEY=<your Daily.co API key>
```

Get this from your Daily.co dashboard (Developers → API Keys) after signing up — the free tier is enough to start. Nothing else needs a domain/subdomain setup; rooms are created dynamically per session via the REST API.

## After deploying

1. Migrations run automatically on deploy (your Dockerfile already does this) — this adds `is_available_for_calls` to `accounts_user`, the new `LeadReply` table, and the new `teleconsultations_consultationsession` table.
2. Log into the dashboard as a MEDICAL or VA staff member, go to **Teleconsultations**, and flip "Available for instant calls" on — otherwise instant requests will still be created but will fall back to notifying *all* staff in that division rather than a specifically available one.
3. Test both paths from `/teleconsultation`:
   - **Talk Now** → should show "Connecting you…", then once a staff member clicks "Claim & Start Room" on their dashboard, your page should auto-update to "Join Call" within ~4 seconds.
   - **Schedule** → should show a confirmation screen. A staff member can claim it ahead of time or at the scheduled moment from their dashboard.

## Known limitations / things to revisit later

- The visitor's "join" auth is just an email match against the session record — fine for a low-stakes marketing-site feature, not appropriate if this ever needs to carry real patient data.
- Scheduled sessions don't send a reminder email close to the appointment time yet — right now it's just the initial confirmation. Worth adding if no-shows become a problem.
- Division routing (`MEDICAL` vs `VIRTUAL`) is keyword-based on the "reason" text, same pattern as `Lead.inquiry_type` — it can mis-route occasionally; a staff member reassigning isn't currently exposed in the UI (the `division` field is read-only in the serializer), so if that turns out to matter, that's a quick follow-up.
