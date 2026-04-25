import json
import re

def format_column_name(name: str) -> str:
    name = name.replace('_', ' ')

    replacements = {
        'id': 'ID',
        'qty': 'Adet',
        'qty order': 'Sipariş Adedi',
        'total': 'Toplam',
        'count': 'Sayı',
        'sum': 'Toplam',
        'avg': 'Ortalama',
        'min': 'En Düşük',
        'max': 'En Yüksek',
        'name': 'Adı',
        'yil': 'Yıl',
        'ay': 'Ay',
        'tarih': 'Tarih',
        'tarihi': 'Tarihi',
        'siparis': 'Sipariş',
        'urun': 'Ürün',
        'musteri': 'Müşteri',
        'kullanici': 'Kullanıcı',
        'magaza': 'Mağaza',
        'satis': 'Satış',
        'gelir': 'Gelir',
        'kar': 'Kar',
        'maliyet': 'Maliyet',
        'stok': 'Stok',
        'adet': 'Adet',
        'fiyat': 'Fiyat',
        'tutar': 'Tutar',
        'tarih': 'Tarih',
        'durum': 'Durum',
        'status': 'Durum',
        'olusturuldu': 'Oluşturuldu',
        'guncellendi': 'Güncellendi',
        'silindi': 'Silindi',
        'price': 'Fiyat',
        'quantity': 'Adet',
        'amount': 'Tutar',
        'order': 'Sipariş',
        'product': 'Ürün',
        'customer': 'Müşteri',
        'store': 'Mağaza',
        'created': 'Oluşturuldu',
        'updated': 'Güncellendi',
        'previous month': 'Önceki Ay',
        'current month': 'Bu Ay',
        'change': 'Değişim',
        'percentage': 'Yüzde',
        'trend': 'Trend',
        'unit price': 'Birim Fiyat',
        'grand total': 'Genel Toplam',
        'order id': 'Sipariş No',
        'product id': 'Ürün No',
        'user id': 'Kullanıcı No',
        'store id': 'Mağaza No',
        'stock quantity': 'Stok Adedi',
    }

    name_lower = name.lower()
    for turkish, replacement in replacements.items():
        if turkish in name_lower:
            name = name_lower.replace(turkish, replacement)

    return name.title()

def format_value(key: str, value) -> str:
    if value is None:
        return "Bulunamadı"

    key_lower = key.lower()

    if isinstance(value, float):
        if any(x in key_lower for x in ['tutar', 'fiyat', 'total', 'gelir', 'satis', 'kar', 'maliyet', 'amount', 'price', 'revenue']):
            return f"₺{value:,.2f}"
        elif any(x in key_lower for x in ['yuzde', 'percentage', 'rate', 'oran']):
            return f"%{value:.1f}"
        else:
            return f"{value:,.2f}"

    if isinstance(value, int):
        if any(x in key_lower for x in ['id', 'no', 'numara']):
            return f"#{value}"
        return f"{value:,}"

    if isinstance(value, str):
        if len(value) > 50:
            return value[:50] + "..."
        return value

    return str(value)

def format_list_results(result: list, question: str) -> str:
    if not result:
        return "Sonuç bulunamadı."

    if len(result) == 1:
        row = result[0]
        if isinstance(row, dict):
            parts = []
            for k, v in row.items():
                formatted_key = format_column_name(k)
                formatted_value = format_value(k, v)
                parts.append(f"{formatted_key}: {formatted_value}")
            return " • ".join(parts)
        else:
            return str(row)

    lines = []
    for i, row in enumerate(result[:10], 1):
        if isinstance(row, dict):
            parts = []
            for k, v in list(row.items())[:4]:
                formatted_key = format_column_name(k)
                formatted_value = format_value(k, v)
                parts.append(f"{formatted_key}: {formatted_value}")
            lines.append(f"{i}. " + " • ".join(parts))
        else:
            lines.append(f"{i}. {row}")

    suffix = ""
    if len(result) > 10:
        suffix = f"\n...ve {len(result) - 10} sonuç daha"

    return "\n".join(lines) + suffix

def detect_query_type(question: str, result: list) -> str:
    q = question.lower()

    if 'kaç' in q or 'sayı' in q or 'adet' in q or 'count' in q:
        return "count"
    if 'toplam' in q or 'sum' in q or 'tutar' in q:
        return "sum"
    if 'ortalama' in q or 'avg' in q or 'average' in q:
        return "average"
    if 'en çok' in q or 'en yüksek' in q or 'top' in q or 'best' in q:
        return "top"
    if 'list' in q or 'göster' in q or 'getir' in q:
        return "list"
    if 'trend' in q or 'değişim' in q or 'karşılaştır' in q:
        return "trend"

    if result:
        first = result[0]
        if isinstance(first, dict):
            keys = list(first.keys())
            if len(result) == 1 and len(keys) <= 3:
                return "single"
            elif len(result) == 1:
                return "detail"
            else:
                return "list"

    return "general"

def analyze_result(question: str, sql: str, result: list, user_role: str, store_id: int | None) -> dict:
    if not result:
        return {
            "answer": "Bu sorgu için veritabanında sonuç bulunamadı.",
            "needs_visualization": False
        }

    try:
        query_type = detect_query_type(question, result)
        first_row = result[0] if result else {}

        if query_type == "count":
            if isinstance(first_row, dict):
                val = list(first_row.values())[0]
                answer = f"Toplam {format_value('', val)} sonuç bulundu."
            else:
                answer = f"Toplam {first_row} sonuç bulundu."
            return {
                "answer": answer,
                "needs_visualization": False,
                "raw_result": result
            }

        if query_type == "sum" or query_type == "average":
            if isinstance(first_row, dict):
                parts = []
                for k, v in first_row.items():
                    parts.append(f"{format_column_name(k)}: {format_value(k, v)}")
                answer = "Sorgunuzun sonucu:\n" + "\n".join(parts)
            else:
                answer = f"Sonuç: {format_value('', first_row)}"
            return {
                "answer": answer,
                "needs_visualization": False,
                "raw_result": result
            }

        if query_type == "list" or query_type == "top":
            formatted_list = format_list_results(result, question)
            count = len(result)
            prefix = f"{count} sonuç bulundu:\n\n" if count > 1 else ""
            return {
                "answer": prefix + formatted_list,
                "needs_visualization": len(result) > 2,
                "raw_result": result
            }

        if query_type == "single" and isinstance(first_row, dict):
            parts = []
            for k, v in first_row.items():
                parts.append(f"{format_column_name(k)}: {format_value(k, v)}")
            return {
                "answer": "Sonuç:\n" + "\n".join(parts),
                "needs_visualization": False,
                "raw_result": result
            }

        formatted_list = format_list_results(result, question)
        return {
            "answer": formatted_list,
            "needs_visualization": len(result) > 2,
            "raw_result": result
        }

    except Exception as e:
        return {
            "answer": f"Sorgu çalıştı ama sonuç okunamadı: {str(e)}",
            "needs_visualization": False,
            "raw_result": result
        }

    needs_chart = any(keyword in question.lower() for keyword in [
        "grafik", "chart", "trend", "en çok satan", "karşılaştır",
        "dağılım", "distribution", "comparison", "top", "en yüksek", "en düşük"
    ])

    return {
        "answer": "Sorgunuz başarıyla çalıştırıldı.",
        "needs_visualization": needs_chart,
        "raw_result": result
    }
