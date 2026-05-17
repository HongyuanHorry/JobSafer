from __future__ import annotations

import json
import os
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

GEMINI_MODEL_DEFAULT = "gemini-2.5-flash-lite"
GEMINI_MODEL_ALIASES = {
    "gemini-1.5-flash": GEMINI_MODEL_DEFAULT,
    "gemini-1.5-flash-latest": GEMINI_MODEL_DEFAULT,
    "gemini-1.5-flash-001": GEMINI_MODEL_DEFAULT,
    "gemini-1.5-pro": GEMINI_MODEL_DEFAULT,
    "gemini-2.0-flash": GEMINI_MODEL_DEFAULT,
    "gemini-2.0-flash-001": GEMINI_MODEL_DEFAULT,
    "gemini-2.0-flash-exp": GEMINI_MODEL_DEFAULT,
    "gemini-2.5-flash": GEMINI_MODEL_DEFAULT,
    "gemini-2.5-flash-lite": GEMINI_MODEL_DEFAULT,
}

_NON_LATIN_PATTERN = (
    "[\\u0370-\\u03FF\\u0400-\\u04FF\\u0600-\\u06FF"
    "\\u4E00-\\u9FFF\\u3040-\\u30FF\\uAC00-\\uD7AF]"
)

GEMINI_COACH_RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "summary": {
            "type": "string",
            "description": "English paragraph from learner taps + risk tags. Max ~72 words.",
        },
        "topRisk": {"type": "string", "description": "One sentence: strongest pattern hit."},
        "nextAction": {
            "type": "string",
            "description": "One sentence: verify/pause/report habit. No money transfers.",
        },
        "hesitationInsight": {
            "type": "string",
            "description": 'One sentence on dwell vs median per stage, or "" if none.',
        },
        "tone": {"type": "string", "description": "2-3 hyphenated English words."},
    },
    "required": ["summary", "topRisk", "nextAction", "hesitationInsight", "tone"],
}


def _resolve_model(raw: str | None) -> str:
    model_id = (raw or GEMINI_MODEL_DEFAULT).strip()
    if not model_id:
        return GEMINI_MODEL_DEFAULT
    return GEMINI_MODEL_ALIASES.get(model_id, GEMINI_MODEL_DEFAULT)


def _json_parse(text: str) -> dict | list | None:
    try:
        return json.loads(text)
    except Exception:
        return None


def _extract_json_object(text: str) -> dict | None:
    if not text:
        return None

    trimmed = text.strip()
    unfenced = trimmed
    if unfenced.startswith("```"):
        unfenced = unfenced.removeprefix("```json").removeprefix("```").strip()
        if unfenced.endswith("```"):
            unfenced = unfenced[: -len("```")].strip()

    direct = _json_parse(unfenced)
    if isinstance(direct, dict):
        return direct

    start = unfenced.find("{")
    end = unfenced.rfind("}")
    if start < 0 or end <= start:
        return None

    sliced = _json_parse(unfenced[start : end + 1])
    if isinstance(sliced, dict):
        return sliced
    return None


def _contains_unsafe_text(pack: dict[str, str]) -> bool:
    fused = "\n".join(
        [
            str(pack.get("summary", "")),
            str(pack.get("topRisk", "")),
            str(pack.get("nextAction", "")),
            str(pack.get("hesitationInsight", "")),
            str(pack.get("tone", "")),
        ]
    ).lower()

    unsafe_needles = [
        "试一下",
        "转账",
        "小额",
        "付款",
        "充值",
        "押金",
        "保证金",
        "gift card",
        "otp",
        "one-time code",
        "2fa",
    ]

    for needle in unsafe_needles:
        if needle in fused:
            return True

    # Basic non-latin check to match frontend safety intent.
    import re

    return re.search(_NON_LATIN_PATTERN, fused) is not None


def _word_count(text: str) -> int:
    return len([w for w in (text or "").strip().split() if w])


def _normalize_payload(raw: dict | None) -> dict | None:
    if not isinstance(raw, dict):
        return None

    summary = str(raw.get("summary", "")).strip()
    top_risk = str(raw.get("topRisk", "")).strip()
    next_action = str(raw.get("nextAction", "")).strip()
    hesitation = str(raw.get("hesitationInsight", "")).strip()
    tone = str(raw.get("tone", "")).strip()

    if not summary or not top_risk or not next_action or not tone:
        return None

    if len(summary) > 400:
        summary = f"{summary[:399].rstrip()}…"
    if len(top_risk) > 180 or len(next_action) > 180 or len(hesitation) > 180:
        return None
    if len(tone) > 40:
        tone = tone[:40].strip()
    if _word_count(summary) > 72:
        return None

    out = {
        "summary": summary,
        "topRisk": top_risk,
        "nextAction": next_action,
        "hesitationInsight": hesitation,
        "tone": tone,
    }

    if _contains_unsafe_text(out):
        return None

    return out


def _classify_failure(http_status: int, message: str) -> dict[str, str]:
    msg = (message or "").strip().lower()
    if (
        "spend cap" in msg
        or "spending cap" in msg
        or "monthly" in msg
        and "billing" in msg
        or "quota exceeded" in msg
        or "resource_exhausted" in msg
        or http_status == 429
    ):
        return {
            "reason": "billing_cap",
            "detail": "Monthly Google AI spend cap or quota reached.",
        }

    if http_status == 403:
        return {
            "reason": "request_failed",
            "detail": "API key rejected or restricted.",
        }

    return {
        "reason": "request_failed",
        "detail": f"HTTP {http_status}",
    }


def _build_generation_payload(prompt_text: str) -> dict:
    return {
        "contents": [{"role": "user", "parts": [{"text": prompt_text}]}],
        "generationConfig": {
            "temperature": 0.28,
            "topP": 0.82,
            "maxOutputTokens": 384,
            "responseMimeType": "application/json",
            "responseSchema": GEMINI_COACH_RESPONSE_SCHEMA,
        },
    }


def _post_gemini(model_id: str, api_key: str, body: dict, timeout_s: int = 12) -> dict:
    endpoint = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{quote(model_id)}:generateContent"
    )
    data = json.dumps(body).encode("utf-8")
    request = Request(
        endpoint,
        data=data,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "x-goog-api-key": api_key,
        },
    )

    try:
        with urlopen(request, timeout=timeout_s) as response:
            payload = json.loads(response.read().decode("utf-8"))
            return {
                "ok": True,
                "status": getattr(response, "status", 200),
                "payload": payload,
            }
    except HTTPError as exc:
        raw = exc.read().decode("utf-8", errors="ignore") if exc.fp else ""
        payload = _json_parse(raw)
        if not isinstance(payload, dict):
            payload = {}
        return {
            "ok": False,
            "status": exc.code,
            "payload": payload,
        }
    except URLError:
        return {
            "ok": False,
            "status": 0,
            "payload": {},
            "network_error": True,
        }


def _extract_text_payload(api_payload: dict) -> tuple[str, str]:
    candidates = api_payload.get("candidates") if isinstance(api_payload, dict) else None
    if not isinstance(candidates, list) or not candidates:
        return "", ""

    first = candidates[0] if isinstance(candidates[0], dict) else {}
    content = first.get("content") if isinstance(first, dict) else {}
    parts = content.get("parts") if isinstance(content, dict) else []

    text_out = ""
    if isinstance(parts, list):
        text_out = " ".join(
            [part.get("text", "") for part in parts if isinstance(part, dict)]
        ).strip()

    finish_reason = str(first.get("finishReason", "") or "").strip()
    return text_out, finish_reason


def generate_coach_summary_proxy(raw_input: dict) -> dict[str, object]:
    api_enabled = os.getenv("GEMINI_ENABLED", "true").strip().lower() != "false"
    if not api_enabled:
        return {
            "ok": False,
            "reason": "gemini_disabled",
            "detail": "Gemini calls are disabled via GEMINI_ENABLED=false.",
        }

    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        return {
            "ok": False,
            "reason": "missing_api_key",
            "detail": "No Gemini API key configured on server.",
        }

    model_id = _resolve_model(os.getenv("GEMINI_MODEL", ""))

    prompt = str(raw_input.get("prompt", "")).strip()
    repair_prompt = str(raw_input.get("repairPrompt", "")).strip()
    prompts = [p for p in [prompt, repair_prompt] if p]
    if not prompts:
        return {
            "ok": False,
            "reason": "request_failed",
            "detail": "Missing prompt payload.",
        }

    last_detail = "Gemini request failed."

    for p in prompts:
        response = _post_gemini(model_id, api_key, _build_generation_payload(p))

        if not response.get("ok"):
            status = int(response.get("status") or 0)
            payload = response.get("payload") or {}
            google_msg = ""
            if isinstance(payload, dict):
                err = payload.get("error")
                if isinstance(err, dict):
                    google_msg = str(err.get("message", "") or "").strip()

            if status == 0 and response.get("network_error"):
                return {
                    "ok": False,
                    "reason": "timeout_or_network",
                    "detail": "Gemini network request failed.",
                }

            classified = _classify_failure(status, google_msg)
            last_detail = str(classified.get("detail", last_detail))
            if classified.get("reason") == "billing_cap":
                return classified
            return classified

        payload = response.get("payload") or {}
        text, finish_reason = _extract_text_payload(payload if isinstance(payload, dict) else {})
        block_reason = ""
        if isinstance(payload, dict):
            prompt_feedback = payload.get("promptFeedback")
            if isinstance(prompt_feedback, dict):
                block_reason = str(prompt_feedback.get("blockReason", "") or "").strip()

        if not text and (finish_reason or block_reason):
            last_detail = finish_reason or block_reason
            continue

        parsed = _extract_json_object(text)
        normalized = _normalize_payload(parsed)
        if normalized:
            return {
                "ok": True,
                "data": normalized,
                "modelId": model_id,
            }

        fail_hint = "invalid_or_unsafe"
        if finish_reason == "MAX_TOKENS":
            fail_hint = "truncated_hit_max_tokens"
        last_detail = f"{fail_hint} {text[:120]}".strip()

    return {
        "ok": False,
        "reason": "request_failed",
        "detail": last_detail,
    }


def get_gemini_proxy_status() -> dict[str, object]:
    """Return non-sensitive runtime status for deployment validation.

    This endpoint intentionally never returns API key material.
    """

    api_enabled = os.getenv("GEMINI_ENABLED", "true").strip().lower() != "false"
    api_key_present = bool(os.getenv("GEMINI_API_KEY", "").strip())
    model_id = _resolve_model(os.getenv("GEMINI_MODEL", ""))

    return {
        "enabled": api_enabled,
        "apiKeyPresent": api_key_present,
        "modelId": model_id,
        "ready": api_enabled and api_key_present,
    }
