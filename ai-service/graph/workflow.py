import json
from agents.guardrails_agent import run as guardrails_run
from agents.sql_agent import generate_sql
from agents.error_agent import fix_sql_error
from agents.analysis_agent import analyze_result
from agents.visualization_agent import generate_visualization
from services.db_service import execute_sql
from graph.state import AgentState

MAX_RETRIES = 3

GREETING_RESPONSES = {
    "merhaba": "Merhaba! Ben AI asistanınızım. Mağazanız hakkında sorularınızı yanıtlayabilirim.",
    "hello": "Hello! I'm your AI assistant. I can answer questions about your store data.",
    "hi": "Hi there! How can I help you today?",
    "selam": "Selam! Size nasıl yardımcı olabilirim?",
}

def run_workflow(state: AgentState) -> AgentState:
    question = state["question"]
    user_role = state["user_role"]
    store_id = state["store_id"]
    user_id = state["user_id"]

    print(f"[Workflow] Question: {question}")
    print(f"[Workflow] User Role: {user_role}, Store ID: {store_id}, User ID: {user_id}")

    guardrail_result = guardrails_run(question, user_role, store_id, user_id)
    print(f"[Workflow] Guardrail result: {guardrail_result}")

    if guardrail_result["is_greeting"]:
        state["final_answer"] = "Merhaba! Size nasıl yardımcı olabilirim?"
        return state

    if guardrail_result["should_block"]:
        reason = guardrail_result.get("blocked_reason", "UNKNOWN")
        state["is_in_scope"] = False
        state["blocked_reason"] = reason
        state["final_answer"] = f"Bu istek güvenlik nedeniyle engellendi: {reason}"
        return state

    sql_query = generate_sql(question, user_role, store_id, user_id)
    print(f"[Workflow] Generated SQL: {sql_query[:200]}...")

    iteration = 0
    last_error = None

    while iteration < MAX_RETRIES:
        try:
            print(f"[Workflow] Executing SQL (attempt {iteration + 1})...")
            sql_result = execute_sql(sql_query)
            print(f"[Workflow] SQL Result type: {type(sql_result)}, length: {len(sql_result) if isinstance(sql_result, list) else 'N/A'}")

            if isinstance(sql_result, dict) and "error" in sql_result:
                last_error = sql_result["error"]
                print(f"[Workflow] SQL Error: {last_error}")
                sql_query = fix_sql_error(str(last_error), sql_query)
                iteration += 1
                continue

            state["sql_query"] = sql_query
            state["query_result"] = sql_result

            analysis = analyze_result(question, sql_query, sql_result, user_role, store_id)
            state["final_answer"] = analysis["answer"]

            if analysis.get("needs_visualization"):
                chart_code = generate_visualization(sql_result)
                if chart_code:
                    state["visualization_code"] = chart_code

            return state

        except Exception as e:
            last_error = str(e)
            print(f"[Workflow] Exception: {last_error}")
            iteration += 1
            if iteration >= MAX_RETRIES:
                state["error"] = last_error
                state["final_answer"] = f"Bir hata oluştu: {last_error}"
                return state
            sql_query = fix_sql_error(last_error, sql_query)

    state["error"] = last_error
    state["final_answer"] = f"Sorgu {MAX_RETRIES} kez denendi ancak başarısız oldu."
    return state
