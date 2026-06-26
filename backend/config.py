import os
from dotenv import load_dotenv

load_dotenv()


SUPPORTED_LLM_PROVIDERS = {"openrouter", "openai", "gemini", "ollama"}
SUPPORTED_SEARCH_PROVIDERS = {"duckduckgo", "tavily", "serpapi"}

# Defaults. These can be overridden per request by the UI.
LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "openrouter").lower()
LLM_MODEL: str = os.getenv("LLM_MODEL", "")
LLM_TEMPERATURE: float = float(os.getenv("LLM_TEMPERATURE", "0.2"))

OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_BASE_URL: str = os.getenv(
    "OPENROUTER_BASE_URL",
    "https://openrouter.ai/api/v1",
)
OPENROUTER_CA_BUNDLE: str = os.getenv("OPENROUTER_CA_BUNDLE", "")
OPENROUTER_VERIFY_SSL: bool = os.getenv("OPENROUTER_VERIFY_SSL", "true").lower() not in {
    "0",
    "false",
    "no",
}
GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")
OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

SEARCH_PROVIDER: str = os.getenv("SEARCH_PROVIDER", "duckduckgo").lower()
TAVILY_API_KEY: str = os.getenv("TAVILY_API_KEY", "")
SERPAPI_API_KEY: str = os.getenv("SERPAPI_API_KEY", "")
SEARCH_RESULTS_PER_QUERY: int = int(os.getenv("SEARCH_RESULTS_PER_QUERY", "5"))

MAX_SEARCH_ITERATIONS: int = int(os.getenv("MAX_SEARCH_ITERATIONS", "2"))


def resolve_llm_provider(provider: str | None = None) -> str:
    selected = (provider or LLM_PROVIDER or "openrouter").lower()
    if selected not in SUPPORTED_LLM_PROVIDERS:
        raise ValueError(
            f"Unknown LLM provider '{selected}'. "
            "Choose from: openrouter | openai | gemini | ollama"
        )
    return selected


def resolve_search_provider(provider: str | None = None) -> str:
    selected = (provider or SEARCH_PROVIDER or "duckduckgo").lower()
    if selected not in SUPPORTED_SEARCH_PROVIDERS:
        raise ValueError(
            f"Unknown search provider '{selected}'. "
            "Choose from: duckduckgo | tavily | serpapi"
        )
    return selected


def get_llm(
    provider: str | None = None,
    model: str | None = None,
    api_key: str | None = None,
):
    """Return a LangChain chat model instance for the selected provider."""
    llm_provider = resolve_llm_provider(provider)
    llm_model = model or LLM_MODEL
    if not llm_model:
        raise ValueError("No LLM model selected. Choose a model in Settings or set LLM_MODEL.")

    if llm_provider == "openai":
        from langchain_openai import ChatOpenAI

        return ChatOpenAI(
            model=llm_model,
            temperature=LLM_TEMPERATURE,
            api_key=api_key or OPENAI_API_KEY,
        )

    if llm_provider == "openrouter":
        import httpx
        from langchain_openai import ChatOpenAI

        verify: bool | str = OPENROUTER_VERIFY_SSL
        if OPENROUTER_CA_BUNDLE:
            verify = OPENROUTER_CA_BUNDLE

        return ChatOpenAI(
            model=llm_model,
            temperature=LLM_TEMPERATURE,
            api_key=api_key or OPENROUTER_API_KEY,
            base_url=OPENROUTER_BASE_URL,
            http_client=httpx.Client(verify=verify),
            default_headers={
                "HTTP-Referer": "https://openperplexity.app",
                "X-Title": "OpenPerplexity",
            },
        )

    if llm_provider == "gemini":
        from langchain_google_genai import ChatGoogleGenerativeAI

        return ChatGoogleGenerativeAI(
            model=llm_model,
            temperature=LLM_TEMPERATURE,
            google_api_key=api_key or GOOGLE_API_KEY,
        )

    if llm_provider == "ollama":
        from langchain_ollama import ChatOllama

        return ChatOllama(
            model=llm_model,
            temperature=LLM_TEMPERATURE,
            base_url=OLLAMA_BASE_URL,
        )

    raise ValueError(f"Unknown LLM provider '{llm_provider}'")
