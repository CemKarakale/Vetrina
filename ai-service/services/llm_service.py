import os
import re
import httpx
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_API_KEY_2 = os.getenv("GROQ_API_KEY_2", "")
GROQ_BASE_URL = "https://api.groq.com/openai/v1"
LLM_MODEL = os.getenv("LLM_MODEL", "llama-3.3-70b-versatile")

def call_llm(system_prompt: str, user_message: str) -> str:
    api_keys = [k for k in [GROQ_API_KEY, GROQ_API_KEY_2] if k]

    if not api_keys:
        return "API anahtarı .env dosyasında GROQ_API_KEY olarak tanımlanmalı."

    headers_base = {
        "Authorization": "Bearer {}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": LLM_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ],
        "max_tokens": 2048,
        "temperature": 0.1,
    }

    for i, api_key in enumerate(api_keys):
        try:
            headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
            with httpx.Client(timeout=60.0) as client:
                response = client.post(
                    f"{GROQ_BASE_URL}/chat/completions",
                    json=payload,
                    headers=headers
                )
                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"]
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429 and i < len(api_keys) - 1:
                print(f"[LLM] API key {i+1} rate limited, trying key {i+2}...")
                continue
            return f"LLM API hatası: {str(e)}"
        except httpx.HTTPError as e:
            return f"LLM API hatası: {str(e)}"

    return "LLM API hatası: Tüm API anahtarları başarısız."
