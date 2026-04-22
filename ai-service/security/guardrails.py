from typing import Optional

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
]

OUT_OF_SCOPE_PATTERNS = [
    "store_id filtresini kaldır",
    "filtresini kaldır",
    "ignore filter",
    "remove where clause",
    "bypass store",
]

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

def is_greeting(question: str) -> bool:
    greetings = ["merhaba", "hello", "hi", "hey", "selam", "günaydın"]
    question_lower = question.lower().strip()
    return question_lower in greetings or question_lower.startswith("merhaba") or question_lower.startswith("hello")

def validate_sql_safety(sql: str) -> tuple[bool, str]:
    sql_upper = sql.strip().upper()

    if not sql_upper.startswith("SELECT"):
        return False, "Sadece SELECT sorguları izinlidir"

    blocked = ["DROP", "DELETE", "UPDATE", "INSERT", "ALTER", "TRUNCATE", "EXEC", "EXECUTE", "--", ";", "UNION"]
    for keyword in blocked:
        if keyword in sql_upper:
            return False, f"Yasak SQL komutu: {keyword}"

    return True, "OK"
