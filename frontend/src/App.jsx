import { useRef, useState, useCallback } from "react";
import { Navbar } from "./components/Navbar";
import { InputPanel } from "./components/InputPanel";
import { OutputPanel } from "./components/OutputPanel";
import { listModels, runAgentStream } from "./api/agent";
import { config } from "./config";

export default function App() {
  const [query, setQuery] = useState("");
  const [llmProvider, setLlmProvider] = useState("openrouter");
  const [llmModel, setLlmModel] = useState("");
  const [llmApiKey, setLlmApiKey] = useState("");
  const [searchProvider, setSearchProvider] = useState("duckduckgo");
  const [searchApiKey, setSearchApiKey] = useState("");
  const [models, setModels] = useState([]);
  const [modelFilter, setModelFilter] = useState("");
  const [modelStatus, setModelStatus] = useState("idle"); // idle | loading | error
  const [modelError, setModelError] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [output, setOutput] = useState(null);
  const [trace, setTrace] = useState([]);
  const [turns, setTurns] = useState([]);
  const [error, setError] = useState(null);
  const activeRunRef = useRef(null);

  const updateTurn = useCallback((turnId, updater) => {
    setTurns((currentTurns) =>
      currentTurns.map((turn) =>
        turn.id === turnId ? updater(turn) : turn
      )
    );
  }, []);

  const handleSubmit = useCallback(async () => {
    if (status === "loading" || !query.trim()) return;
    if (!llmModel) {
      setError("Open Settings, load models, and select a model before searching.");
      setStatus("error");
      setSettingsOpen(true);
      return;
    }
    setStatus("loading");
    setError(null);
    setTrace([]);
    const startedAt = Date.now();
    const turnId = `${startedAt}-${Math.random().toString(36).slice(2)}`;
    const submittedQuery = query.trim();
    const controller = new AbortController();
    activeRunRef.current = { controller, turnId, query: submittedQuery };
    const initialOutput = { answer: "", citations: [], sources: [], startedAt };
    setOutput(initialOutput);
    setTurns((currentTurns) => [
      ...currentTurns,
      {
        id: turnId,
        query: query.trim(),
        status: "loading",
        output: initialOutput,
        trace: [],
        error: null,
      },
    ]);
    try {
      await runAgentStream(
        submittedQuery,
        {
          llmProvider,
          llmModel,
          llmApiKey,
          searchProvider,
          searchApiKey,
          signal: controller.signal,
        },
        {
          onTrace: (event) => {
            setTrace((current) => [...current, event]);
            updateTurn(turnId, (turn) => ({
              ...turn,
              trace: [...turn.trace, event],
            }));
          },
          onAnswerDelta: (text) => {
            const appendAnswer = (current) => ({
              ...(current ?? { citations: [] }),
              answer: `${current?.answer ?? ""}${text}`,
            });
            setOutput(appendAnswer);
            updateTurn(turnId, (turn) => ({
              ...turn,
              output: appendAnswer(turn.output),
            }));
          },
          onSources: (sources) => {
            const mergeSources = (current) => ({
              ...(current ?? { answer: "", citations: [] }),
              sources,
            });
            setOutput(mergeSources);
            updateTurn(turnId, (turn) => ({
              ...turn,
              output: mergeSources(turn.output),
            }));
          },
          onFinal: (data) => {
            const finalOutput = (current) => ({
              ...data,
              sources: current?.sources ?? [],
              durationMs: Date.now() - startedAt,
            });
            setOutput(finalOutput);
            updateTurn(turnId, (turn) => ({
              ...turn,
              status: "success",
              output: finalOutput(turn.output),
            }));
          },
        }
      );
      setStatus("success");
      setQuery("");
    } catch (err) {
      if (err.name === "AbortError") {
        setTurns((currentTurns) => currentTurns.filter((turn) => turn.id !== turnId));
        setOutput(null);
        setTrace([]);
        setError(null);
        setQuery(submittedQuery);
        setStatus("idle");
        activeRunRef.current = null;
        return;
      }
      setError(err.message);
      setStatus("error");
      updateTurn(turnId, (turn) => ({
        ...turn,
        status: "error",
        error: err.message,
      }));
    } finally {
      if (activeRunRef.current?.turnId === turnId) {
        activeRunRef.current = null;
      }
    }
  }, [llmApiKey, llmModel, llmProvider, query, searchApiKey, searchProvider, status, updateTurn]);

  const handleLoadModels = useCallback(async () => {
    setModelStatus("loading");
    setModelError("");
    try {
      const nextModels = await listModels(llmProvider, llmApiKey);
      setModels(nextModels);
      setLlmModel((currentModel) =>
        nextModels.some((model) => model.id === currentModel) ? currentModel : ""
      );
      setModelStatus("idle");
    } catch (err) {
      setModelError(err.message);
      setModelStatus("error");
    }
  }, [llmApiKey, llmModel, llmProvider]);

  const handleRetry = useCallback(() => {
    setStatus("idle");
    setError(null);
    setTrace([]);
  }, []);

  const handleClearChat = useCallback(() => {
    setTurns([]);
    setOutput(null);
    setTrace([]);
    setError(null);
    setStatus("idle");
  }, []);

  const handleStop = useCallback(() => {
    activeRunRef.current?.controller.abort();
  }, []);

  const handleEditTurn = useCallback((text) => {
    if (status === "loading") return;
    setQuery(text);
  }, [status]);

  const handleKeyDown = useCallback(
    (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const filteredModels = models.filter((model) => {
    const needle = modelFilter.trim().toLowerCase();
    if (!needle) return true;
    return (
      model.id.toLowerCase().includes(needle) ||
      model.name.toLowerCase().includes(needle) ||
      model.description.toLowerCase().includes(needle)
    );
  });
  const selectedModelVisible = filteredModels.some((model) => model.id === llmModel);

  return (
    <div className="flex flex-col h-full bg-[#0f0f0f]" onKeyDown={handleKeyDown}>
      <Navbar />

      <div className="flex flex-col md:flex-row flex-1 min-h-0 pt-14">
        <InputPanel>
          {/* Search input — press Enter or Ctrl+Enter to submit */}
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setSettingsOpen((open) => !open)}
              className="h-10 rounded-lg border border-[#2a2a2a] bg-[#111] px-3 text-left text-sm font-medium text-gray-200 hover:border-[#3a3a3a] focus:outline-none focus:border-[var(--accent)]"
            >
              Settings
              <span className="ml-2 text-xs font-normal text-gray-500">
                {llmProvider}
                {llmModel ? ` / ${llmModel}` : " / no model selected"}
              </span>
            </button>

            {settingsOpen && (
              <div className="flex flex-col gap-3 rounded-lg border border-[#202020] bg-[#111]/60 p-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-3">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-gray-500">LLM</span>
                    <select
                      value={llmProvider}
                      onChange={(e) => {
                        setLlmProvider(e.target.value);
                        setLlmModel("");
                        setModels([]);
                        setModelFilter("");
                        setModelError("");
                      }}
                      disabled={status === "loading"}
                      className="h-10 w-full rounded-lg bg-[#0f0f0f] border border-[#2a2a2a] text-sm text-gray-200 px-3 focus:outline-none focus:border-[var(--accent)] transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {config.llmProviders.map((provider) => (
                        <option key={provider.value} value={provider.value}>
                          {provider.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-gray-500">Search</span>
                    <select
                      value={searchProvider}
                      onChange={(e) => setSearchProvider(e.target.value)}
                      disabled={status === "loading"}
                      className="h-10 w-full rounded-lg bg-[#0f0f0f] border border-[#2a2a2a] text-sm text-gray-200 px-3 focus:outline-none focus:border-[var(--accent)] transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {config.searchProviders.map((provider) => (
                        <option key={provider.value} value={provider.value}>
                          {provider.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-gray-500">LLM API key</span>
                  <input
                    type="password"
                    value={llmApiKey}
                    onChange={(e) => setLlmApiKey(e.target.value)}
                    placeholder="Use backend .env key if blank"
                    disabled={status === "loading"}
                    className="h-10 w-full rounded-lg bg-[#0f0f0f] border border-[#2a2a2a] text-sm text-gray-200 placeholder-gray-600 px-3 focus:outline-none focus:border-[var(--accent)] transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </label>

                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <input
                    type="text"
                    value={modelFilter}
                    onChange={(e) => setModelFilter(e.target.value)}
                    placeholder="Search loaded models..."
                    disabled={status === "loading"}
                    className="h-10 min-w-0 rounded-lg bg-[#0f0f0f] border border-[#2a2a2a] text-sm text-gray-200 placeholder-gray-600 px-3 focus:outline-none focus:border-[var(--accent)] transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={handleLoadModels}
                    disabled={status === "loading" || modelStatus === "loading"}
                    className="h-10 rounded-lg bg-[#2a2a2a] px-3 text-sm font-medium text-gray-200 hover:bg-[#333] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {modelStatus === "loading" ? "Loading" : "Load"}
                  </button>
                </div>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-gray-500">Model</span>
                  <select
                    value={selectedModelVisible ? llmModel : ""}
                    onChange={(e) => setLlmModel(e.target.value)}
                    disabled={status === "loading" || models.length === 0 || filteredModels.length === 0}
                    className="h-10 w-full rounded-lg bg-[#0f0f0f] border border-[#2a2a2a] text-sm text-gray-200 px-3 focus:outline-none focus:border-[var(--accent)] transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="" disabled>
                      {models.length === 0
                        ? "Load models first"
                        : filteredModels.length === 0
                          ? "No matching models"
                          : "Select a model"}
                    </option>
                    {filteredModels.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name || model.id}
                      </option>
                    ))}
                  </select>
                </label>

                {searchProvider !== "duckduckgo" && (
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-gray-500">Search API key</span>
                    <input
                      type="password"
                      value={searchApiKey}
                      onChange={(e) => setSearchApiKey(e.target.value)}
                      placeholder="Use backend .env key if blank"
                      disabled={status === "loading"}
                      className="h-10 w-full rounded-lg bg-[#0f0f0f] border border-[#2a2a2a] text-sm text-gray-200 placeholder-gray-600 px-3 focus:outline-none focus:border-[var(--accent)] transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </label>
                )}

                {modelStatus === "error" && (
                  <p className="text-xs text-red-400">{modelError}</p>
                )}

                <button
                  type="button"
                  onClick={handleClearChat}
                  disabled={status === "loading"}
                  className="h-10 rounded-lg border border-red-900/60 bg-red-950/30 px-3 text-sm font-medium text-red-300 hover:bg-red-950/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Clear chat
                </button>
              </div>
            )}

            <div className="rounded-lg border border-[#2a2a2a] bg-[#111] p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Memory
                  </h2>
                  <p className="mt-1 text-xs text-gray-600 leading-relaxed">
                    Future graph memory and conversation context will appear here.
                  </p>
                </div>
                <span className="rounded-md border border-[#2a2a2a] px-2 py-1 text-[11px] text-gray-500">
                  Soon
                </span>
              </div>
            </div>
          </div>
        </InputPanel>

        <OutputPanel
          status={status}
          output={output}
          trace={trace}
          turns={turns}
          query={query}
          onQueryChange={setQuery}
          onSubmit={handleSubmit}
          onStop={handleStop}
          onEditTurn={handleEditTurn}
          loading={status === "loading"}
          error={error}
          onRetry={handleRetry}
        />
      </div>
    </div>
  );
}
