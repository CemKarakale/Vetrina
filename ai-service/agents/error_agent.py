from services.llm_service import call_llm

SCHEMA_HINT = """
Tablo şeması:
- users (id, email, password_hash, role_type, created_at)
- customer_profiles (id, user_id, first_name, last_name, phone)
- stores (id, owner_id, name, status)
- products (id, store_id, category_id, name, description, sku, unit_price, stock_quantity)
- categories (id, parent_id, name)
- orders (id, user_id, store_id, status, grand_total, created_at)
- order_items (id, order_id, product_id, quantity, unit_price)
- shipments (id, order_id, tracking_number, status, carrier)
- reviews (id, user_id, product_id, star_rating, content, created_at)

ÖNEMLİ: users tablosunda created_at kolonu vardır ama WHERE filtresinde dikkatli kullan.
stores tablosunda 'user_id' yoktur, 'owner_id' vardır.
orders tablosunda 'total_amount' yoktur, 'grand_total' vardır.
"""

FIX_SYSTEM_PROMPT = f"""Sen bir MySQL SQL uzmanısın. Verilen hatalı SQL sorgusunu düzelt ve YALNIZCA düzeltilmiş SQL döndür.
Açıklama yapma, sadece çalışır MySQL SELECT sorgusu yaz.

{SCHEMA_HINT}

Sık karşılaşılan hatalar ve çözümleri:
- "Unknown column 'X'" → O kolonu şemadan sil veya doğru tablo+kolonla değiştir
- "Ambiguous column" → Tablo prefixini ekle (örn. o.created_at, p.name)
- "could not convert string to float" → Visualization hatasıdır, SQL'i değiştirme
- Yanlış tablo adı → Şemadaki doğru ismi kullan
"""

def fix_sql_error(error_message: str, original_sql: str) -> str:
    error_lower = error_message.lower()

    # Visualization hatasıysa SQL'i değiştirme
    if "could not convert string to float" in error_lower:
        print("[Error Agent] Visualization hatası, SQL doğru — değiştirilmiyor.")
        return original_sql

    # LLM ile akıllı düzeltme yap
    user_message = f"""Hata mesajı: {error_message}

Hatalı SQL:
{original_sql}

Bu hatayı düzelt ve sadece düzeltilmiş SQL sorgusunu döndür."""

    fixed = call_llm(FIX_SYSTEM_PROMPT, user_message).strip()

    # LLM cevabından SQL'i çıkar
    if "```" in fixed:
        parts = fixed.split("```")
        for i, part in enumerate(parts):
            if i % 2 == 1:
                lines = [l for l in part.strip().splitlines() if not l.strip().lower().startswith(("sql", "mysql"))]
                candidate = "\n".join(lines).strip()
                if candidate.upper().startswith("SELECT"):
                    print(f"[Error Agent] Fixed SQL via LLM: {candidate[:200]}")
                    return candidate

    if "SELECT" in fixed.upper():
        idx = fixed.upper().find("SELECT")
        candidate = fixed[idx:].strip()
        print(f"[Error Agent] Fixed SQL via LLM: {candidate[:200]}")
        return candidate

    # LLM başarısız olduysa basit fallback
    print("[Error Agent] LLM düzeltme başarısız, fallback uygulanıyor.")
    if "unknown column" in error_lower:
        return original_sql.replace("created_at", "id")
    if "syntax error" in error_lower:
        return original_sql + " LIMIT 10"

    return original_sql
