import unicodedata
import re
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
5. Kargo/gonderim/teslimat/takip sorularinda shipments tablosunu orders ile join et; s.status, tracking_number, estimated_delivery_date kullan.
6. "son siparis", "son satin aldigim", "en son verdigim" gibi ifadelerde ORDER BY o.created_at DESC LIMIT kullan.
7. users.password_hash veya hassas alanlari asla sorgulama.
8. Kolonlara okunabilir alias ver: toplam_satis_tutari, siparis_sayisi, gelir, ay, durum, urun, siparis_durumu, kargo_durumu.
9. Tek sayi gereken sorgularda SELECT 1 dondurme; ilgili aggregate sorgusunu dondur.
"""

    if user_role == "CORPORATE" and store_id:
        base += f"\nZORUNLU KURAL: Magaza kapsaminda kal. Orders icin o.store_id = {store_id}, products icin p.store_id = {store_id} filtresi kullan."
    elif user_role == "INDIVIDUAL":
        base += f"\nZORUNLU KURAL: Sadece user_id = {user_id} verisine eris."

    return base


def _normalize_question(question: str) -> str:
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
    normalized = unicodedata.normalize("NFKD", (question or "").translate(turkish_map))
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


def _has_any(q: str, terms: list[str]) -> bool:
    return any(term in q for term in terms)


def _is_order_question(q: str) -> bool:
    return _has_any(q, ["siparis", "order", "satin aldigim", "aldigim", "alisveris"])


def _is_latest_question(q: str) -> bool:
    return _has_any(q, ["son", "en son", "latest", "recent", "last"])


def _is_shipment_question(q: str) -> bool:
    return _has_any(q, [
        "gonder",
        "gonderme",
        "gonderim",
        "kargo",
        "kargom",
        "shipment",
        "teslimat",
        "takip",
        "tracking",
    ])


def _requested_order_status(q: str) -> str | None:
    status_terms = {
        "DELIVERED": ["delivered", "teslim", "teslim edilen", "teslim edilmis"],
        "PENDING": ["pending", "bekliyor", "bekleyen"],
        "CONFIRMED": ["confirmed", "onaylandi", "onaylanan"],
        "SHIPPED": ["shipped", "kargoda", "kargoya verilen"],
        "CANCELLED": ["cancelled", "canceled", "iptal", "iptal edilen"],
        "REFUNDED": ["refunded", "iade", "iade edilen"],
    }
    for status, terms in status_terms.items():
        if any(term in q for term in terms):
            return status
    return None


def _requested_limit(q: str, default: int = 5, maximum: int = 20) -> int:
    number_words = {
        "bir": 1,
        "iki": 2,
        "uc": 3,
        "dort": 4,
        "bes": 5,
        "alti": 6,
        "yedi": 7,
        "sekiz": 8,
        "dokuz": 9,
        "on": 10,
        "one": 1,
        "two": 2,
        "three": 3,
        "four": 4,
        "five": 5,
        "six": 6,
        "seven": 7,
        "eight": 8,
        "nine": 9,
        "ten": 10,
    }
    match = re.search(r"\b(?:son|last|latest)\s+(\d{1,2})\b", q)
    if not match:
        match = re.search(r"\b(\d{1,2})\s+(?:siparis|order)\b", q)
    if match:
        return min(max(int(match.group(1)), 1), maximum)

    word_pattern = "|".join(number_words.keys())
    word_match = re.search(rf"\b(?:son|last|latest)\s+({word_pattern})\b", q)
    if not word_match:
        word_match = re.search(rf"\b({word_pattern})\s+(?:siparis|order)\b", q)
    if word_match:
        return min(max(number_words[word_match.group(1)], 1), maximum)

    return default


def _has_explicit_limit(q: str) -> bool:
    return _requested_limit(q, default=0) > 0


def _order_list_sql(user_id: int, where_extra: str = "", limit: int = 5) -> str:
    return f"""
SELECT o.id AS siparis_id,
       COALESCE(SUBSTRING(GROUP_CONCAT(DISTINCT p.name ORDER BY p.name SEPARATOR ', '), 1, 70), 'Urun bulunamadi') AS urunler,
       o.status AS durum,
       o.created_at AS tarih,
       o.grand_total AS toplam_tutar
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
LEFT JOIN products p ON p.id = oi.product_id
WHERE o.user_id = {user_id}
  {where_extra}
GROUP BY o.id, o.status, o.created_at, o.grand_total
ORDER BY o.created_at DESC
LIMIT {limit}
""".strip()


def _shipment_list_sql(user_role: str, store_id: int | None, user_id: int, where_extra: str = "", limit: int = 5) -> str:
    scope = f"AND o.store_id = {store_id}" if user_role == "CORPORATE" and store_id else f"AND o.user_id = {user_id}"
    return f"""
SELECT o.id AS siparis_id,
       COALESCE(SUBSTRING(GROUP_CONCAT(DISTINCT p.name ORDER BY p.name SEPARATOR ', '), 1, 70), 'Urun bulunamadi') AS urunler,
       o.status AS siparis_durumu,
       COALESCE(s.status, 'KARGO_BILGISI_YOK') AS kargo_durumu,
       s.mode AS kargo_tipi,
       s.tracking_number AS takip_numarasi,
       s.estimated_delivery_date AS tahmini_teslimat_tarihi,
       o.created_at AS tarih
FROM orders o
LEFT JOIN shipments s ON s.order_id = o.id
LEFT JOIN order_items oi ON oi.order_id = o.id
LEFT JOIN products p ON p.id = oi.product_id
WHERE 1=1
  {scope}
  {where_extra}
GROUP BY o.id, o.status, s.status, s.mode, s.tracking_number, s.estimated_delivery_date, o.created_at
ORDER BY o.created_at DESC
LIMIT {limit}
""".strip()


def deterministic_sql(question: str, user_role: str, store_id: int | None, user_id: int) -> str | None:
    q = _normalize_question(question)
    order_scope = _scope_clause(user_role, store_id, user_id, "o")
    product_scope = _product_scope_clause(user_role, store_id, "p")
    requested_status = _requested_order_status(q)
    is_order_question = _is_order_question(q)
    is_latest_question = _is_latest_question(q)
    is_shipment_question = _is_shipment_question(q)

    if any(phrase in q for phrase in ["en pahali urun", "en pahali", "most expensive", "highest price"]):
        return f"""
SELECT p.name AS urun, p.unit_price AS fiyat, p.stock_quantity AS stok_adedi
FROM products p
{product_scope}
ORDER BY p.unit_price DESC
LIMIT 1
""".strip()

    if any(phrase in q for phrase in ["en cok yorum alan", "en cok yorumlanan", "most reviewed", "most reviews"]):
        scope = f"WHERE p.store_id = {store_id}" if user_role == "CORPORATE" and store_id else ""
        return f"""
SELECT p.name AS urun, COUNT(r.id) AS yorum_sayisi, ROUND(AVG(r.star_rating), 2) AS ortalama_puan
FROM products p
LEFT JOIN reviews r ON r.product_id = p.id
{scope}
GROUP BY p.id, p.name
ORDER BY yorum_sayisi DESC, ortalama_puan DESC
LIMIT 1
""".strip()

    if q.strip() in {"review", "reviews", "rewiev", "yorum", "yorumlar"}:
        scope = f"WHERE p.store_id = {store_id}" if user_role == "CORPORATE" and store_id else ""
        return f"""
SELECT p.name AS urun, r.star_rating AS puan, r.content AS yorum, r.created_at AS tarih
FROM reviews r
JOIN products p ON p.id = r.product_id
{scope}
ORDER BY r.created_at DESC
LIMIT 10
""".strip()

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

    if any(phrase in q for phrase in ["haftalik gelir", "haftalik satis", "weekly revenue", "weekly revanue", "weekly sales"]):
        return f"""
SELECT CONCAT(
         DATE_FORMAT(weekly.week_start, '%Y-%m-%d'),
         ' - ',
         DATE_FORMAT(DATE_ADD(weekly.week_start, INTERVAL 6 DAY), '%Y-%m-%d')
       ) AS hafta,
       COALESCE(SUM(weekly.grand_total), 0) AS gelir
FROM (
    SELECT DATE(DATE_SUB(o.created_at, INTERVAL WEEKDAY(o.created_at) DAY)) AS week_start,
           o.grand_total
    FROM orders o
    WHERE o.created_at >= DATE_SUB((SELECT MAX(created_at) FROM orders), INTERVAL 7 WEEK)
      {order_scope}
) weekly
GROUP BY weekly.week_start
ORDER BY weekly.week_start
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

    if is_order_question and is_shipment_question and any(word in q for word in ["durum", "status", "nerede", "takip", "liste", "list", "goster", "getir", "ne"]):
        return _shipment_list_sql(user_role, store_id, user_id, "", 1 if is_latest_question and not _has_explicit_limit(q) else _requested_limit(q))

    if is_shipment_question and any(word in q for word in ["kargo", "kargom", "shipment", "gonder", "teslimat", "takip", "nerede"]):
        singular = _has_any(q, ["kargom", "nerede", "ne durumda", "takip numarasi"]) and not _has_explicit_limit(q)
        return _shipment_list_sql(user_role, store_id, user_id, "", 1 if singular else _requested_limit(q))

    if user_role == "INDIVIDUAL" and is_order_question and requested_status and any(word in q for word in ["liste", "list", "goster", "getir", "son", "last", "latest"]):
        return _order_list_sql(user_id, f"AND o.status = '{requested_status}'", _requested_limit(q))

    if user_role == "INDIVIDUAL" and is_order_question and is_latest_question:
        limit = 1 if any(word in q for word in ["status", "durum", "ne"]) and not _has_explicit_limit(q) else _requested_limit(q)
        return _order_list_sql(user_id, "", limit)

    if any(phrase in q for phrase in ["en cok satan", "en cok satilan", "en cok satilan urun", "top selling"]):
        limit = 1 if any(phrase in q for phrase in ["hangisi", "which", "tek", "birinci"]) else 5
        product_scope_join = f" AND p.store_id = {store_id}" if user_role == "CORPORATE" and store_id else ""
        return f"""
SELECT p.name AS urun, SUM(oi.quantity) AS satis_adedi
FROM order_items oi
JOIN products p ON p.id = oi.product_id
JOIN orders o ON o.id = oi.order_id
WHERE 1=1 {order_scope}{product_scope_join}
GROUP BY p.id, p.name
ORDER BY satis_adedi DESC
LIMIT {limit}
""".strip()

    if is_order_question and any(word in q for word in ["durum", "dagilim", "status"]) and not requested_status and not is_shipment_question and not any(word in q for word in ["son", "last", "latest", "liste", "list"]):
        return f"""
SELECT o.status AS durum, COUNT(*) AS siparis_sayisi
FROM orders o
WHERE 1=1 {order_scope}
GROUP BY o.status
ORDER BY siparis_sayisi DESC
""".strip()

    if user_role == "INDIVIDUAL" and is_order_question and any(word in q for word in ["kac", "sayi", "sayisi", "adet", "count"]):
        return f"""
SELECT COUNT(*) AS siparis_sayisi
FROM orders o
WHERE o.user_id = {user_id}
""".strip()

    if user_role == "INDIVIDUAL" and any(phrase in q for phrase in ["toplam harcama", "harcamam", "total spent"]):
        return f"""
SELECT COALESCE(SUM(o.grand_total), 0) AS toplam_harcama
FROM orders o
WHERE o.user_id = {user_id}
""".strip()

    if user_role == "INDIVIDUAL" and any(phrase in q for phrase in ["teslim edilen siparis", "delivered order"]):
        return _order_list_sql(user_id, "AND o.status = 'DELIVERED'", _requested_limit(q))

    if user_role == "INDIVIDUAL" and any(phrase in q for phrase in ["iptal edilen siparis", "cancelled order", "canceled order"]):
        if any(phrase in q for phrase in ["var mi", "varmi", "any"]):
            return f"""
SELECT COUNT(*) AS iptal_edilen_siparis_sayisi
FROM orders o
WHERE o.user_id = {user_id}
  AND o.status = 'CANCELLED'
""".strip()

        return f"""
SELECT o.id AS siparis_id,
       COALESCE(SUBSTRING(GROUP_CONCAT(DISTINCT p.name ORDER BY p.name SEPARATOR ', '), 1, 70), 'Urun bulunamadi') AS urunler,
       o.created_at AS tarih,
       o.grand_total AS toplam_tutar
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
LEFT JOIN products p ON p.id = oi.product_id
WHERE o.user_id = {user_id}
  AND o.status = 'CANCELLED'
GROUP BY o.id, o.created_at, o.grand_total
ORDER BY o.created_at DESC
LIMIT 5
""".strip()

    if user_role == "INDIVIDUAL" and any(phrase in q for phrase in ["yorumlarimi", "yazdigim yorum", "my reviews"]):
        return f"""
SELECT p.name AS urun, r.star_rating AS puan, r.content AS yorum, r.created_at AS tarih
FROM reviews r
JOIN products p ON p.id = r.product_id
WHERE r.user_id = {user_id}
ORDER BY r.created_at DESC
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

    if (
        any(phrase in q for phrase in ["puan dagilim", "yildiz dagilim", "rating distribution", "rating distrubution"])
        or ("degerlendirme" in q and "dagilim" in q)
        or ("review" in q and any(word in q for word in ["distribution", "distrubution"]))
    ):
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
