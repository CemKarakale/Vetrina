import os
from dotenv import load_dotenv
from services.llm_service import call_llm

load_dotenv()

def build_sql_system_prompt(user_role: str, store_id: int | None, user_id: int) -> str:
    base = """Sen bir SQL uzmanısın. Sadece geçerli MySQL SELECT sorgusu üret.
SINIRSIZ KURAL: YALNIZCA SQL, BAŞKA HİÇBİR METİN, AÇIKLAMA VEYA YORUM YAZMA. SADECE SELECT İLE BAŞLAYAN BİR SQL SORGUSU DÖNDÜR.

Veritabanı Tarihi: Veritabanındaki tarihler günümüz tarihleridir.
ÖNEMLİ: "Bu ay", "Geçen ay", "Bu yıl" gibi ifadeler için HARDCODED yıl kullanma! Her zaman CURDATE() veya NOW() kullanarak dinamik tarihler üret (örn. MONTH(created_at) = MONTH(CURDATE() - INTERVAL 1 MONTH) AND YEAR(created_at) = YEAR(CURDATE() - INTERVAL 1 MONTH)).

Veritabanı Şeması (DOĞRU KOLON İSİMLERİNİ KULLAN!):
- users (id, email, password_hash, role_type, created_at)
- customer_profiles (id, user_id, first_name, last_name, phone)
- stores (id, owner_id, name, status)
- products (id, store_id, category_id, name, description, sku, unit_price, stock_quantity)
- categories (id, parent_id, name)
- orders (id, user_id, store_id, status, grand_total, created_at)
- order_items (id, order_id, product_id, quantity, unit_price)
- shipments (id, order_id, tracking_number, status, carrier)
- reviews (id, user_id, product_id, star_rating, content, created_at)

ÖNEMLİ KURALLAR:
1. order tablosunda "total_amount" YOK, "grand_total" KULLAN!
2. stores tablosunda "user_id" YOK, "owner_id" KULLAN!
3. Status değerleri İNGİLİZCE KULLAN!
   - PENDING, COMPLETED, CANCELLED, CONFIRMED, SHIPPED, DELIVERED
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
                    return sql
                for line in lines:
                    line = line.strip()
                    if line.upper().startswith('SELECT'):
                        return line
                return sql

    upper_text = text.upper()
    if "SELECT " in upper_text:
        idx = upper_text.find("SELECT ")
        return text[idx:].strip()

    if text.upper().startswith('SELECT'):
        return text.strip()

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
