from backend.config import (
    SEARCH_RESULTS_PER_QUERY,
    TAVILY_API_KEY,
    SERPAPI_API_KEY,
    resolve_search_provider,
)
from backend.state import AgentState, SearchError, SearchResult


def _search_duckduckgo(query: str) -> list[SearchResult]:
    import requests
    from lxml import html
    from urllib.parse import parse_qs, unquote, urlparse

    response = requests.get(
        "https://html.duckduckgo.com/html/",
        params={"q": query},
        headers={"User-Agent": "Mozilla/5.0"},
        timeout=10,
    )
    response.raise_for_status()
    document = html.fromstring(response.text)

    results: list[SearchResult] = []
    for result in document.xpath(
        "//*[contains(concat(' ', normalize-space(@class), ' '), ' result ')]"
    )[:SEARCH_RESULTS_PER_QUERY]:
        title = " ".join(
            result.xpath(
                ".//*[contains(concat(' ', normalize-space(@class), ' '), ' result__a ')]//text()"
            )
        ).strip()
        href = result.xpath(
            ".//*[contains(concat(' ', normalize-space(@class), ' '), ' result__a ')]/@href"
        )
        snippet = " ".join(
            result.xpath(
                ".//*[contains(concat(' ', normalize-space(@class), ' '), ' result__snippet ')]//text()"
            )
        ).strip()
        url = href[0] if href else ""
        parsed = urlparse(url)
        if parsed.query:
            url = unquote(parse_qs(parsed.query).get("uddg", [url])[0])
        if title and url:
            results.append(SearchResult(title=title, url=url, snippet=snippet))

    if not results:
        raise RuntimeError("DuckDuckGo returned no parseable results.")
    return results


def _search_tavily(query: str, api_key: str | None = None) -> list[SearchResult]:
    from tavily import TavilyClient

    client = TavilyClient(api_key=api_key or TAVILY_API_KEY)
    response = client.search(
        query=query,
        max_results=SEARCH_RESULTS_PER_QUERY,
        include_answer=False,
    )
    return [
        SearchResult(
            title=r.get("title", ""),
            url=r.get("url", ""),
            snippet=r.get("content", ""),
        )
        for r in response.get("results", [])
    ]


def _search_serpapi(query: str, api_key: str | None = None) -> list[SearchResult]:
    import requests

    params = {
        "engine": "google",
        "q": query,
        "num": SEARCH_RESULTS_PER_QUERY,
        "api_key": api_key or SERPAPI_API_KEY,
    }
    response = requests.get("https://serpapi.com/search", params=params, timeout=15)
    response.raise_for_status()
    data = response.json()
    return [
        SearchResult(
            title=r.get("title", ""),
            url=r.get("link", ""),
            snippet=r.get("snippet", ""),
        )
        for r in data.get("organic_results", [])
    ]


_SEARCH_DISPATCH = {
    "duckduckgo": _search_duckduckgo,
    "tavily": _search_tavily,
    "serpapi": _search_serpapi,
}


def web_search(state: AgentState) -> dict:
    search_provider = resolve_search_provider(state.get("search_provider"))
    search_fn = _SEARCH_DISPATCH[search_provider]

    all_results: list[SearchResult] = []
    search_errors: list[SearchError] = []
    search_api_key = state.get("search_api_key")
    for query in state.get("search_queries", []):
        try:
            if search_provider == "duckduckgo":
                all_results.extend(search_fn(query))
            else:
                all_results.extend(search_fn(query, search_api_key))
        except Exception as exc:
            message = str(exc)
            print(f"[web_search] Error on query '{query}': {message}")
            search_errors.append(SearchError(query=query, message=message))

    return {
        "raw_results": all_results,
        "search_errors": search_errors,
        "search_iterations": state.get("search_iterations", 0) + 1,
    }
