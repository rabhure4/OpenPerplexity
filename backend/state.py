from typing import Annotated
from typing_extensions import TypedDict
import operator


class SearchResult(TypedDict):
    title: str
    url: str
    snippet: str


class Citation(TypedDict):
    title: str
    url: str
    snippet: str


class SearchError(TypedDict):
    query: str
    message: str


class AgentState(TypedDict):
    # The original user query — never mutated
    query: str

    # Runtime provider choices. If absent, config.py uses .env defaults.
    llm_provider: str
    llm_model: str
    llm_api_key: str
    search_provider: str
    search_api_key: str

    # Optimised sub-queries produced by query_reformulator
    search_queries: list[str]

    # Raw results accumulated across all search rounds
    # Annotated with operator.add so LangGraph merges lists across parallel branches
    raw_results: Annotated[list[SearchResult], operator.add]

    # Search provider failures captured for UI trace/debug visibility
    search_errors: list[SearchError]

    # How many follow-up search rounds have been attempted
    search_iterations: int

    # Evaluator verdict: "done" | "search_more"
    evaluation: str

    # Final synthesised answer text
    answer: str

    # Deduplicated citations extracted from raw_results
    citations: list[Citation]
