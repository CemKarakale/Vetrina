import unicodedata
from dotenv import load_dotenv
from services.llm_service import call_llm

load_dotenv()


def build_sql_system_prompt(user_role: str, store_id: int | None, user_id: int) -> str:
    base = """Sen bir SQL uzmanisin. Sadece gecerli MySQL SELECT sorgusu uret.
SINIRSIZ KURAL: Yalnizca SQL dondur. Aciklama, markdown veya yorum yazma.

Veritabani tarihi: Demo veriler 2024-2026 araliginda olabilir.
ONEMLI: "bu ay", "gecen ay", "bu yil", "son 7 ay" gibi tarih ifadelerinde CURDATE() veya NOW() kullanma.
Tarih filtresi gerekiyorsa ilgili tablodaki en yeni tarihi referans al:
- Siparis/satis/gelir icin: (SELECT MAX(created_at) FROM orders)
- Yorum/puan icin: (SELECT MAX(created_at) FROM reviews)
Ornek: "bu ay" = orders.created_at, orders tablosundaki MAX(created_at) ile ayni yil ve ayda olmali.
Ornek: "son 7 ay" = created_at >= DATE_SUB((SELECT MAX(created_at) FROM orders), INTERVAL 6 MONTH).

Dogru veritabani semasi:
- users (id, name, email, role_type, phone, address_city, status, created_at)
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

Kurallar:
1. orders tablosunda total_amount yok, grand_total kullan.
2. stores tablosunda user_id yok, owner_id kullan.
3. shipments tablosunda carrier yok, warehouse ve mode kullan.
4. Status degerleri Ingilizce: PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED, REFUNDED.
5. users.password_hash veya hassas alanlari asla sorgulama.
6. Kolonlara okunabilir alias ver: toplam_satis_tutari, siparis_sayisi, gelir, ay, durum, urun.
7. Tek sayi gereken sorgularda SELECT 1 dondurme; ilgili aggregate sorgusunu dondur.
"""

    if user_role == "CORPORATE" and store_id:
        base += f"\nZORUNLU KURAL: Magaza kapsaminda kal. Orders icin o.store_id = {store_id}, products icin p.store_id = {store_id} filtresi kullan."
    elif user_role == "INDIVIDUAL":
        base += f"\nZORUNLU KURAL: Sadece user_id = {user_id} verisine eris."

    return base


def _normalize_question(question: str) -> str:
    normalized = unicodedata.normalize("NFKD", question or "")
    return normalized.encode("ascii", "ignore").decode("ascii").lower()


def _scope_clause(user_role: str, store_id: int | None, user_id: int, alias: str = "o") -> str:
    if user_role == "CORPORATE" and store_id:
        return f" AND {alias}.store_id = {store_id}"
    if user_role == "INDIVIDUAL":
        return f" AND {alias}.user_id = {user_id}"
    return ""


def _product_scope_clause(user_role: str, store_id: int | None, alias: str = "p") -> str:
    if user_role == "CORPORATE" and store_id:
        return f" WHERE {alias}.store_id = {store_id}"
    return ""


def deterministic_sql(question: str, user_role: str, store_id: int | None, user_id: int) -> str | None:
    q = _normalize_question(question)
    order_scope = _scope_clause(user_role, store_id, user_id, "o")
    product_scope = _product_scope_clause(user_role, store_id, "p")

    if ("bu ay" in q or "this month" in q) and any(word in q for word in ["satis", "gelir", "revenue", "tutar"]):
        return f"""
SELECT COALESCE(SUM(o.grand_total), 0) AS toplam_satis_tutari
FROM orders o
WHERE YEAR(o.created_at) = YEAR((SELECT MAX(created_at) FROM orders))
  AND MONTH(o.created_at) = MONTH((SELECT MAX(created_at) FROM orders))
  {order_scope}
""".strip()

    if any(phrase in q for phrase in ["aylik gelir", "aylik satis", "monthly revenue", "monthly sales"]):
        return f"""
SELECT DATE_FORMAT(o.created_at, '%Y-%m') AS ay, COALESCE(SUM(o.grand_total), 0) AS gelir
FROM orders o
WHERE o.created_at >= DATE_SUB((SELECT MAX(created_at) FROM orders), INTERVAL 11 MONTH)
  {order_scope}
GROUP BY DATE_FORMAT(o.created_at, '%Y-%m')
ORDER BY ay
""".strip()

    if any(phrase in q for phrase in ["son 7 ay", "last 7 month"]):
        return f"""
SELECT DATE_FORMAT(DATE_SUB(anchor.max_date, INTERVAL seq.n MONTH), '%Y-%m') AS ay,
       COUNT(o.id) AS siparis_sayisi
FROM (SELECT MAX(created_at) AS max_date FROM orders) anchor
JOIN (
    SELECT 6 - (ROW_NUMBER() OVER () - 1) AS n
    FROM orders
    LIMIT 7
) seq
LEFT JOIN orders o
  ON DATE_FORMAT(o.created_at, '%Y-%m') = DATE_FORMAT(DATE_SUB(anchor.max_date, INTERVAL seq.n MONTH), '%Y-%m')
  {order_scope}
GROUP BY seq.n, ay
ORDER BY seq.n DESC
""".strip()

    if "siparis" in q and any(word in q for word in ["durum", "dagilim", "status"]):
        return f"""
SELECT o.status AS durum, COUNT(*) AS siparis_sayisi
FROM orders o
WHERE 1=1 {order_scope}
GROUP BY o.status
ORDER BY siparis_sayisi DESC
""".strip()

    if any(phrase in q for phrase in ["en cok satan", "top selling"]):
        product_scope_join = f" AND p.store_id = {store_id}" if user_role == "CORPORATE" and store_id else ""
        return f"""
SELECT p.name AS urun, SUM(oi.quantity) AS satis_adedi
FROM order_items oi
JOIN products p ON p.id = oi.product_id
JOIN orders o ON o.id = oi.order_id
WHERE 1=1 {order_scope}{product_scope_join}
GROUP BY p.id, p.name
ORDER BY satis_adedi DESC
LIMIT 5
""".strip()

    if any(phrase in q for phrase in ["gelir getiren", "revenue product", "urun geliri"]):
        product_scope_join = f" AND p.store_id = {store_id}" if user_role == "CORPORATE" and store_id else ""
        return f"""
SELECT p.name AS urun, SUM(oi.quantity * oi.price) AS gelir
FROM order_items oi
JOIN products p ON p.id = oi.product_id
JOIN orders o ON o.id = oi.order_id
WHERE 1=1 {order_scope}{product_scope_join}
GROUP BY p.id, p.name
ORDER BY gelir DESC
LIMIT 5
""".strip()

    if any(phrase in q for phrase in ["stokta en az", "az kalan", "low stock"]):
        return f"""
SELECT p.name AS urun, p.stock_quantity AS stok_adedi
FROM products p
{product_scope}
ORDER BY p.stock_quantity ASC
LIMIT 5
""".strip()

    if any(phrase in q for phrase in ["puan dagilim", "yildiz dagilim", "rating distribution"]):
        scope = f"WHERE p.store_id = {store_id}" if user_role == "CORPORATE" and store_id else ""
        return f"""
SELECT r.star_rating AS puan, COUNT(*) AS yorum_sayisi
FROM reviews r
JOIN products p ON p.id = r.product_id
{scope}
GROUP BY r.star_rating
ORDER BY r.star_rating DESC
""".strip()

    if any(phrase in q for phrase in ["ortalama urun puani", "ortalama puan", "average rating"]):
        scope = f"WHERE p.store_id = {store_id}" if user_role == "CORPORATE" and store_id else ""
        return f"""
SELECT ROUND(AVG(r.star_rating), 2) AS ortalama_urun_puani
FROM reviews r
JOIN products p ON p.id = r.product_id
{scope}
""".strip()

    return None


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
    deterministic = deterministic_sql(question, user_role, store_id, user_id)
    if deterministic:
        print(f"[SQL Agent] Deterministic SQL: {deterministic[:300]}")
        return deterministic

    system_prompt = build_sql_system_prompt(user_role, store_id, user_id)
    llm_response = call_llm(system_prompt, question)
    print(f"[SQL Agent] Raw LLM Response: {llm_response[:500]}")
    sql = extract_sql(llm_response)
    print(f"[SQL Agent] Extracted SQL: {sql[:300]}")

    if not sql or not sql.upper().startswith('SELECT'):
        print(f"[SQL Agent] WARNING: Failed to extract valid SQL. LLM response was: {llm_response[:200]}")
        return "SELECT 'Sorgu uretilemedi' AS hata"

    return sql
