import json
from decimal import Decimal

def _to_float_safe(val) -> float | None:
    """Bir değeri güvenli şekilde float'a çevirir. Çevirilemezse None döner."""
    if val is None:
        return None
    if isinstance(val, (int, float)):
        return float(val)
    if isinstance(val, Decimal):
        return float(val)
    if isinstance(val, str):
        try:
            return float(val.replace(",", "").replace("₺", "").strip())
        except ValueError:
            return None
    return None


def _pick_label_and_value_keys(row: dict) -> tuple[str | None, str | None]:
    """
    Bir satırdan hangi kolonun label (string) hangisinin value (sayı)
    olduğunu bulur.
    """
    label_priority  = ['name', 'product', 'category', 'label', 'store', 'status', 'month', 'ay']
    value_priority  = ['total', 'count', 'quantity', 'amount', 'revenue', 'satis', 'gelir', 'val', 'sum', 'avg']

    keys = list(row.keys())
    label_key = None
    value_key = None

    # Önce açık isim eşleşmesine bak
    for k in keys:
        kl = k.lower()
        if any(p in kl for p in label_priority) and label_key is None:
            label_key = k
        if any(p in kl for p in value_priority) and value_key is None:
            value_key = k

    # Bulamazsak: string kolonu label, sayısal kolonu value yap
    if label_key is None or value_key is None:
        for k in keys:
            v = row[k]
            fv = _to_float_safe(v)
            if fv is not None and value_key is None and k != label_key:
                value_key = k
            elif fv is None and label_key is None:
                label_key = k

    return label_key, value_key


def generate_visualization(result: list, chart_type: str = "bar") -> str | None:
    if not result or not isinstance(result[0], dict):
        return None

    # Kolon seçimini ilk satırdan belirle
    label_key, value_key = _pick_label_and_value_keys(result[0])

    # İkisi de bulunamadıysa fallback: ilk kolon label, ikinci kolon value
    keys = list(result[0].keys())
    if label_key is None:
        label_key = keys[0]
    if value_key is None and len(keys) > 1:
        value_key = keys[1]
    if value_key is None:
        return None  # Tek kolon var, grafik çizilemez

    labels = []
    values = []

    for row in result:
        raw_val = row.get(value_key)
        fv = _to_float_safe(raw_val)
        if fv is None:
            # Bu satırda değer yoksa atla
            continue
        labels.append(str(row.get(label_key, "")))
        values.append(fv)

    if not values:
        return None

    # Otomatik grafik tipi seçimi
    if len(values) <= 6:
        chart_type = "bar"
    elif len(values) <= 12:
        chart_type = "line"

    spec = {
        "data": [{
            "type": chart_type,
            "x": labels,
            "y": values,
            "marker": {"color": "#4F46E5"}
        }],
        "layout": {
            "title": "Sorgu Sonucu",
            "paper_bgcolor": "rgba(0,0,0,0)",
            "plot_bgcolor": "rgba(0,0,0,0)",
            "font": {"color": "#E5E7EB"},
            "xaxis": {"title": label_key},
            "yaxis": {"title": value_key}
        }
    }

    return json.dumps(spec)
