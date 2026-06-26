import json
from datetime import date
from langchain_core.messages import HumanMessage, SystemMessage
from backend.config import get_llm
from backend.state import AgentState, Citation

SYSTEM_PROMPT = """\
You are a research assistant. Given a user question and a set of web search results, \
write a clear, well-structured answer and list the sources you used.

Respond with ONLY a valid JSON object with exactly two keys:
  "answer": a markdown-formatted string answering the question thoroughly
  "citations": a JSON array of objects, each with "title", "url", and "snippet" keys,
               containing only the sources that were actually used in the answer

Rules:
- Write the answer in markdown. Use headers, bullet points, and bold text where helpful.
- Cite sources inline with [1], [2], etc. matching the order in the citations array.
- Include only sources that genuinely contributed to the answer.
- Do not fabricate information not present in the search results.
- If results are insufficient, say so honestly in the answer.
- For latest/current news questions, give concrete headlines or developments with source/date context when available.
- Do not answer with generic categories such as "Politics is covered by NDTV" unless the user asked for source recommendations.
- If search results are only generic outlet pages or stale/unclear snippets, say the search did not return enough concrete current headlines.
- The "answer" value must contain readable markdown text, not JSON, not a quoted string, and not escaped "\\n" sequences.
- Prefer a short introduction followed by readable bullets with inline citations.

Output format example:
{
  "answer": "## Answer\\n\\nAgentic AI refers to... [1]\\n\\n...",
  "citations": [
    {"title": "What is Agentic AI", "url": "https://...", "snippet": "..."}
  ]
}
"""


def _normalise_answer_text(value: object) -> str:
    text = str(value or "").strip()
    try:
        parsed = json.loads(text)
        if isinstance(parsed, str):
            text = parsed
        elif isinstance(parsed, dict) and isinstance(parsed.get("answer"), str):
            text = parsed["answer"]
    except (json.JSONDecodeError, TypeError):
        pass
    return (
        text.replace("\\n", "\n")
        .replace('\\"', '"')
        .replace("\\t", "  ")
        .strip()
    )


def answer_synthesiser(state: AgentState) -> dict:
    """
    Node: synthesises a structured answer with citations from accumulated search results.
    Independently testable — call with state containing 'query' and 'raw_results'.
    """
    results = state.get("raw_results", [])

    # Deduplicate by URL before passing to LLM
    seen_urls: set[str] = set()
    unique_results = []
    for r in results:
        if r["url"] not in seen_urls:
            seen_urls.add(r["url"])
            unique_results.append(r)

    context_lines = []
    for i, r in enumerate(unique_results, 1):
        context_lines.append(
            f"[{i}] Title: {r['title']}\n"
            f"    URL: {r['url']}\n"
            f"    Snippet: {r['snippet']}"
        )
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
                f"Current date: {date.today().isoformat()}\n\n"
                f"Search results:\n{context}"
            )
        ),
    ]

    response = llm.invoke(messages)
    content = response.content.strip()

    if content.startswith("```"):
        content = content.split("```")[1]
        if content.startswith("json"):
            content = content[4:]
        content = content.strip()

    try:
        data = json.loads(content)
        answer = _normalise_answer_text(data.get("answer", "No answer could be generated."))
        raw_citations = data.get("citations", [])
        allowed_urls = {r["url"] for r in unique_results}
        citations: list[Citation] = []
        for c in raw_citations:
            if not isinstance(c, dict):
                continue
            url = str(c.get("url", ""))
            if url not in allowed_urls:
                continue
            citations.append(
                Citation(
                    title=str(c.get("title", "")),
                    url=url,
                    snippet=str(c.get("snippet", "")),
                )
            )
    except (json.JSONDecodeError, ValueError):
        answer = _normalise_answer_text(content)
        citations = []

    return {"answer": answer, "citations": citations}
