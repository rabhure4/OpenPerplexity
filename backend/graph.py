from langgraph.graph import StateGraph, END
from backend.state import AgentState
from backend.nodes import (
    query_reformulator,
    web_search,
    result_evaluator,
    answer_synthesiser,
)


def _route_after_evaluation(state: AgentState) -> str:
    """
    Conditional edge: if the evaluator wants more searches AND we produced
    at least one query last round, loop back to web_search.
    Otherwise proceed to synthesis.
    """
    if state.get("evaluation") == "search_more" and state.get("search_queries"):
        return "web_search"
    return "answer_synthesiser"


def build_graph() -> StateGraph:
    graph = StateGraph(AgentState)

    # ── Nodes ──────────────────────────────────────────────────────────────────
    graph.add_node("query_reformulator", query_reformulator)
    graph.add_node("web_search", web_search)
    graph.add_node("result_evaluator", result_evaluator)
    graph.add_node("answer_synthesiser", answer_synthesiser)

    # ── Edges ──────────────────────────────────────────────────────────────────
    graph.set_entry_point("query_reformulator")

    graph.add_edge("query_reformulator", "web_search")
    graph.add_edge("web_search", "result_evaluator")

    # Conditional loop: evaluator → web_search (more) OR answer_synthesiser (done)
    graph.add_conditional_edges(
        "result_evaluator",
        _route_after_evaluation,
        {
            "web_search": "web_search",
            "answer_synthesiser": "answer_synthesiser",
        },
    )

    graph.add_edge("answer_synthesiser", END)

    return graph.compile()


# Module-level compiled graph — imported directly by main.py
agent_graph = build_graph()
