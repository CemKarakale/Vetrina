import json
import re
import unicodedata
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

GREETING_PATTERN = re.compile(
    r"^\s*(merhaba|selam|hello|hi|hey|iyi gunler|iyi g\xc3\xbcnler|gunaydin|g\xc3\xbcnaydin|g\xc3\xbcnayd\xc4\xb1n|"
    r"naber|ne haber|nasilsin|nas\xc4\xb1ls\xc4\xb1n|nasil gidiyor|nas\xc4\xb1l gidiyor|what'?s up|sup)[,!\.\?\s]+",
    re.IGNORECASE,
)
THANKS_PATTERN = re.compile(
    r"[\s,]*(tesekkurler|tesekkur ederim|te\xc5\x9fekk\xc3\xbcrler|te\xc5\x9fekk\xc3\xbcr ederim|"
    r"sag ol|sa\xc4\x9f ol|thanks|thank you)\s*$",
    re.IGNORECASE,
)
SPLIT_PATTERN = re.compile(r"\s+(?:ayrica|ve ayrica|bir de|also)\s+", re.IGNORECASE)
LEADING_GREETINGS = [
    "merhaba",
    "selam",
    "hello",
    "hi",
    "hey",
    "iyi gunler",
    "gunaydin",
    "naber",
    "ne haber",
    "nasilsin",
    "nasil gidiyor",
    "what's up",
    "sup",
]


def _fold_text(value: str) -> str:
    turkish_map = str.maketrans({
        "ı": "i",
        "İ": "I",
        "ğ": "g",
        "Ğ": "G",
        "ü": "u",
        "Ü": "U",
        "ş": "s",
        "Ş": "S",
        "ö": "o",
        "Ö": "O",
        "ç": "c",
        "Ç": "C",
    })
    normalized = unicodedata.normalize("NFKD", (value or "").translate(turkish_map))
    return normalized.encode("ascii", "ignore").decode("ascii").lower()


def _strip_leading_greeting(value: str) -> str:
    folded = _fold_text(value).lstrip()
    offset = len(value) - len(value.lstrip())

    for greeting in sorted(LEADING_GREETINGS, key=len, reverse=True):
        if not folded.startswith(greeting):
            continue

        next_index = offset + len(greeting)
        next_char = value[next_index:next_index + 1]
        if next_char and next_char not in " ,.!?;:":
            continue

        return value[next_index:].lstrip(" ,.!?;:")

    return value


def _has_leading_greeting(value: str) -> bool:
    return _strip_leading_greeting(value) != value


def _has_trailing_thanks(value: str) -> bool:
    return bool(THANKS_PATTERN.search(value or ""))


def _clean_query(question: str) -> str:
    cleaned = (question or "").strip()
    previous = None
    while previous != cleaned:
        previous = cleaned
        cleaned = _strip_leading_greeting(cleaned).strip()
        cleaned = GREETING_PATTERN.sub("", cleaned).strip()
    cleaned = THANKS_PATTERN.sub("", cleaned).strip(" ,.;!?")
    return cleaned


def _deterministic_intent(question: str) -> dict | None:
    original = (question or "").strip()
    cleaned = _clean_query(question)
    if not cleaned:
        return {"has_greeting": True, "sub_queries": []}

    has_greeting = _has_leading_greeting(original) or _has_trailing_thanks(original)
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
        original = (question or "").strip()
        cleaned = _clean_query(question)
        return {
            "has_greeting": _has_leading_greeting(original) or _has_trailing_thanks(original),
            "sub_queries": [cleaned] if cleaned else [],
        }
