import json

def analyze_result(question: str, sql: str, result: list, user_role: str, store_id: int | None) -> dict:
    if not result:
        return {
            "answer": "Bu sorgu için veritabanında sonuç bulunamadı.",
            "needs_visualization": False
        }

    try:
        if isinstance(result, list) and len(result) > 0:
            first_row = result[0]

            if isinstance(first_row, dict):
                keys = list(first_row.keys())
                values = list(first_row.values())

                if len(keys) == 1:
                    value = values[0]
                    answer = f"Sorgunuz başarıyla çalıştırıldı. Sonuç: {value}"
                elif len(keys) == 2:
                    answer = f"Sonuç: {keys[0]}={values[0]}, {keys[1]}={values[1]}"
                else:
                    answer = f"{len(result)} sonuç bulundu. İlk sonuç: {first_row}"
            elif isinstance(first_row, (int, float, str)):
                answer = f"Sorgunuz başarıyla çalıştırıldı. Sonuç: {first_row}"
            else:
                answer = f"Sorgunuz başarıyla çalıştırıldı. {len(result)} sonuç bulundu."
        else:
            answer = "Sorgunuz başarıyla çalıştırıldı."

    except Exception as e:
        answer = f"Sorgu çalıştı ama sonuç okunamadı: {str(e)}"

    needs_chart = any(keyword in question.lower() for keyword in [
        "grafik", "chart", "trend", "en çok satan", "karşılaştır",
        "dağılım", "distribution", "comparison", "top", "en yüksek", "en düşük"
    ])

    return {
        "answer": answer,
        "needs_visualization": needs_chart,
        "raw_result": result
    }
