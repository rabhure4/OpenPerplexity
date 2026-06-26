// ─── Project Configuration ─────────────────────────────────────────────────
// Every user-facing string and project-specific setting lives here.
// When cloning this template for a new project, only this file (and
// src/index.css --accent) needs to change — no component edits required.
// ──────────────────────────────────────────────────────────────────────────

export const config = {
  // Displayed in the navbar and browser tab
  projectName: "OpenPerplexity",

  // One-line description shown below the h1 in the left panel
  description: "Agentic web search that thinks before it answers",

  // Accent color — also set as --accent in src/index.css
  accentColor: "#2563EB",

  // Navbar right-side links / badges
  githubUrl: "https://github.com/rabhure4",
  llmBadge: "Configurable",

  // Left panel submit button
  submitLabel: "Search",

  // Text shown below the submit button while a request is in flight
  loadingText: "Searching the web...",

  // Empty output state
  emptyStateIcon: "🔍",
  emptyStateMessage: "Ask anything to get started",

  // FastAPI backend base URL — swap endpoint path in src/api/agent.js if needed
  apiBaseUrl: "http://localhost:8001",

  llmProviders: [
    { value: "openrouter", label: "OpenRouter" },
    { value: "openai", label: "OpenAI" },
    { value: "gemini", label: "Gemini" },
    { value: "ollama", label: "Ollama" },
  ],

  searchProviders: [
    { value: "duckduckgo", label: "DuckDuckGo" },
    { value: "tavily", label: "Tavily" },
    { value: "serpapi", label: "SerpAPI" },
  ],
};
