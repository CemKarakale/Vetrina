import json
import re
from services.llm_service import call_llm


INTENT_SYSTEM_PROMPT = """Sen bir e-ticaret AI asistaninin on islemcisisin. Kullanicinin mesajini analiz edip JSON formatinda dondur.

Gorevlerin:
1. Mesajin basindaki/sonundaki selamlama veya kapanis ifadelerini temizle.
2. Temizlenen icerikte kac ayri veri sorgusu oldugunu belirle.
3. Her soruyu ayri bir madde olarak listele.

Kurallar:
- Sadece JSON dondur.
- sub_queries bossa [] dondur.
- Her sub_query orijinal dili korusun.
"""

GREETING_PATTERN = re.compile(r"^\s*(merhaba|selam|hello|hi|hey|iyi gunler|gunaydin)[,\s]+", re.IGNORECASE)
THANKS_PATTERN = re.compile(r"[\s,]*(tesekkurler|tesekkur ederim|sag ol|thanks|thank you)\s*$", re.IGNORECASE)
SPLIT_PATTERN = re.compile(r"\s+(?:ayrica|ve ayrica|bir de|also)\s+", re.IGNORECASE)


def _clean_query(question: str) -> str:
    cleaned = GREETING_PATTERN.sub("", question or "").strip()
    cleaned = THANKS_PATTERN.sub("", cleaned).strip()
    return cleaned


def _deterministic_intent(question: str) -> dict | None:
    cleaned = _clean_query(question)
    if not cleaned:
        return {"has_greeting": True, "sub_queries": []}

    has_greeting = cleaned != (question or "").strip()
    parts = [part.strip(" ,.;") for part in SPLIT_PATTERN.split(cleaned) if part.strip(" ,.;")]

    if parts:
        return {"has_greeting": has_greeting, "sub_queries": parts}

    return None


def parse_intent(question: str) -> dict:
    deterministic = _deterministic_intent(question)
    if deterministic:
        return deterministic

    try:
        raw = call_llm(INTENT_SYSTEM_PROMPT, question).strip()
        if raw.startswith("LLM "):
            raise ValueError(raw)

        if "```" in raw:
            parts = raw.split("```")
            for index, part in enumerate(parts):
                if index % 2 == 1:
                    raw = part.strip().lstrip("json").strip()
                    break

        result = json.loads(raw)
        if "sub_queries" not in result:
            result["sub_queries"] = [_clean_query(question)]
        if "has_greeting" not in result:
            result["has_greeting"] = False
        return result

    except Exception as exc:
        print(f"[Intent Agent] Parse fallback: {exc}")
        cleaned = _clean_query(question)
        return {
            "has_greeting": cleaned != (question or "").strip(),
            "sub_queries": [cleaned] if cleaned else [],
        }
