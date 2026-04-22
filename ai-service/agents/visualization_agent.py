import json

def generate_visualization(result: list, chart_type: str = "bar") -> str | None:
    if not result or len(result) == 0:
        return None

    if not isinstance(result[0], dict):
        return None

    labels_key = None
    values_key = None

    for row in result:
        keys = list(row.keys())
        for k in keys:
            if 'name' in k.lower() or 'product' in k.lower() or 'label' in k.lower():
                labels_key = k
            if 'count' in k.lower() or 'total' in k.lower() or 'quantity' in k.lower() or 'val' in k.lower() or 'amount' in k.lower():
                values_key = k
        if labels_key and values_key:
            break

    if not labels_key:
        labels_key = list(result[0].keys())[0]
    if not values_key:
        values_key = list(result[0].keys())[1]

    labels = [str(row.get(labels_key, "")) for row in result]
    values = [float(row.get(values_key, 0)) for row in result]

    max_val = max(values) if values else 1
    percentages = [(v / max_val * 100) for v in values]

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
            "xaxis": {"title": labels_key},
            "yaxis": {"title": values_key}
        }
    }

    return json.dumps(spec)
