from typing import TypedDict, Optional, List, Any

class AgentState(TypedDict):
    question: str
    user_role: str
    store_id: Optional[int]
    user_id: int
    sql_query: Optional[str]
    query_result: Optional[List[Any]]
    error: Optional[str]
    final_answer: Optional[str]
    visualization_code: Optional[str]
    is_in_scope: Optional[bool]
    iteration_count: int
    blocked_reason: Optional[str]
