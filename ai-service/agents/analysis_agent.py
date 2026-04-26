from decimal import Decimal

import re

LABELS = {
    "toplam_satis_tutari": "Toplam satis tutari",
    "siparis_sayisi": "Siparis sayisi",
    "satis_adedi": "Satis adedi",
    "stok_adedi": "Stok adedi",
    "ortalama_urun_puani": "Ortalama urun puani",
    "gelir": "Gelir",
    "hafta": "Hafta",
    "haftalik_gelir": "Haftalik gelir",
    "ay": "Ay",
    "durum": "Durum",
    "siparis_durumu": "Siparis durumu",
    "kargo_durumu": "Kargo durumu",
    "kargo_tipi": "Kargo tipi",
    "takip_numarasi": "Takip numarasi",
    "tahmini_teslimat_tarihi": "Tahmini teslimat tarihi",
    "urun": "Urun",
    "urunler": "Urunler",
    "puan": "Puan",
    "yorum_sayisi": "Yorum sayisi",
    "siparis_id": "Siparis",
    "iptal_edilen_siparis_sayisi": "Iptal edilen siparis sayisi",
    "toplam_tutar": "Toplam tutar",
    "toplam_harcama": "Toplam harcama",
    "tarih": "Tarih",
    "yorum": "Yorum",
    "name": "Ad",
    "status": "Durum",
    "grand_total": "Toplam tutar",
    "quantity": "Adet",
    "price": "Fiyat",
    "star_rating": "Puan",
}

STATUS_LABELS = {
    "PENDING": "Bekliyor",
    "CONFIRMED": "Onaylandi",
    "SHIPPED": "Kargoda",
    "PROCESSING": "Hazirlaniyor",
    "IN_TRANSIT": "Yolda",
    "DELIVERED": "Teslim edildi",
    "CANCELLED": "Iptal edildi",
    "CANCELED": "Iptal edildi",
    "REFUNDED": "Iade edildi",
    "KARGO_BILGISI_YOK": "Kargo bilgisi yok",
}


def format_column_name(name: str) -> str:
    key = str(name or "").strip()
    normalized = key.lower().replace(" ", "_")
    if normalized in LABELS:
        return LABELS[normalized]
    return normalized.replace("_", " ").title()


def is_money_key(key: str) -> bool:
    key = (key or "").lower()
    money_parts = ["tutar", "fiyat", "total", "gelir", "harcama", "amount", "price", "revenue"]
    return any(part in key for part in money_parts)


def is_date_key(key: str) -> bool:
    return any(part in (key or "").lower() for part in ["tarih", "date", "created_at"])


def format_value(key: str, value) -> str:
    if value is None:
        return "0" if is_money_key(key) else "Bulunamadi"

    if isinstance(value, Decimal):
        value = float(value)

    if isinstance(value, float):
        return f"TL {value:,.2f}" if is_money_key(key) else f"{value:,.2f}"

    if isinstance(value, int):
        return f"TL {value:,}" if is_money_key(key) else f"{value:,}"

    if isinstance(value, str):
        upper = value.upper()
        if upper in STATUS_LABELS:
            return STATUS_LABELS[upper]
        if is_date_key(key) and "T" in value:
            return value.split("T", 1)[0]
        if str(key or "").lower() in {"urun", "urunler"}:
            return value if len(value) <= 55 else value[:52].rstrip() + "..."
        return value if len(value) <= 80 else value[:77] + "..."

    return str(value)


def cleaned_items(row: dict) -> list[tuple[str, str]]:
    items = []
    for key, value in row.items():
        key_lower = str(key).lower()
        if key_lower == "id" or (key_lower.endswith("_id") and key_lower != "siparis_id"):
            continue
        items.append((format_column_name(key), format_value(key, value)))
    return items


def format_list_results(result: list, question: str) -> str:
    if not result:
        return "Bu kriterlere uygun kayit bulunamadi."

    lines = []
    for index, row in enumerate(result[:8], 1):
        if isinstance(row, dict):
            key_set = {str(key).lower() for key in row.keys()}
            max_items = 8 if "kargo_durumu" in key_set else 5 if "siparis_id" in key_set else 3
            items = cleaned_items(row)[:max_items]
            if not items:
                items = [(format_column_name(k), format_value(k, v)) for k, v in list(row.items())[:2]]
            text = " | ".join(f"{label}: {value}" for label, value in items)
            lines.append(f"{index}. {text}")
        else:
            lines.append(f"{index}. {row}")

    if len(result) > 8:
        lines.append(f"...ve {len(result) - 8} kayit daha")

    return "\n".join(lines)


def detect_query_type(question: str, result: list) -> str:
    q = (question or "").lower()
    first = result[0] if result and isinstance(result[0], dict) else {}
    keys = {str(key).lower() for key in first.keys()}

    if any(key in keys for key in ["siparis_id", "yorum", "tarih", "content"]):
        return "list"
    if any(word in q for word in ["grafik", "trend", "dagilim", "dağılım", "chart"]):
        return "chart"
    if any(word in q for word in ["kaç", "kac", "sayi", "sayisi", "adet", "count"]):
        return "count"
    if any(word in q for word in ["toplam", "sum", "tutar", "gelir", "satis"]):
        return "sum"
    if any(word in q for word in ["ortalama", "avg", "average"]):
        return "average"
    if any(word in q for word in ["en cok", "en çok", "en yuksek", "top", "best", "en az"]):
        return "top"
    if any(word in q for word in ["liste", "list", "goster", "göster", "getir"]):
        return "list"
    return "single" if len(result) == 1 else "list"


def chart_answer_title(question: str, result: list) -> str:
    q = (question or "").lower()
    first = result[0] if result and isinstance(result[0], dict) else {}
    keys = {str(key).lower() for key in first.keys()}

    if "ay" in keys and "siparis_sayisi" in keys:
        return "Son 7 ay siparis trendi"
    if "ay" in keys and "gelir" in keys:
        return "Aylik gelir trendi"
    if "hafta" in keys and any(key in keys for key in ["gelir", "haftalik_gelir"]):
        return "Haftalik gelir trendi"
    if "durum" in keys:
        return "Siparis durum dagilimi"
    if "puan" in keys or "star_rating" in keys:
        return "Puan dagilimi"
    if "urun" in keys and "gelir" in keys:
        return "En cok gelir getiren urunler"
    if "urun" in keys and "satis_adedi" in keys:
        return "En cok satan urunler"
    if "stok_adedi" in keys:
        return "Stokta en az kalan urunler"
    if "trend" in q:
        return "Trend analizi"
    return "Bulunan kayitlar"


def single_row_answer(row: dict) -> str:
    items = cleaned_items(row)
    if not items:
        return "Bu kriterlere uygun kayit bulunamadi."
    return "\n".join(f"{label}: {value}" for label, value in items)


def shipment_status_answer(row: dict) -> str:
    order_id = format_value("siparis_id", row.get("siparis_id"))
    order_status = format_value("siparis_durumu", row.get("siparis_durumu"))
    shipment_status = format_value("kargo_durumu", row.get("kargo_durumu"))
    tracking_number = format_value("takip_numarasi", row.get("takip_numarasi"))
    estimated_date = format_value("tahmini_teslimat_tarihi", row.get("tahmini_teslimat_tarihi"))

    if str(row.get("kargo_durumu") or "").upper() == "KARGO_BILGISI_YOK":
        return (
            f"Son siparisiniz #{order_id} su anda {order_status}. "
            "Bu siparis icin henuz kargo bilgisi veya takip numarasi olusturulmamis."
        )

    parts = [
        f"Son siparisiniz #{order_id} icin kargo durumu: {shipment_status}.",
        f"Siparis durumu: {order_status}.",
    ]
    if row.get("takip_numarasi"):
        parts.append(f"Takip numarasi: {tracking_number}.")
    if row.get("tahmini_teslimat_tarihi"):
        parts.append(f"Tahmini teslimat tarihi: {estimated_date}.")
    return " ".join(parts)


def asks_for_multiple(question: str, result: list) -> bool:
    q = (question or "").lower()
    if len(result) > 1:
        return True
    if re.search(r"\b\d{1,2}\b", q):
        return True
    return any(word in q for word in ["liste", "list", "goster", "göster", "son bes", "son beş", "son uc", "son üç"])


def analyze_result(question: str, sql: str, result: list, user_role: str, store_id: int | None) -> dict:
    if not result:
        return {
            "answer": "Bu kriterlere uygun kayit bulunamadi.",
            "needs_visualization": False,
            "raw_result": result,
        }

    try:
        query_type = detect_query_type(question, result)
        first_row = result[0]

        if len(result) == 1 and isinstance(first_row, dict) and "kargo_durumu" in {str(key).lower() for key in first_row.keys()} and not asks_for_multiple(question, result):
            return {
                "answer": shipment_status_answer(first_row),
                "needs_visualization": False,
                "raw_result": result,
            }

        if len(result) == 1 and isinstance(first_row, dict):
            return {
                "answer": single_row_answer(first_row),
                "needs_visualization": False,
                "raw_result": result,
            }

        needs_visualization = query_type in {"chart", "top"}
        if needs_visualization:
            return {
                "answer": chart_answer_title(question, result),
                "needs_visualization": True,
                "raw_result": result,
            }

        formatted_list = format_list_results(result, question)
        return {
            "answer": formatted_list,
            "needs_visualization": needs_visualization,
            "raw_result": result,
        }

    except Exception as exc:
        return {
            "answer": f"Sorgu calisti ama sonuc okunamadi: {exc}",
            "needs_visualization": False,
            "raw_result": result,
        }
