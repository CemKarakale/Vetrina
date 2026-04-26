import os
import httpx
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_API_KEY_2 = os.getenv("GROQ_API_KEY_2", "")
GROQ_BASE_URL = "https://api.groq.com/openai/v1"
LLM_MODEL = os.getenv("LLM_MODEL", "llama-3.3-70b-versatile")


def call_llm(system_prompt: str, user_message: str) -> str:
    api_keys = [key for key in [GROQ_API_KEY, GROQ_API_KEY_2] if key]

    if not api_keys:
        return "LLM servisi yapilandirilmamis."

    payload = {
        "model": LLM_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        "max_tokens": 2048,
        "temperature": 0.1,
    }

    for index, api_key in enumerate(api_keys):
        try:
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            }
            with httpx.Client(timeout=60.0) as client:
                response = client.post(
                    f"{GROQ_BASE_URL}/chat/completions",
                    json=payload,
                    headers=headers,
                )
                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"]
        except httpx.HTTPStatusError as exc:
            status = exc.response.status_code
            if status in {401, 403, 429} and index < len(api_keys) - 1:
                print(f"[LLM] API key {index + 1} could not be used, trying key {index + 2}...")
                continue
            if status in {401, 403}:
                return "LLM servisi kimlik dogrulamasi basarisiz. Lutfen AI servis anahtarini kontrol edin."
            if status == 429:
                return "LLM servisi su anda yogun. Lutfen biraz sonra tekrar deneyin."
            return f"LLM API hatasi: HTTP {status}"
        except httpx.HTTPError as exc:
            return f"LLM API hatasi: {str(exc)}"

    return "LLM API hatasi: Tum API anahtarlari basarisiz."
