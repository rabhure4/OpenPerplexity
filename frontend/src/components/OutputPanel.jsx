import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { EmptyState } from "./states/EmptyState";
import { ErrorState } from "./states/ErrorState";
import { AnswerCard } from "./output/AnswerCard";
import { CitationCard } from "./output/CitationCard";

const IconTrace = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 6h16" />
    <path d="M4 12h10" />
    <path d="M4 18h7" />
    <circle cx="18" cy="12" r="2" />
    <circle cx="15" cy="18" r="2" />
  </svg>
);

const IconDetails = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </svg>
);

const IconSources = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const IconSearch = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconSend = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 2 11 13" />
    <path d="m22 2-7 20-4-9-9-4Z" />
  </svg>
);

const IconCopySmall = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const IconEdit = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

const IconStop = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
);

function copyText(text) {
  if (!text) return;
  navigator.clipboard.writeText(text);
}

function getTurnCopyText(turn) {
  const output = turn.output ?? {};
  const sources = output.citations?.length ? output.citations : output.sources ?? [];
  const citationLines = sources
    .map((source, index) => `[${index + 1}] ${source.title}\n    ${source.url}`)
    .join("\n");
  return `${output.answer ?? ""}\n\nSources:\n${citationLines}`.trim();
}

function ToolButton({ active, label, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`h-9 w-9 rounded-lg border flex items-center justify-center transition-colors ${
        active
          ? "border-[var(--accent)] bg-[var(--accent)] text-white"
          : "border-[#2a2a2a] bg-[#111] text-gray-400 hover:text-white hover:border-[#3a3a3a]"
      }`}
    >
      {children}
    </button>
  );
}

function TraceTimeline({ trace, running }) {
  const latestIndex = Math.max(0, trace.length - 1);
  const latestRef = useRef(null);

  useEffect(() => {
    if (!running || !latestRef.current) return;
    latestRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [running, trace.length]);

  if (!trace.length) {
    return (
      <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-4">
        <div className="flex flex-col gap-3">
          <div className="skeleton h-4 w-2/5" />
          <div className="skeleton h-3 w-full" />
          <div className="skeleton h-3 w-4/6" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-4">
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
        Trace
      </h2>
      <ol className="flex flex-col">
        {trace.map((item, index) => {
          const isCurrent = running && index === latestIndex;
          return (
            <li key={`${item.step ?? "step"}-${index}`} className="relative flex gap-3 pb-4 last:pb-0">
              {index < trace.length - 1 && (
                <span className="absolute left-[6px] top-[18px] bottom-0 w-px bg-[var(--accent)] opacity-60" />
              )}
              <span className="relative z-10 mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-[#1a1a1a]">
                {isCurrent ? (
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
                ) : (
                  <span className="block h-2.5 w-2.5 rounded-full bg-green-500" />
                )}
              </span>
              <div ref={isCurrent ? latestRef : null} className="min-w-0">
                <p className="text-sm text-gray-200 leading-snug">{item.message}</p>
                {item.search_queries?.length > 0 && (
                  <p className="mt-1 truncate text-xs text-gray-500">
                    {item.search_queries.join(" | ")}
                  </p>
                )}
                {item.search_errors?.length > 0 && (
                  <div className="mt-2 flex flex-col gap-1">
                    {item.search_errors.map((searchError, errorIndex) => (
                      <p key={`${searchError.query}-${errorIndex}`} className="text-xs text-red-400">
                        {searchError.query}: {searchError.message}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function SourcesList({ sources }) {
  if (!sources.length) {
    return <p className="text-sm text-gray-500">No sources were returned for this run.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {sources.map((citation, index) => (
        <CitationCard key={`${citation.url}-${index}`} citation={citation} index={index + 1} />
      ))}
    </div>
  );
}

function RunDetails({ turn, sources }) {
  const output = turn.output ?? {};
  return (
    <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-4">
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Run Details
      </h2>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs text-gray-500">LLM</dt>
          <dd className="text-gray-200">{output.llm_provider ?? "unknown"}</dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">Model</dt>
          <dd className="text-gray-200 break-all">{output.llm_model ?? "unknown"}</dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">Search</dt>
          <dd className="text-gray-200">{output.search_provider ?? "unknown"}</dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">Sources Found</dt>
          <dd className="text-gray-200">{output.result_count ?? sources.length}</dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">Search Rounds</dt>
          <dd className="text-gray-200">{output.search_iterations ?? "unknown"}</dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">Elapsed</dt>
          <dd className="text-gray-200">
            {output.durationMs ? `${(output.durationMs / 1000).toFixed(1)}s` : "running"}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function AssistantTurn({ turn, activePanel, setActivePanel, onEditTurn }) {
  const output = turn.output ?? {};
  const sources = output.citations?.length ? output.citations : output.sources ?? [];
  const running = turn.status === "loading";
  const currentPanel = activePanel?.turnId === turn.id ? activePanel.panel : null;

  function toggle(panel) {
    setActivePanel(currentPanel === panel ? null : { turnId: turn.id, panel });
  }

  return (
    <div className="chat-fade flex flex-col gap-4">
      <div className="self-end flex max-w-[84%] flex-col items-end gap-2">
        <div className="max-w-full break-words rounded-lg bg-[var(--accent)] px-4 py-3 text-sm text-white shadow-lg shadow-black/20">
          {turn.query}
        </div>
        <div className="flex items-center gap-1">
          <ToolButton label="Edit question" active={false} onClick={() => onEditTurn(turn.query)}>
            <IconEdit />
          </ToolButton>
          <ToolButton label="Copy question" active={false} onClick={() => copyText(turn.query)}>
            <IconCopySmall />
          </ToolButton>
        </div>
      </div>

      <div className="flex min-w-0 max-w-full flex-col gap-4 overflow-hidden rounded-lg border border-[#242424] bg-[#151515] p-4">
        {running && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="h-3 w-3 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
            Working
          </div>
        )}

        {running && <TraceTimeline trace={turn.trace} running />}

        {running && sources.length > 0 && (
          <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-4">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Live Sources
            </h2>
            <SourcesList sources={sources} />
          </div>
        )}

        {turn.status === "error" && (
          <ErrorState message={turn.error} onRetry={() => {}} />
        )}

        {output.answer && <AnswerCard answer={output.answer} citations={sources} />}

        {turn.status !== "loading" && output.answer && (
          <>
            <div className="flex items-center gap-2">
              <ToolButton label="Show trace" active={currentPanel === "trace"} onClick={() => toggle("trace")}>
                <IconTrace />
              </ToolButton>
              <ToolButton label="Show run details" active={currentPanel === "details"} onClick={() => toggle("details")}>
                <IconDetails />
              </ToolButton>
              <ToolButton label="Show sources" active={currentPanel === "sources"} onClick={() => toggle("sources")}>
                <IconSources />
              </ToolButton>
              <ToolButton label="Copy answer" active={false} onClick={() => copyText(getTurnCopyText(turn))}>
                <IconCopySmall />
              </ToolButton>
            </div>

            {currentPanel === "trace" && <TraceTimeline trace={turn.trace} running={false} />}
            {currentPanel === "details" && <RunDetails turn={turn} sources={sources} />}
            {currentPanel === "sources" && (
              <div>
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Sources
                </h2>
                <SourcesList sources={sources} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function OutputPanel({
  status,
  output,
  trace,
  turns,
  query,
  onQueryChange,
  onSubmit,
  onStop,
  onEditTurn,
  loading,
  error,
  onRetry,
}) {
  const [activePanel, setActivePanel] = useState(null);
  const visibleTurns = turns.length
    ? turns
    : output
      ? [{ id: "current", query: "", status, output, trace, error }]
      : [];

  return (
    <section className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center justify-between px-5 md:px-6 py-3 border-b border-[#2a2a2a] shrink-0">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          Chat
        </span>
      </div>

      <div className="flex-1 output-scroll min-h-0">
        {visibleTurns.length === 0 && status !== "error" && <EmptyState />}
        {visibleTurns.length === 0 && status === "error" && <ErrorState message={error} onRetry={onRetry} />}

        {visibleTurns.length > 0 && (
          <div className="flex flex-col gap-6 p-5 md:p-6">
            {visibleTurns.map((turn) => (
              <AssistantTurn
                key={turn.id}
                turn={turn}
                activePanel={activePanel}
                setActivePanel={setActivePanel}
                onEditTurn={onEditTurn}
              />
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-[#2a2a2a] bg-[#0f0f0f] p-4 md:px-6">
        <div className="mx-auto flex max-w-4xl items-center gap-2 rounded-lg border border-[#2a2a2a] bg-[#111] px-3 py-2 focus-within:border-[var(--accent)] transition-colors">
          <span className="shrink-0 text-gray-500">
            <IconSearch />
          </span>
          <input
            type="text"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                onSubmit();
              }
            }}
            placeholder="Ask anything..."
            disabled={loading}
            className="h-9 min-w-0 flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-600 focus:outline-none disabled:opacity-50"
          />
          <button
            type="button"
            onClick={loading ? onStop : onSubmit}
            disabled={!loading && !query.trim()}
            title={loading ? "Stop" : "Send"}
            aria-label={loading ? "Stop" : "Send"}
            className="h-9 w-9 rounded-lg bg-[var(--accent)] text-white flex items-center justify-center hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <IconStop />
            ) : (
              <IconSend />
            )}
          </button>
        </div>
      </div>
    </section>
  );
}

const citationShape = PropTypes.shape({
  title: PropTypes.string,
  url: PropTypes.string,
  snippet: PropTypes.string,
});

const traceShape = PropTypes.shape({
  step: PropTypes.string,
  message: PropTypes.string,
  search_queries: PropTypes.arrayOf(PropTypes.string),
  search_errors: PropTypes.arrayOf(
    PropTypes.shape({
      query: PropTypes.string,
      message: PropTypes.string,
    })
  ),
});

const outputShape = PropTypes.shape({
  answer: PropTypes.string,
  citations: PropTypes.arrayOf(citationShape),
  sources: PropTypes.arrayOf(citationShape),
  llm_provider: PropTypes.string,
  llm_model: PropTypes.string,
  search_provider: PropTypes.string,
  result_count: PropTypes.number,
  search_iterations: PropTypes.number,
  durationMs: PropTypes.number,
});

OutputPanel.propTypes = {
  status: PropTypes.oneOf(["idle", "loading", "success", "error"]).isRequired,
  output: outputShape,
  trace: PropTypes.arrayOf(traceShape),
  turns: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      query: PropTypes.string.isRequired,
      status: PropTypes.oneOf(["loading", "success", "error"]).isRequired,
      output: outputShape,
      trace: PropTypes.arrayOf(traceShape),
      error: PropTypes.string,
    })
  ),
  query: PropTypes.string.isRequired,
  onQueryChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onStop: PropTypes.func.isRequired,
  onEditTurn: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  error: PropTypes.string,
  onRetry: PropTypes.func.isRequired,
};

OutputPanel.defaultProps = {
  trace: [],
  turns: [],
};

ToolButton.propTypes = {
  active: PropTypes.bool.isRequired,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};

TraceTimeline.propTypes = {
  trace: PropTypes.arrayOf(traceShape).isRequired,
  running: PropTypes.bool.isRequired,
};

SourcesList.propTypes = {
  sources: PropTypes.arrayOf(citationShape).isRequired,
};

RunDetails.propTypes = {
  turn: PropTypes.shape({
    output: outputShape,
  }).isRequired,
  sources: PropTypes.arrayOf(citationShape).isRequired,
};

AssistantTurn.propTypes = {
  turn: PropTypes.shape({
    id: PropTypes.string.isRequired,
    query: PropTypes.string.isRequired,
    status: PropTypes.oneOf(["loading", "success", "error"]).isRequired,
    output: outputShape,
    trace: PropTypes.arrayOf(traceShape),
    error: PropTypes.string,
  }).isRequired,
  activePanel: PropTypes.shape({
    turnId: PropTypes.string,
    panel: PropTypes.string,
  }),
  setActivePanel: PropTypes.func.isRequired,
  onEditTurn: PropTypes.func.isRequired,
};
