import os
import re
import httpx
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_BASE_URL = "https://api.groq.com/openai/v1"
LLM_MODEL = os.getenv("LLM_MODEL", "llama-3.3-70b-versatile")

def call_llm(system_prompt: str, user_message: str) -> str:
    if not GROQ_API_KEY:
        return "API anahtarı .env dosyasında GROQ_API_KEY olarak tanımlanmalı."

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
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

    try:
        with httpx.Client(timeout=60.0) as client:
            response = client.post(
                f"{GROQ_BASE_URL}/chat/completions",
                json=payload,
                headers=headers
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]
    except httpx.HTTPError as e:
        return f"LLM API hatası: {str(e)}"
