from typing import Optional
import re

# ── Prompt Injection Kalıpları ────────────────────────────────────────────────
BLOCKED_PATTERNS = [
    "ignore previous instructions",
    "forget instructions",
    "you are now",
    "act as admin",
    "admin mode",
    "show system prompt",
    "print prompt",
    "DROP TABLE",
    "DELETE FROM",
    "UPDATE",
    "INSERT INTO",
    "TRUNCATE",
    "ALTER TABLE",
    "exec(",
    "execute(",
    "system prompt",
    "jailbreak",
    "developer mode",
    "tabloyu düşür",
    "tabloyu sil",
    "tabloları düşür",
    "veritabanını sil",
    "drop the table",
    "delete all records",
    "ignore instructions",
]

# ── Kapsam Dışı / Filtre Atlama Kalıpları ────────────────────────────────────
OUT_OF_SCOPE_PATTERNS = [
    # Türkçe
    "store_id filtresini kaldır",
    "filtresini kaldır",
    "filtre olmadan",
    "filtresiz",
    "tüm mağazaların",
    "bütün mağazaların",
    "diğer mağaza",
    "başka mağaza",
    "where clause kaldır",
    "where olmadan",
    # İngilizce
    "ignore filter",
    "remove where clause",
    "bypass store",
    "without filter",
    "no filter",
    "remove filter",
    "all stores",
    "show all stores",
    "without where",
    "disable filter",
]

# ── Selamlama Kelimeleri ──────────────────────────────────────────────────────
GREETING_KEYWORDS = [
    "merhaba", "hello", "hi", "hey", "selam", "günaydın",
    "iyi günler", "iyi akşamlar", "naber", "ne haber", "nasılsın",
    "nasıl gidiyor", "ne var ne yok", "good morning", "good evening",
    "howdy", "what's up", "sup",
]

# ── Genel Sohbet Kelimeleri ───────────────────────────────────────────────────
GENERAL_CHAT_KEYWORDS = [
    "teşekkür", "sağ ol", "eyvallah", "tamam", "anladım",
    "harika", "süper", "güzel", "peki",
    "thanks", "thank you", "ok", "okay", "got it",
    "görüşürüz", "hoşçakal", "bye", "goodbye",
]

# ── Başka Mağaza Store ID Regex ───────────────────────────────────────────────
# "store #2055", "store id 2055", "mağaza 2055" gibi ifadeleri yakalar
_STORE_MENTION_RE = re.compile(
    r'(?:store|mağaza|magaza)\s*(?:#|id|no\.?)?\s*(\d+)',
    re.IGNORECASE
)

# ── Başka Kullanıcı ID Regex ─────────────────────────────────────────────────
# "user1", "user 1", "kullanıcı 3", "user id 5" gibi ifadeleri yakalar
_USER_MENTION_RE = re.compile(
    r'(?:user|kullanıcı|user_id|kullanıcı_id)\s*(?:#|id|no\.?)?\s*(\d+)',
    re.IGNORECASE
)


def check_prompt_injection(question: str) -> bool:
    question_lower = question.lower()
    for pattern in BLOCKED_PATTERNS:
        if pattern.lower() in question_lower:
            return True
    return False


def check_scope_bypass(question: str) -> bool:
    question_lower = question.lower()
    for pattern in OUT_OF_SCOPE_PATTERNS:
        if pattern.lower() in question_lower:
            return True
    return False


def check_cross_store_access(question: str, user_role: str, store_id: Optional[int]) -> Optional[int]:
    """
    CORPORATE kullanıcının soruda kendi dışında bir store ID belirtip
    belirtmediğini kontrol eder.

    Dönüş:
        - Tespit edilen yabancı store_id (int) → erişim engellenmeli
        - None → sorun yok
    """
    if user_role != "CORPORATE" or store_id is None:
        return None

    matches = _STORE_MENTION_RE.findall(question)
    for m in matches:
        mentioned_id = int(m)
        if mentioned_id != store_id:
            return mentioned_id  # Yabancı store ID tespit edildi

    return None


def check_other_user_access(question: str, user_role: str, current_user_id: int) -> Optional[int]:
    """
    INDIVIDUAL kullanıcının başka bir kullanıcının verisine erişmeye
    çalışıp çalışmadığını kontrol eder.

    Dönüş:
        - Tespit edilen yabancı user_id (int) → erişim engellenmeli
        - None → sorun yok
    """
    if user_role != "INDIVIDUAL":
        return None

    matches = _USER_MENTION_RE.findall(question)
    for m in matches:
        mentioned_id = int(m)
        if mentioned_id != current_user_id:
            return mentioned_id  # Başka kullanıcı ID tespit edildi

    return None


def is_greeting(question: str) -> bool:
    """
    Mesajın TAMAMININ bir selamlama olup olmadığını kontrol eder.
    'selam, en pahalı ürünü listele' gibi karma mesajlar selamlama SAYILMAZ.
    Kural: Selamlama kelimesinden sonra 3+ kelime anlamlı içerik varsa False döner.
    """
    q = question.lower().strip().rstrip('.,!?')

    if q in GREETING_KEYWORDS:
        return True

    for g in GREETING_KEYWORDS:
        if q.startswith(g):
            remainder = q[len(g):].strip().lstrip(',. ')
            if len(remainder.split()) >= 3:
                return False
            return True

    return False


def is_general_chat(question: str) -> bool:
    """SQL gerektirmeyen genel sohbet mi kontrol eder."""
    q = question.lower().strip()
    for kw in GENERAL_CHAT_KEYWORDS:
        if q == kw or q.startswith(kw):
            return True
    return False


def validate_sql_safety(sql: str) -> tuple[bool, str]:
    sql_stripped = sql.strip()

    if not sql_stripped.upper().startswith("SELECT"):
        return False, "Sadece SELECT sorguları izinlidir"

    sql_upper = sql_stripped.upper()

    blocked_keywords = ["DROP", "DELETE", "UPDATE", "INSERT INTO", "ALTER", "TRUNCATE",
                        "EXEC", "EXECUTE", "--", "UNION"]
    for keyword in blocked_keywords:
        if keyword in sql_upper:
            return False, f"Yasak SQL komutu: {keyword}"

    sql_clean = sql_stripped.rstrip(';').rstrip()
    if ';' in sql_clean:
        return False, f"Yasak SQL komutu: ;"

    sensitive_fields = ["password", "password_hash", "pwd", "secret", "token", "api_key", "credit_card", "ssn"]
    for field in sensitive_fields:
        if field in sql_upper:
            return False, f"Hassas alan sorgusu engellendi: {field}"

    return True, "OK"
