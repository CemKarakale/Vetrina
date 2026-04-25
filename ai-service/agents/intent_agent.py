from services.llm_service import call_llm
import json
import re

INTENT_SYSTEM_PROMPT = """Sen bir e-ticaret AI asistanının ön işlemcisisin. Kullanıcının mesajını analiz edip JSON formatında döndür.

Görevlerin:
1. Mesajın başındaki/sonundaki selamlama veya kapanış ifadelerini temizle (örn: "merhaba", "selam", "teşekkürler")
2. Temizlenen içerikte kaç ayrı veri sorgusu olduğunu belirle
3. Her soruyu ayrı bir madde olarak listele

ÖRNEKLER:
Giriş: "selam, en pahalı 3 ürünü listele"
Çıkış: {"has_greeting": true, "sub_queries": ["en pahalı 3 ürünü listele"]}

Giriş: "geçen ayki satışlar ne kadar? ayrıca stoku 50'nin altındaki ürünleri de göster"
Çıkış: {"has_greeting": false, "sub_queries": ["geçen ayki satışlar ne kadar?", "stoku 50'nin altındaki ürünleri göster"]}

Giriş: "merhaba nasılsın"
Çıkış: {"has_greeting": true, "sub_queries": []}

Giriş: "toplam sipariş sayısı kaç?"
Çıkış: {"has_greeting": false, "sub_queries": ["toplam sipariş sayısı kaç?"]}

KURALLAR:
- Sadece JSON döndür, başka hiçbir şey yazma
- sub_queries boşsa [] döndür
- Her sub_query orijinal Türkçe/İngilizce dilini koru
- sub_queries içindeki sorguları temiz ve anlaşılır yaz"""


def parse_intent(question: str) -> dict:
    """
    Mesajı analiz eder ve şunu döndürür:
    {
        "has_greeting": bool,
        "sub_queries": [str, ...]  # Temiz, ayrıştırılmış sorgular
    }
    """
    try:
        raw = call_llm(INTENT_SYSTEM_PROMPT, question).strip()

        # JSON bloğunu çıkar
        if "```" in raw:
            parts = raw.split("```")
            for i, part in enumerate(parts):
                if i % 2 == 1:
                    raw = part.strip().lstrip("json").strip()
                    break

        # Direkt JSON dene
        result = json.loads(raw)

        # Beklenen yapıyı doğrula
        if "sub_queries" not in result:
            result["sub_queries"] = [question]
        if "has_greeting" not in result:
            result["has_greeting"] = False

        # sub_queries boş ama greeting varsa → salt selamlama
        return result

    except Exception as e:
        print(f"[Intent Agent] Parse error: {e}, falling back to raw question")
        return {
            "has_greeting": False,
            "sub_queries": [question]
        }
