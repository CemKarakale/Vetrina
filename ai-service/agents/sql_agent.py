import os
from dotenv import load_dotenv
from services.llm_service import call_llm

load_dotenv()

def build_sql_system_prompt(user_role: str, store_id: int | None, user_id: int) -> str:
    base = """Sen bir SQL uzmanısın. Sadece geçerli MySQL SELECT sorgusu üret.
SINIRSIZ KURAL: YALNIZCA SQL, BAŞKA HİÇBİR METİN, AÇIKLAMA VEYA YORUM YAZMA. SADECE SELECT İLE BAŞLAYAN BİR SQL SORGUSU DÖNDÜR.

Veritabanı Tarihi: Veritabanındaki tarihler günümüz tarihleridir (2026).
ÖNEMLİ: "Bu ay", "Geçen ay", "Bu yıl" gibi ifadeler için HARDCODED yıl kullanma! Her zaman CURDATE() veya NOW() kullanarak dinamik tarihler üret.

DOĞRU Veritabanı Şeması (Kolay referans):
- users (id, name, email, role_type, phone, address_city, status, created_at)
  NOT: password_hash asla sorgulanmaz!
- customer_profiles (id, user_id, age, city, membership_type)
- stores (id, owner_id, name, status)
- categories (id, name, parent_id, status, description)
- products (id, store_id, category_id, sku, name, description, unit_price, stock_quantity)
- orders (id, user_id, store_id, status, created_at, grand_total)
- order_items (id, order_id, product_id, quantity, price)
- shipments (id, order_id, warehouse, mode, status, tracking_number, estimated_delivery_date)
- reviews (id, user_id, product_id, star_rating, content, admin_reply, reply_created_at, created_at)
- store_settings (store_id, email, category, description, currency, timezone)
- system_settings (setting_key, setting_value, description)
- audit_logs (actor, action, entity_type, entity_id, severity, created_at, metadata)

ÖNEMLİ KURALLAR:
1. order tablosunda "total_amount" YOK, "grand_total" KULLAN!
2. stores tablosunda "user_id" YOK, "owner_id" KULLAN!
3. shipments tablosunda "carrier" YOK, "warehouse" ve "mode" KULLAN!
4. customer_profiles tablosunda "first_name/last_name" YOK, "age", "city", "membership_type" KULLAN!
5. Status değerleri İNGİLİZCE KULLAN!
   - PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED, REFUNDED
   - ACTIVE, INACTIVE, SUSPENDED (user/store status)
6. users tablosundan password_hash ASLA sorgulama!
7. Hassas bilgi sorguları (şifre, token, kart bilgisi) YASAKTIR!
8. Star rating için: reviews.star_rating (1-5 arası değer)
"""

    if user_role == "CORPORATE" and store_id:
        base += f"\n\nZORUNLU KURAL: Tüm sorgulara WHERE store_id = {store_id} ekle. Başka mağaza verisi döndürme. store_id filtresini ASLA kaldırma."
    elif user_role == "INDIVIDUAL":
        base += f"\n\nZORUNLU KURAL: Sadece user_id = {user_id} verisine eriş. Başka kullanıcının sipariş/yorum/adres bilgisi döndürme."

    return base

def extract_sql(text: str) -> str:
    text = text.strip()

    if '```' in text:
        parts = text.split('```')
        for i, part in enumerate(parts):
            part = part.strip()
            if i % 2 == 1:
                lines = part.split('\n')
                clean_lines = []
                for line in lines:
                    stripped = line.strip().lower()
                    if stripped.startswith('sql') or stripped.startswith('mysql'):
                        continue
                    clean_lines.append(line)
                sql = '\n'.join(clean_lines).strip()
                if sql.upper().startswith('SELECT'):
                    return sql.rstrip(';').strip()
                for line in lines:
                    line = line.strip()
                    if line.upper().startswith('SELECT'):
                        return line.rstrip(';').strip()
                return sql.rstrip(';').strip()

    upper_text = text.upper()
    if "SELECT " in upper_text:
        idx = upper_text.find("SELECT ")
        return text[idx:].rstrip(';').strip()

    if text.upper().startswith('SELECT'):
        return text.rstrip(';').strip()

    return ""

def generate_sql(question: str, user_role: str, store_id: int | None, user_id: int) -> str:
    system_prompt = build_sql_system_prompt(user_role, store_id, user_id)
    llm_response = call_llm(system_prompt, question)
    print(f"[SQL Agent] Raw LLM Response: {llm_response[:500]}")
    sql = extract_sql(llm_response)
    print(f"[SQL Agent] Extracted SQL: {sql[:300]}")

    if not sql or not sql.upper().startswith('SELECT'):
        print(f"[SQL Agent] WARNING: Failed to extract valid SQL. LLM response was: {llm_response[:200]}")
        return "SELECT 1"

    return sql
