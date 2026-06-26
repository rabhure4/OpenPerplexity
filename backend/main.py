import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
import requests
from backend.config import (
    LLM_MODEL,
    OLLAMA_BASE_URL,
    OPENROUTER_BASE_URL,
    OPENROUTER_CA_BUNDLE,
    OPENROUTER_VERIFY_SSL,
    resolve_llm_provider,
    resolve_search_provider,
)
from backend.graph import agent_graph
from backend.nodes import (
    answer_synthesiser,
    query_reformulator,
    result_evaluator,
    web_search,
)

app = FastAPI(title="OpenPerplexity", version="0.1.0")

# ── CORS ───────────────────────────────────────────────────────────────────────
# Allow the Vite dev server and any localhost port during development.
# Tighten origins for production deployment.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Schemas ────────────────────────────────────────────────────────────────────
class RunRequest(BaseModel):
    query: str = Field(..., min_length=1, description="Natural language question")
    llm_provider: str | None = Field(
        None,
        description="Optional runtime LLM provider: openrouter, openai, gemini, or ollama",
    )
    search_provider: str | None = Field(
        None,
        description="Optional runtime search provider: duckduckgo, tavily, or serpapi",
    )
    llm_model: str | None = Field(None, description="Optional runtime model id")
    llm_api_key: str | None = Field(None, description="Optional runtime LLM API key")
    search_api_key: str | None = Field(None, description="Optional runtime search API key")


class ModelListRequest(BaseModel):
    provider: str = Field("openrouter", description="LLM provider")
    api_key: str | None = Field(None, description="Optional provider API key")


class ModelInfo(BaseModel):
    id: str
    name: str
    description: str = ""


class ModelListResponse(BaseModel):
    provider: str
    models: list[ModelInfo]


class Citation(BaseModel):
    title: str
    url: str
    snippet: str


class RunResponse(BaseModel):
    answer: str
    citations: list[Citation]
    llm_provider: str
    llm_model: str
    search_provider: str


# ── Endpoints ──────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/models", response_model=ModelListResponse)
def list_models(request: ModelListRequest):
    provider = resolve_llm_provider(request.provider)

    try:
        if provider == "openrouter":
            import requests

            headers = {}
            if request.api_key:
                headers["Authorization"] = f"Bearer {request.api_key}"
            verify: bool | str = OPENROUTER_VERIFY_SSL
            if OPENROUTER_CA_BUNDLE:
                verify = OPENROUTER_CA_BUNDLE
            response = requests.get(
                f"{OPENROUTER_BASE_URL.rstrip('/')}/models",
                headers=headers,
                timeout=20,
                verify=verify,
            )
            response.raise_for_status()
            data = response.json()
            models = [
                ModelInfo(
                    id=str(item.get("id", "")),
                    name=str(item.get("name") or item.get("id", "")),
                    description=str(item.get("description", "")),
                )
                for item in data.get("data", [])
                if item.get("id")
            ]
            return ModelListResponse(provider=provider, models=models)

        if provider == "openai":
            import requests

            if not request.api_key:
                raise ValueError("OpenAI model lookup requires an API key.")
            response = requests.get(
                "https://api.openai.com/v1/models",
                headers={"Authorization": f"Bearer {request.api_key}"},
                timeout=20,
            )
            response.raise_for_status()
            data = response.json()
            models = [
                ModelInfo(id=str(item.get("id", "")), name=str(item.get("id", "")))
                for item in data.get("data", [])
                if item.get("id")
            ]
            return ModelListResponse(provider=provider, models=models)

        if provider == "ollama":
            import requests

            response = requests.get(f"{OLLAMA_BASE_URL.rstrip('/')}/api/tags", timeout=10)
            response.raise_for_status()
            data = response.json()
            models = [
                ModelInfo(
                    id=str(item.get("name", "")),
                    name=str(item.get("name", "")),
                    description=str(item.get("details", "")),
                )
                for item in data.get("models", [])
                if item.get("name")
            ]
            return ModelListResponse(provider=provider, models=models)

        if not request.api_key:
            raise ValueError("Gemini model lookup requires an API key.")
        response = requests.get(
            "https://generativelanguage.googleapis.com/v1beta/models",
            params={"key": request.api_key},
            timeout=20,
        )
        response.raise_for_status()
        data = response.json()
        models = [
            ModelInfo(
                id=str(item.get("name", "")).replace("models/", ""),
                name=str(item.get("displayName") or item.get("name", "")),
                description=str(item.get("description", "")),
            )
            for item in data.get("models", [])
            if item.get("name")
        ]
        return ModelListResponse(provider=provider, models=models)
    except requests.exceptions.SSLError as exc:
        if provider == "openrouter":
            raise HTTPException(
                status_code=500,
                detail=(
                    "OpenRouter SSL certificate verification failed. If you are behind "
                    "a corporate proxy, set OPENROUTER_CA_BUNDLE to your CA certificate "
                    "file path. For local development only, you can set "
                    "OPENROUTER_VERIFY_SSL=false in backend/.env and restart the backend. "
                    f"Original error: {exc}"
                ),
            )
        raise HTTPException(status_code=500, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/run", response_model=RunResponse)
async def run(request: RunRequest):
    try:
        llm_provider = resolve_llm_provider(request.llm_provider)
        search_provider = resolve_search_provider(request.search_provider)
        llm_model = request.llm_model or LLM_MODEL
        if not llm_model:
            raise ValueError("No LLM model selected. Choose a model in Settings or set LLM_MODEL.")
        result = agent_graph.invoke(
            {
                "query": request.query,
                "llm_provider": llm_provider,
                "llm_model": llm_model,
                "llm_api_key": request.llm_api_key or "",
                "search_provider": search_provider,
                "search_api_key": request.search_api_key or "",
                "search_queries": [],
                "raw_results": [],
                "search_errors": [],
                "search_iterations": 0,
                "evaluation": "",
                "answer": "",
                "citations": [],
            }
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    return RunResponse(
        answer=result.get("answer", ""),
        llm_provider=result.get("llm_provider", llm_provider),
        llm_model=result.get("llm_model", llm_model),
        search_provider=result.get("search_provider", search_provider),
        citations=[
            Citation(
                title=c.get("title", ""),
                url=c.get("url", ""),
                snippet=c.get("snippet", ""),
            )
            for c in result.get("citations", [])
        ],
    )


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


def _merge_state(state: dict, update: dict) -> dict:
    merged = {**state, **update}
    if "raw_results" in state and "raw_results" in update:
        merged["raw_results"] = state["raw_results"] + update["raw_results"]
    if "search_errors" in state and "search_errors" in update:
        merged["search_errors"] = state["search_errors"] + update["search_errors"]
    return merged


def _chunk_text(text: str, size: int = 80):
    for index in range(0, len(text), size):
        yield text[index:index + size]


@app.post("/run/stream")
def run_stream(request: RunRequest):
    def events():
        try:
            llm_provider = resolve_llm_provider(request.llm_provider)
            search_provider = resolve_search_provider(request.search_provider)
            llm_model = request.llm_model or LLM_MODEL
            if not llm_model:
                raise ValueError("No LLM model selected. Choose a model in Settings or set LLM_MODEL.")

            state = {
                "query": request.query,
                "llm_provider": llm_provider,
                "llm_model": llm_model,
                "llm_api_key": request.llm_api_key or "",
                "search_provider": search_provider,
                "search_api_key": request.search_api_key or "",
                "search_queries": [],
                "raw_results": [],
                "search_errors": [],
                "search_iterations": 0,
                "evaluation": "",
                "answer": "",
                "citations": [],
            }

            yield _sse("trace", {"step": "start", "message": "Starting research run"})

            yield _sse("trace", {"step": "query_reformulator", "message": "Reformulating the question into search queries"})
            state = _merge_state(state, query_reformulator(state))
            yield _sse(
                "trace",
                {
                    "step": "query_reformulator",
                    "message": f"Prepared {len(state.get('search_queries', []))} search queries",
                    "search_queries": state.get("search_queries", []),
                },
            )

            while True:
                yield _sse(
                    "trace",
                    {
                        "step": "web_search",
                        "message": f"Searching with {search_provider}",
                        "search_queries": state.get("search_queries", []),
                    },
                )
                previous_error_count = len(state.get("search_errors", []))
                state = _merge_state(state, web_search(state))
                new_errors = state.get("search_errors", [])[previous_error_count:]
                yield _sse(
                    "trace",
                    {
                        "step": "web_search",
                        "message": f"Collected {len(state.get('raw_results', []))} total results",
                        "result_count": len(state.get("raw_results", [])),
                        "search_errors": new_errors,
                    },
                )
                yield _sse(
                    "sources",
                    {
                        "sources": state.get("raw_results", []),
                        "result_count": len(state.get("raw_results", [])),
                    },
                )
                if new_errors:
                    yield _sse(
                        "trace",
                        {
                            "step": "web_search_warning",
                            "message": f"{len(new_errors)} search queries failed",
                            "search_errors": new_errors,
                        },
                    )

                yield _sse("trace", {"step": "result_evaluator", "message": "Checking whether the results are sufficient"})
                state = _merge_state(state, result_evaluator(state))
                verdict = state.get("evaluation", "done")
                yield _sse("trace", {"step": "result_evaluator", "message": f"Evaluator verdict: {verdict}", "verdict": verdict})

                if verdict != "search_more" or not state.get("search_queries"):
                    break

            yield _sse("trace", {"step": "answer_synthesiser", "message": "Synthesizing the final answer with citations"})
            state = _merge_state(state, answer_synthesiser(state))

            for chunk in _chunk_text(state.get("answer", "")):
                yield _sse("answer_delta", {"text": chunk})

            yield _sse(
                "final",
                {
                    "answer": state.get("answer", ""),
                    "citations": state.get("citations", []),
                    "llm_provider": llm_provider,
                    "llm_model": llm_model,
                    "search_provider": search_provider,
                    "result_count": len(state.get("raw_results", [])),
                    "search_iterations": state.get("search_iterations", 0),
                },
            )
            yield _sse("trace", {"step": "done", "message": "Done"})
        except Exception as exc:
            yield _sse("error", {"message": str(exc)})

    return StreamingResponse(events(), media_type="text/event-stream")
