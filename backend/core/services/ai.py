"""
Shared Anthropic Claude client for all Wolbi Royal Enterprise AI features.

Every app (leads, projects, assignments, testimonials, foundation, newsletter,
core) calls into this single module instead of instantiating its own client.
Keeps the API key, model choice, error handling, and JSON-parsing logic in
one place.
"""

import json
import logging

from django.conf import settings

logger = logging.getLogger(__name__)

try:
    import anthropic
    _client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY) if settings.ANTHROPIC_API_KEY else None
except ImportError:  # anthropic not installed in this environment
    anthropic = None
    _client = None


class AIServiceUnavailable(Exception):
    """Raised when the AI client isn't configured or the API call fails."""
    pass


def ask_ai(system_prompt: str, user_prompt: str, max_tokens: int = 600) -> str:
    """
    Sends a single-turn prompt to Claude and returns the raw text response.
    Raises AIServiceUnavailable if the client isn't configured or the call fails.
    """
    if _client is None:
        raise AIServiceUnavailable(
            "AI features are not configured. Set ANTHROPIC_API_KEY in the environment."
        )

    try:
        response = _client.messages.create(
            model=settings.ANTHROPIC_MODEL,
            max_tokens=max_tokens,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        )
        parts = [block.text for block in response.content if block.type == "text"]
        return "".join(parts).strip()
    except Exception as e:
        logger.warning(f"AI request failed: {e}")
        raise AIServiceUnavailable(str(e))


def ask_ai_json(system_prompt: str, user_prompt: str, max_tokens: int = 600) -> dict:
    """
    Same as ask_ai, but instructs the model to return only JSON and parses it.
    Falls back to a safe empty dict (never raises on parse failure — callers
    should treat a missing key as 'the AI didn't have an opinion').
    """
    strict_system = (
        system_prompt
        + "\n\nRespond with ONLY valid JSON. No markdown fences, no preamble, no explanation."
    )
    raw = ask_ai(strict_system, user_prompt, max_tokens=max_tokens)
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:]
    try:
        return json.loads(cleaned.strip())
    except (json.JSONDecodeError, ValueError):
        logger.warning(f"AI JSON parse failed, raw response: {raw[:300]}")
        return {}
