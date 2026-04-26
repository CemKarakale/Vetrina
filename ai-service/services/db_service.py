import os
import httpx
from dotenv import load_dotenv

load_dotenv()

SPRING_BOOT_BASE_URL = os.getenv("SPRING_BOOT_BASE_URL", "http://localhost:8080")
INTERNAL_SECRET = os.getenv("SPRING_BOOT_INTERNAL_SECRET", "super-secret-internal-key-12345")

def is_valid_sql(sql: str) -> bool:
    if not sql or not isinstance(sql, str):
        return False
    if "LLM API hatası" in sql or "hata" in sql.lower() or "error" in sql.lower():
        return False
    upper = sql.strip().upper()
    if not upper.startswith("SELECT"):
        return False
    return True

def execute_sql(sql: str) -> list | dict:
    if not is_valid_sql(sql):
        return {"error": "Geçersiz SQL: LLM SQL üretemedi veya hata oluştu.", "query_result": None}

    url = f"{SPRING_BOOT_BASE_URL}/api/chat/execute-sql"

    headers = {
        "X-Internal-Secret": INTERNAL_SECRET,
        "Content-Type": "application/json"
    }

    payload = {"sql": sql}

    try:
        with httpx.Client(timeout=30.0) as client:
            response = client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        return {"error": f"Spring Boot SQL execution hatası: {str(e)}"}
