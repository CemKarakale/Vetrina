from security.guardrails import (
    check_prompt_injection,
    check_scope_bypass,
    check_cross_store_access,
    check_other_user_access,
    is_greeting,
    is_general_chat,
)

# Kapsam dışı mesajlarda sunulacak alternatif öneriler
SCOPE_BYPASS_ALTERNATIVES = {
    "store": (
        "Bu sorgu kapsam dışında. Yalnızca kendi mağazanıza ait verileri sorgulayabilirsiniz. "
        "Örneğin şunu deneyebilirsiniz: 'Bu ayki kendi mağazamın gelirini göster' veya "
        "'Mağazamdaki en çok satan 5 ürün nedir?'"
    ),
    "filter": (
        "Filtre kaldırma işlemi güvenlik politikası gereği engellendi. "
        "Kendi mağazanız için dönemsel karşılaştırma yapabilirsiniz: "
        "'Geçen aya göre bu ayki satışlarım nasıl değişti?'"
    ),
    "user": (
        "Başka kullanıcının verilerine erişim yetkiniz bulunmuyor. "
        "Sizin verilerinizi görüntülemek için 'Siparişlerim neler?', 'Yorumlarım' gibi "
        "kendi verilerinize yönelik sorular sorabilirsiniz."
    ),
    "default": (
        "Bu istek güvenlik politikası gereği engellenmiştir. "
        "Yalnızca kendi verilerinize ilişkin sorular sorabilirsiniz."
    ),
}

def _get_scope_bypass_message(question: str) -> str:
    q = question.lower()
    if any(w in q for w in ["store", "mağaza", "magaza"]):
        return SCOPE_BYPASS_ALTERNATIVES["store"]
    if any(w in q for w in ["filtre", "filter", "where", "kaldır"]):
        return SCOPE_BYPASS_ALTERNATIVES["filter"]
    if any(w in q for w in ["user", "kullanıcı", "kullanici"]):
        return SCOPE_BYPASS_ALTERNATIVES["user"]
    return SCOPE_BYPASS_ALTERNATIVES["default"]


def run(question: str, user_role: str, store_id: int | None, user_id: int) -> dict:
    result = {
        "is_in_scope": True,
        "blocked_reason": None,
        "blocked_message": None,
        "should_block": False,
        "is_greeting": False,
        "needs_sql": True,
    }

    # ── 1. Salt selamlama / genel sohbet ──────────────────────────────────────
    if is_greeting(question) or is_general_chat(question):
        result["is_greeting"] = True
        result["needs_sql"] = False
        return result

    # ── 2. Prompt Injection ───────────────────────────────────────────────────
    if check_prompt_injection(question):
        result["should_block"] = True
        result["is_in_scope"] = False
        result["blocked_reason"] = "PROMPT_INJECTION"
        result["blocked_message"] = (
            "⚠️ Güvenlik uyarısı: Sistem komutlarını manipüle etmeye yönelik bir girişim tespit edildi. "
            "Bu istek reddedildi."
        )
        result["needs_sql"] = False
        return result

    # ── 3. Cross-Store Access (CORPORATE kullanıcı başka mağazayı hedefledi) ─
    foreign_store_id = check_cross_store_access(question, user_role, store_id)
    if foreign_store_id is not None:
        result["should_block"] = True
        result["is_in_scope"] = False
        result["blocked_reason"] = "CROSS_STORE_ACCESS"
        result["blocked_message"] = (
            f"🚫 Erişim Engellendi: Yalnızca kendi mağazanız (#{store_id}) için "
            f"sorgulama yapabilirsiniz. Mağaza #{foreign_store_id}'e erişim yetkisi bulunmamaktadır. "
            f"Bunun yerine 'Bu ayki satışlarım' gibi kendi mağazanıza yönelik bir soru sorabilirsiniz."
        )
        result["needs_sql"] = False
        return result

    # ── 4. Other User Access (INDIVIDUAL kullanıcı başka kullanıcıya erişmeye çalıştı) ─
    foreign_user_id = check_other_user_access(question, user_role, user_id)
    if foreign_user_id is not None:
        result["should_block"] = True
        result["is_in_scope"] = False
        result["blocked_reason"] = "OTHER_USER_ACCESS"
        result["blocked_message"] = (
            f"🚫 Erişim Engellendi: Başka kullanıcının (#{foreign_user_id}) verilerine "
            f"erişim yetkiniz bulunmuyor. Size ait verileri görüntülemek için "
            f"'Siparişlerim neler?', 'Yorumlarım' gibi kendi verilerinize yönelik sorular sorabilirsiniz."
        )
        result["needs_sql"] = False
        return result

    # ── 5. Filtre / Kapsam Bypass ─────────────────────────────────────────────
    if check_scope_bypass(question):
        result["should_block"] = True
        result["is_in_scope"] = False
        result["blocked_reason"] = "SCOPE_BYPASS"
        result["blocked_message"] = _get_scope_bypass_message(question)
        result["needs_sql"] = False
        return result

    # ── 6. CORPORATE için store_id zorunlu ────────────────────────────────────
    if user_role == "CORPORATE" and store_id is None:
        result["should_block"] = True
        result["blocked_reason"] = "NO_STORE_ID"
        result["blocked_message"] = (
            "Mağaza bilgisi bulunamadı. Kurumsal hesabınızın mağazasıyla ilişkilendirilmiş "
            "bir oturumla giriş yapmanız gerekmektedir."
        )
        result["needs_sql"] = False

    return result
