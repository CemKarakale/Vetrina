from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv
import os

from graph.workflow import run_workflow
from graph.state import AgentState

load_dotenv()

app = FastAPI(title="AI Chat Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",
        "http://localhost:4201",
        "http://127.0.0.1:4200",
        "http://127.0.0.1:4201",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    answer: str
    sql_query: Optional[str] = None
    visualization_code: Optional[str] = None
    blocked_reason: Optional[str] = None

@app.post("/api/ai/chat", response_model=ChatResponse)
async def chat(
    req: ChatRequest,
    x_user_role: str = Header(default="USER"),
    x_user_id: str = Header(default="1"),
    x_store_id: Optional[str] = Header(default=None)
):
    try:
        user_id_int = int(x_user_id) if x_user_id else 1
        store_id_int = int(x_store_id) if x_store_id else None
    except ValueError:
        user_id_int = 1
        store_id_int = None

    state: AgentState = {
        "question": req.message,
        "user_role": x_user_role,
        "store_id": store_id_int,
        "user_id": user_id_int,
        "sql_query": None,
        "query_result": None,
        "error": None,
        "final_answer": None,
        "visualization_code": None,
        "is_in_scope": None,
        "iteration_count": 0,
        "blocked_reason": None,
    }

    result = run_workflow(state)

    return ChatResponse(
        answer=result.get("final_answer", "Bir hata oluştu."),
        sql_query=result.get("sql_query"),
        visualization_code=result.get("visualization_code"),
        blocked_reason=result.get("blocked_reason")
    )

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
