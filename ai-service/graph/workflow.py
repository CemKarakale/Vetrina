from typing import Literal
from langgraph.graph import StateGraph, END, START

from agents.guardrails_agent import run as guardrail_run
from agents.intent_agent import parse_intent
from agents.sql_agent import generate_sql
from agents.error_agent import fix_sql_error
from agents.analysis_agent import analyze_result
from agents.visualization_agent import generate_visualization
from services.db_service import execute_sql
from security.guardrails import validate_sql_safety
from graph.state import AgentState

MAX_RETRIES = 3

# ════════════════════════════════════════════════════════════════════════════
# Greeting / sohbet cevapları
# ════════════════════════════════════════════════════════════════════════════
GREETING_RESPONSES = {
    "merhaba":    "Merhaba! Ben AI asistanınızım. Mağaza veriniz hakkında sorularınızı yanıtlayabilirim.",
    "hello":      "Hello! I'm your AI assistant. I can answer questions about your store data.",
    "hi":         "Hi there! How can I help you today?",
    "selam":      "Selam! Size nasıl yardımcı olabilirim?",
    "naber":      "İyiyim, teşekkürler! Mağaza verinizle ilgili bir sorunuz mu var?",
    "ne haber":   "İyiyim! Satış, stok veya sipariş hakkında soru sorabilirsiniz.",
    "nasılsın":   "İyiyim, teşekkür ederim! Sorularınızı yanıtlamaya hazırım.",
    "günaydın":   "Günaydın! Bugün nasıl yardımcı olabilirim?",
    "iyi günler": "İyi günler! Verilerinizle ilgili bir sorunuz var mı?",
    "teşekkür":   "Rica ederim! Başka bir sorunuz var mı?",
    "sağ ol":     "Rica ederim! Başka yardımcı olabileceğim bir konu var mı?",
    "görüşürüz":  "Görüşürüz! İyi günler dilerim.",
    "bye":        "Goodbye! Have a great day!",
    "thanks":     "You're welcome! Anything else I can help with?",
    "thank you":  "You're welcome! Feel free to ask more questions.",
}

FALLBACK_GREETING = (
    "Merhaba! Size e-ticaret veriniz hakkında yardımcı olmaktan memnuniyet duyarım. "
    "Satışlar, stok durumu, siparişler veya ürünler hakkında soru sorabilirsiniz."
)

def _greeting_response(question: str) -> str:
    q = question.lower().strip()
    if q in GREETING_RESPONSES:
        return GREETING_RESPONSES[q]
    for key, resp in GREETING_RESPONSES.items():
        if q.startswith(key):
            return resp
    return FALLBACK_GREETING


# ════════════════════════════════════════════════════════════════════════════
# LangGraph Node Fonksiyonları
# ════════════════════════════════════════════════════════════════════════════

def guardrail_node(state: AgentState) -> AgentState:
    """Node 1: Güvenlik ve kapsam kontrolü."""
    question = state["question"]
    user_role = state["user_role"]
    store_id = state["store_id"]
    user_id = state["user_id"]

    print(f"[Guardrail Node] Q='{question[:60]}' | role={user_role} | store={store_id}")
    result = guardrail_run(question, user_role, store_id, user_id)
    print(f"[Guardrail Node] Result: {result}")

    state["is_in_scope"] = result["is_in_scope"]
    state["blocked_reason"] = result.get("blocked_reason")

    if result["is_greeting"]:
        state["final_answer"] = _greeting_response(question)

    if result["should_block"]:
        state["final_answer"] = result.get("blocked_message") or f"Engellendi: {result.get('blocked_reason')}"

    return state


def route_after_guardrail(state: AgentState) -> Literal["intent_node", "end_node"]:
    """Guardrail sonucuna göre yönlendirme."""
    if state.get("final_answer"):
        return "end_node"
    return "intent_node"


def intent_node(state: AgentState) -> AgentState:
    """Node 2: Mesajı ayrıştır — selamlama temizle, alt sorguları belirle."""
    question = state["question"]
    print(f"[Intent Node] Parsing: '{question[:80]}'")
    intent = parse_intent(question)
    print(f"[Intent Node] has_greeting={intent['has_greeting']}, sub_queries={intent['sub_queries']}")

    sub_queries = intent.get("sub_queries", [])
    if not sub_queries:
        state["final_answer"] = _greeting_response(question)
    else:
        # Sub-query'leri state'e kaydet (virgülle ayrılmış JSON string olarak)
        import json
        state["question"] = json.dumps(sub_queries, ensure_ascii=False)

    return state


def route_after_intent(state: AgentState) -> Literal["sql_node", "end_node"]:
    if state.get("final_answer"):
        return "end_node"
    return "sql_node"


def sql_node(state: AgentState) -> AgentState:
    """Node 3: Her alt sorgu için SQL üret ve çalıştır."""
    import json
    user_role = state["user_role"]
    store_id = state["store_id"]
    user_id = state["user_id"]

    # Sub-query listesini al
    try:
        sub_queries = json.loads(state["question"])
        if not isinstance(sub_queries, list):
            sub_queries = [state["question"]]
    except Exception:
        sub_queries = [state["question"]]

    print(f"[SQL Node] Processing {len(sub_queries)} sub-queries")

    combined_answers = []
    last_viz = None
    last_sql = None
    last_result = None

    for i, sub_q in enumerate(sub_queries):
        print(f"[SQL Node] Sub-query {i+1}/{len(sub_queries)}: {sub_q}")

        sql_query = generate_sql(sub_q, user_role, store_id, user_id)
        print(f"[SQL Node] Generated SQL: {sql_query[:200]}")

        # SQL güvenlik kontrolü
        is_safe, reason = validate_sql_safety(sql_query)
        if not is_safe:
            print(f"[SQL Node] SQL safety FAILED: {reason}")
            combined_answers.append(f"⚠️ Güvensiz sorgu engellendi: {reason}")
            continue

        # Retry döngüsü
        iteration = 0
        answer = None

        while iteration < MAX_RETRIES:
            state["iteration_count"] = iteration + 1
            print(f"[SQL Node] Executing (attempt {iteration + 1})...")

            try:
                sql_result = execute_sql(sql_query)

                if isinstance(sql_result, dict) and "error" in sql_result:
                    err = sql_result["error"]
                    print(f"[SQL Node] DB Error: {err}")
                    sql_query = fix_sql_error(str(err), sql_query)
                    iteration += 1
                    continue

                print(f"[SQL Node] Got {len(sql_result) if isinstance(sql_result, list) else '?'} rows")

                # Analysis
                analysis = analyze_result(sub_q, sql_query, sql_result, user_role, store_id)
                answer = analysis["answer"]

                # Visualization
                if analysis.get("needs_visualization") and isinstance(sql_result, list) and len(sql_result) >= 2:
                    try:
                        viz = generate_visualization(sql_result)
                        if viz:
                            last_viz = viz
                    except Exception as ve:
                        print(f"[SQL Node] Visualization error (non-fatal): {ve}")

                last_sql = sql_query
                last_result = sql_result
                break

            except Exception as e:
                err_str = str(e)
                print(f"[SQL Node] Exception: {err_str}")
                iteration += 1
                if iteration >= MAX_RETRIES:
                    answer = f"Sorgu başarısız oldu: {err_str}"
                    break
                sql_query = fix_sql_error(err_str, sql_query)

        if answer is None:
            answer = f"Sorgu {MAX_RETRIES} kez denendi ancak başarısız oldu."

        prefix = f"**{i+1}. {sub_q}**\n" if len(sub_queries) > 1 else ""
        combined_answers.append(prefix + answer)

    separator = "\n\n---\n\n" if len(sub_queries) > 1 else ""
    state["final_answer"] = separator.join(combined_answers)

    if last_viz:
        state["visualization_code"] = last_viz
    if last_sql:
        state["sql_query"] = last_sql
    if last_result is not None:
        state["query_result"] = last_result

    return state


def end_node(state: AgentState) -> AgentState:
    """Node 4: Akışı sonlandır (pass-through)."""
    print(f"[End Node] Final answer: {str(state.get('final_answer', ''))[:100]}")
    return state


# ════════════════════════════════════════════════════════════════════════════
# LangGraph StateGraph Kurulumu
# ════════════════════════════════════════════════════════════════════════════

def build_graph() -> StateGraph:
    graph = StateGraph(AgentState)

    # Node'ları ekle
    graph.add_node("guardrail_node", guardrail_node)
    graph.add_node("intent_node", intent_node)
    graph.add_node("sql_node", sql_node)
    graph.add_node("end_node", end_node)

    # Edge'leri tanımla
    graph.add_edge(START, "guardrail_node")
    graph.add_conditional_edges(
        "guardrail_node",
        route_after_guardrail,
        {"intent_node": "intent_node", "end_node": "end_node"},
    )
    graph.add_conditional_edges(
        "intent_node",
        route_after_intent,
        {"sql_node": "sql_node", "end_node": "end_node"},
    )
    graph.add_edge("sql_node", "end_node")
    graph.add_edge("end_node", END)

    return graph.compile()


# Compile once at module load
_compiled_graph = build_graph()


def run_workflow(state: AgentState) -> AgentState:
    """Ana giriş noktası — LangGraph graph'ı çalıştırır."""
    print(f"\n[Workflow] ══════ New Request ══════")
    print(f"[Workflow] Q='{state['question']}' | role={state['user_role']}")
    result = _compiled_graph.invoke(state)
    print(f"[Workflow] ══════ Done ══════\n")
    return result
