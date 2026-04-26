import json
from decimal import Decimal


LABEL_PRIORITY = [
    "durum",
    "status",
    "ay",
    "month",
    "tarih",
    "urun",
    "product",
    "name",
    "kategori",
    "category",
    "puan",
    "rating",
    "yildiz",
    "label",
    "store",
]

VALUE_PRIORITY = [
    "siparis_sayisi",
    "yorum_sayisi",
    "satis_adedi",
    "stok_adedi",
    "toplam_satis_tutari",
    "ortalama_urun_puani",
    "gelir",
    "satis",
    "revenue",
    "total",
    "count",
    "quantity",
    "amount",
    "adet",
    "sayi",
    "puan",
    "rating",
    "avg",
    "sum",
    "val",
]

VALUE_HINTS = [
    "sayisi",
    "sayi",
    "count",
    "total",
    "toplam",
    "adet",
    "quantity",
    "amount",
    "gelir",
    "satis",
    "revenue",
    "stok",
    "puan",
    "rating",
    "avg",
    "sum",
]

STATUS_LABELS = {
    "PENDING": "Beklemede",
    "CONFIRMED": "Onaylandi",
    "SHIPPED": "Kargoda",
    "DELIVERED": "Teslim edildi",
    "CANCELLED": "Iptal edildi",
    "REFUNDED": "Iade edildi",
}


def _to_float_safe(value) -> float | None:
    if value is None:
        return None
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float, Decimal)):
        return float(value)
    if isinstance(value, str):
        try:
            cleaned = value.replace(",", "").replace("TL", "").replace("tl", "").strip()
            return float(cleaned)
        except ValueError:
            return None
    return None


def _contains_any(key: str, words: list[str]) -> bool:
    lower_key = key.lower()
    return any(word in lower_key for word in words)


def _key_matches(key: str, priority: str) -> bool:
    lower_key = key.lower()
    if priority in {"ay"}:
        return lower_key == priority or lower_key.endswith("_ay") or lower_key.startswith("ay_")
    return priority in lower_key


def _first_matching_key(keys: list[str], priorities: list[str], exclude: str | None = None) -> str | None:
    for priority in priorities:
        for key in keys:
            if key == exclude:
                continue
            if _key_matches(key, priority):
                return key
    return None


def _pick_label_and_value_keys(rows: list[dict]) -> tuple[str | None, str | None]:
    keys = list(rows[0].keys())
    sample = rows[:10]

    label_key = _first_matching_key(keys, LABEL_PRIORITY)
    value_key = _first_matching_key(keys, VALUE_PRIORITY, exclude=label_key)

    if value_key is None:
        numeric_keys = [
            key for key in keys
            if key != label_key and any(_to_float_safe(row.get(key)) is not None for row in sample)
        ]
        hinted_numeric = [key for key in numeric_keys if _contains_any(key, VALUE_HINTS)]
        value_key = hinted_numeric[0] if hinted_numeric else (numeric_keys[0] if numeric_keys else None)

    if label_key is None:
        non_numeric_keys = [
            key for key in keys
            if key != value_key and any(_to_float_safe(row.get(key)) is None for row in sample)
        ]
        non_value_labels = [key for key in non_numeric_keys if not _contains_any(key, VALUE_HINTS)]
        label_key = non_value_labels[0] if non_value_labels else (non_numeric_keys[0] if non_numeric_keys else None)

    if label_key == value_key:
        label_key = next((key for key in keys if key != value_key), None)

    return label_key, value_key


def _format_label(label_key: str | None, value) -> str:
    text = "" if value is None else str(value)
    key = (label_key or "").lower()

    if "durum" in key or "status" in key:
        return STATUS_LABELS.get(text.upper(), text.title())
    if "puan" in key or "rating" in key or "yildiz" in key:
        return f"{text} yildiz"

    return text


def _title_for(label_key: str | None, value_key: str | None) -> str:
    label = (label_key or "").lower()
    value = (value_key or "").lower()

    if "durum" in label or "status" in label:
        return "Siparis durum dagilimi"
    if any(word in label for word in ["puan", "rating", "yildiz"]):
        return "Puan dagilimi"
    if any(word in label for word in ["ay", "month", "tarih"]):
        if any(word in value for word in ["siparis", "order", "count", "sayi"]):
            return "Aylik siparis trendi"
        return "Aylik gelir trendi"
    if any(word in value for word in ["stok"]):
        return "Stok durumu"
    if any(word in value for word in ["gelir", "revenue", "satis"]):
        return "Urun performansi"
    return "Sorgu sonucu"


def _chart_type_for(label_key: str | None, value_count: int, requested_type: str) -> str:
    label = (label_key or "").lower()
    if any(word in label for word in ["ay", "month", "tarih"]):
        return "column"
    if any(word in label for word in ["durum", "status", "puan", "rating", "yildiz"]):
        return "bar"
    if requested_type in {"line", "bar", "column"}:
        return requested_type
    return "bar" if value_count <= 8 else "line"


def generate_visualization(result: list, chart_type: str = "bar") -> str | None:
    if not result or not isinstance(result[0], dict):
        return None

    label_key, value_key = _pick_label_and_value_keys(result)
    keys = list(result[0].keys())

    if label_key is None and keys:
        label_key = keys[0]
    if value_key is None:
        value_key = next((key for key in keys if key != label_key), None)
    if value_key is None:
        return None

    labels = []
    values = []
    for row in result:
        value = _to_float_safe(row.get(value_key))
        if value is None:
            continue
        labels.append(_format_label(label_key, row.get(label_key)))
        values.append(value)

    if not values:
        return None

    resolved_type = _chart_type_for(label_key, len(values), chart_type)
    title = _title_for(label_key, value_key)

    spec = {
        "data": [{
            "type": resolved_type,
            "x": labels,
            "y": values,
            "marker": {"color": "#1f5955"}
        }],
        "layout": {
            "title": title,
            "paper_bgcolor": "rgba(0,0,0,0)",
            "plot_bgcolor": "rgba(0,0,0,0)",
            "font": {"color": "#143f3c"},
            "xaxis": {"title": label_key},
            "yaxis": {"title": value_key}
        }
    }

    return json.dumps(spec)
