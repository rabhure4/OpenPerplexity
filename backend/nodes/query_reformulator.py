import json
from datetime import date
from langchain_core.messages import HumanMessage, SystemMessage
from backend.config import get_llm
from backend.state import AgentState

SYSTEM_PROMPT = """\
You are a search query optimiser. Given a user's natural language question, produce a JSON array \
of 2-4 concise, specific search queries that together will retrieve the information needed to \
answer it. Each query should target a distinct angle or sub-question.

Rules:
- Output ONLY a valid JSON array of strings, no prose, no markdown fences.
- Prefer precise, fact-oriented queries over vague ones.
- Do not repeat the user's question verbatim as a query.
- If the user asks for latest/current/today's news, include today's date and query for specific headlines, not generic outlet pages.
- For news, include searches across major credible sources and wire-style summaries where possible.

Example output: ["query one", "query two", "query three"]
"""


def query_reformulator(state: AgentState) -> dict:
    """
    Node: rewrites the raw user query into a list of optimised search sub-queries.
    Independently testable — call with any state dict containing 'query'.
    """
    llm = get_llm(
        state.get("llm_provider"),
        state.get("llm_model"),
        state.get("llm_api_key"),
    )
    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(
            content=(
                f"Current date: {date.today().isoformat()}\n"
                f"User question: {state['query']}"
            )
        ),
    ]

    response = llm.invoke(messages)
    content = response.content.strip()

    # Strip markdown code fences if the model wrapped its output anyway
    if content.startswith("```"):
        content = content.split("```")[1]
        if content.startswith("json"):
            content = content[4:]
        content = content.strip()

    try:
        queries = json.loads(content)
        if not isinstance(queries, list):
            raise ValueError("Expected a JSON array")
        queries = [str(q).strip() for q in queries if str(q).strip()]
    except (json.JSONDecodeError, ValueError):
        # Fallback: use the original query as the single search term
        queries = [state["query"]]

    return {"search_queries": queries}
