# OpenPerplexity

![Python](https://img.shields.io/badge/Python-3.11%2B-blue)
![React](https://img.shields.io/badge/React-18-61DAFB)
![FastAPI](https://img.shields.io/badge/FastAPI-backend-009688)
![License](https://img.shields.io/badge/License-MIT-green)

OpenPerplexity is an agentic web-search app. It takes a natural language question, turns it into better search queries, retrieves web results, evaluates whether it has enough evidence, and then synthesizes an answer with citations.

The project has a FastAPI + LangGraph backend and a React + Vite frontend.

Ask a question, watch the agent search the web, and get a cited answer back in real time.

## Repository Status

This project is in active development. The core research loop is working, but there may still be rough edges around deployment, provider behavior, and production hardening.

## Why This Exists

Most chat apps answer directly from the model. OpenPerplexity adds a research loop: it searches the web, evaluates whether the results are enough, searches again when needed, and then answers with citations.

The goal is to show a practical agentic workflow that is small enough to understand, but useful enough to run locally.

## Use Cases

- Research assistant for cited web answers
- Learning project for LangGraph and agent workflows
- Starter template for search-augmented AI apps
- Local playground for comparing LLM and search providers
- Demo app for streaming AI responses with FastAPI and React

## Features

- Agent-style research loop with query reformulation, web search, result evaluation, and answer synthesis
- Streaming responses with progress updates from the backend
- Citations returned with each answer
- Configurable LLM providers: OpenRouter, OpenAI, Gemini, and Ollama
- Configurable search providers: DuckDuckGo, Tavily, and SerpAPI
- React frontend for querying, model selection, and source display

## Tech Stack

- Backend: Python, FastAPI, LangGraph, LangChain
- Frontend: React, Vite, Tailwind CSS
- Search: DuckDuckGo, Tavily, SerpAPI
- LLMs: OpenRouter, OpenAI, Gemini, Ollama

## Quick Start

Run these commands from the repository root:

```bash
python -m venv backend/.venv
backend\.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
cp backend/.env.example backend/.env
npm --prefix frontend install
```

Edit `backend/.env` and set at least one LLM provider/model. Then start both apps:

```bash
python -m uvicorn backend.main:app --reload --port 8001
npm run frontend:dev
```

Open the frontend at:

```text
http://localhost:5173
```

## Screenshots

### Main Launch Screen

![OpenPerplexity main launch screen](docs/screenshots/main.png)

Main screen for entering a question and selecting model/search providers.

### App Working State

![OpenPerplexity working state](docs/screenshots/working.png)

Streaming progress view while the agent reformulates, searches, evaluates, and synthesizes.

### Response With Citations

![OpenPerplexity response with citations](docs/screenshots/response.png)

Final answer view with cited sources.

## How It Works

OpenPerplexity runs a multi-step research workflow instead of sending the user query directly to an LLM.

1. The user enters a question in the React frontend.
2. The FastAPI backend sends the query into a LangGraph workflow.
3. The query reformulator turns the original question into focused search queries.
4. The search node fetches relevant web results from the selected search provider.
5. The evaluator checks whether the gathered results are enough to answer well.
6. If more evidence is needed, the graph loops back for another search round.
7. The answer synthesizer produces a final response with citations.

## What Makes It Agentic

OpenPerplexity is agentic because it does more than one-shot question answering. It can break a task into steps, use external search tools, evaluate intermediate results, and decide whether to continue searching before producing the final answer.

The backend uses LangGraph to model this as a controlled loop:

```text
query -> reformulate -> search -> evaluate -> search more or answer
```

This gives the app a simple but practical research-agent pattern.

## Key Technical Highlights

- LangGraph-powered workflow with conditional routing
- FastAPI backend with standard and streaming endpoints
- Server-Sent Events for live progress updates in the UI
- Runtime provider selection for LLM and search backends
- Citation-aware answer generation
- React component structure with separate input, output, state, and shared UI components
- Static documentation included in the `docs/` directory

## Sample Query / Response

Sample query:

```text
What is agentic AI and why does it matter?
```

Sample response shape:

```json
{
  "answer": "Agentic AI refers to AI systems that can plan, use tools, evaluate progress, and complete multi-step tasks with less direct human control.",
  "citations": [
    {
      "title": "Example source title",
      "url": "https://example.com/source",
      "snippet": "Relevant source excerpt..."
    }
  ],
  "llm_provider": "openrouter",
  "llm_model": "openai/gpt-4o-mini",
  "search_provider": "duckduckgo"
}
```

## Limitations

- Answer quality depends on the selected model and search provider.
- Web search results may vary between runs.
- DuckDuckGo can be rate-limited or return inconsistent results.
- API keys are entered locally and should not be committed to Git.
- The app does not verify every claim beyond the retrieved search results.
- Production deployment needs stricter CORS, secret handling, logging, and rate limiting.

## Roadmap

- Add authentication for deployed usage
- Add persistent search history
- Add export options for answers and citations
- Improve source ranking and deduplication
- Add automated backend and frontend tests
- Add deployment guides for common hosting providers

## Project Structure

```text
openperplexity/
|-- backend/
|   |-- main.py                 # FastAPI app and API routes
|   |-- graph.py                # LangGraph workflow
|   |-- state.py                # Agent state schema
|   |-- config.py               # Provider and environment configuration
|   |-- nodes/                  # Graph nodes
|   |-- requirements.txt
|   `-- .env.example
|-- frontend/
|   |-- src/
|   |   |-- api/                # API client
|   |   |-- components/         # UI components
|   |   |-- App.jsx
|   |   |-- config.js
|   |   `-- main.jsx
|   |-- package.json
|   `-- vite.config.js
|-- docs/                       # Static documentation site
|   `-- screenshots/            # README screenshots
|-- package.json                # Root helper scripts
`-- README.md
```

## Prerequisites

- Python 3.11+
- Node.js 18+
- npm
- An API key for at least one LLM provider, unless you use Ollama locally

## Setup

Run commands from the repository root.

### 1. Backend

```bash
python -m venv backend/.venv
```

Activate the virtual environment:

```bash
# Windows PowerShell
backend\.venv\Scripts\Activate.ps1

# macOS / Linux
source backend/.venv/bin/activate
```

Install Python dependencies:

```bash
pip install -r backend/requirements.txt
```

Create your backend environment file:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and set your provider, model, and API keys.

Start the backend:

```bash
python -m uvicorn backend.main:app --reload --port 8001
```

Backend health check:

```text
http://localhost:8001/health
```

### 2. Frontend

Install frontend dependencies:

```bash
npm --prefix frontend install
```

Start the frontend:

```bash
npm --prefix frontend run dev
```

Open:

```text
http://localhost:5173
```

You can also use the root helper scripts:

```bash
npm run backend:dev
npm run frontend:dev
npm run frontend:build
```

## Configuration

Backend configuration lives in `backend/.env`.

Never commit `backend/.env`. Use `backend/.env.example` as the template and keep real API keys local.

| Variable | Default | Description |
| --- | --- | --- |
| `LLM_PROVIDER` | `openrouter` | `openrouter`, `openai`, `gemini`, or `ollama` |
| `LLM_MODEL` | empty | Model ID for the selected provider |
| `LLM_TEMPERATURE` | `0.2` | LLM generation temperature |
| `OPENROUTER_API_KEY` | empty | Required for OpenRouter |
| `OPENROUTER_BASE_URL` | `https://openrouter.ai/api/v1` | OpenRouter-compatible API base URL |
| `OPENROUTER_CA_BUNDLE` | empty | Optional custom CA bundle path |
| `OPENROUTER_VERIFY_SSL` | `true` | Set to `false` only for local proxy troubleshooting |
| `OPENAI_API_KEY` | empty | Required for OpenAI |
| `GOOGLE_API_KEY` | empty | Required for Gemini |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama server URL |
| `SEARCH_PROVIDER` | `duckduckgo` | `duckduckgo`, `tavily`, or `serpapi` |
| `TAVILY_API_KEY` | empty | Required for Tavily |
| `SERPAPI_API_KEY` | empty | Required for SerpAPI |
| `SEARCH_RESULTS_PER_QUERY` | `5` | Search results fetched per generated query |
| `MAX_SEARCH_ITERATIONS` | `2` | Maximum follow-up search rounds |

Frontend display settings and API base URL are in `frontend/src/config.js`.

Provider notes:

- DuckDuckGo works without a search API key.
- Tavily and SerpAPI require their own search API keys.
- OpenRouter, OpenAI, and Gemini require LLM API keys.
- Ollama can run locally without a cloud API key if you have Ollama installed and a model pulled.

## Deployment

Deployment guide coming soon. For production, tighten CORS origins, store secrets in your hosting provider's environment system, and add rate limiting/logging around API routes.

## API

### `GET /health`

Returns a simple backend health response.

### `POST /models`

Lists models for a provider.

```json
{
  "provider": "openrouter",
  "api_key": "optional-api-key"
}
```

### `POST /run`

Runs the research agent and returns the final answer.

```json
{
  "query": "What is agentic AI?",
  "llm_provider": "openrouter",
  "llm_model": "openai/gpt-4o-mini",
  "search_provider": "duckduckgo"
}
```

### `POST /run/stream`

Runs the same workflow as `POST /run`, but streams progress and answer chunks as Server-Sent Events.

## Development

Build the frontend:

```bash
npm --prefix frontend run build
```

Preview the production frontend build:

```bash
npm --prefix frontend run preview
```

Serve the static docs locally with any simple static server, for example:

```bash
python -m http.server 8080 -d docs
```

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
