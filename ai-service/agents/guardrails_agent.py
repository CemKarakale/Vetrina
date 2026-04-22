from security.guardrails import check_prompt_injection, check_scope_bypass, is_greeting

def run(question: str, user_role: str, store_id: int | None, user_id: int) -> dict:
    result = {
        "is_in_scope": True,
        "blocked_reason": None,
        "should_block": False,
        "is_greeting": False,
        "needs_sql": True,
    }

    if is_greeting(question):
        result["is_greeting"] = True
        result["needs_sql"] = False
        return result

    if check_prompt_injection(question):
        result["should_block"] = True
        result["is_in_scope"] = False
        result["blocked_reason"] = "PROMPT_INJECTION"
        result["needs_sql"] = False

    if check_scope_bypass(question):
        result["should_block"] = True
        result["is_in_scope"] = False
        result["blocked_reason"] = "SCOPE_BYPASS"
        result["needs_sql"] = False

    if user_role == "CORPORATE" and store_id is None:
        result["should_block"] = True
        result["blocked_reason"] = "NO_STORE_ID"
        result["needs_sql"] = False

    return result
