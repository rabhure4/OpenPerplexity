import json
from langchain_core.messages import HumanMessage, SystemMessage
from backend.config import get_llm, MAX_SEARCH_ITERATIONS
from backend.state import AgentState

SYSTEM_PROMPT = """\
You are a search quality evaluator. Given a user question and a set of web search snippets, \
decide whether the results are sufficient to write a high-quality answer.

Respond with ONLY a JSON object with two keys:
  "verdict": "done" or "search_more"
  "reason": one sentence explaining why

Use "search_more" only if critical information is clearly missing and another search round \
would likely help. If results are partial but acceptable, use "done".

For latest/current news questions, use "done" only when the snippets include concrete recent \
stories or headlines. Generic news homepages, category pages, or source-directory results are \
not sufficient by themselves.

Example: {"verdict": "done", "reason": "Results cover the topic adequately."}
"""


def result_evaluator(state: AgentState) -> dict:
    """
    Node: evaluates whether accumulated search results are sufficient.
    Returns {"evaluation": "done"} or {"evaluation": "search_more"}.
    Hard-caps follow-ups at MAX_SEARCH_ITERATIONS regardless of LLM verdict.
    Independently testable — call with state containing 'query' and 'raw_results'.
    """
    # Hard cap — never loop forever
    if state.get("search_iterations", 0) >= MAX_SEARCH_ITERATIONS:
        return {"evaluation": "done"}

    results = state.get("raw_results", [])
    if not results:
        return {"evaluation": "search_more"}

    # Build a compact context string for the LLM to evaluate
    context_lines = []
    for i, r in enumerate(results[:10], 1):  # cap at 10 for the evaluator prompt
        context_lines.append(f"[{i}] {r['title']}\n{r['snippet']}")
    context = "\n\n".join(context_lines)

    llm = get_llm(
        state.get("llm_provider"),
        state.get("llm_model"),
        state.get("llm_api_key"),
    )
    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(
            content=(
                f"User question: {state['query']}\n\n"
                f"Search results:\n{context}"
            )
        ),
    ]

    try:
        response = llm.invoke(messages)
        content = response.content.strip()
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
            content = content.strip()
        data = json.loads(content)
        verdict = data.get("verdict", "done")
        if verdict not in ("done", "search_more"):
            verdict = "done"
    except Exception:
        verdict = "done"

    return {"evaluation": verdict}
