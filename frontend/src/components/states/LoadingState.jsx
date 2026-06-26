import PropTypes from "prop-types";
import { AnswerCard } from "../output/AnswerCard";
import { CitationCard } from "../output/CitationCard";

export function LoadingState({ trace, answer, sources }) {
  const latestIndex = Math.max(0, trace.length - 1);

  return (
    <div className="state-fade flex flex-col gap-5 p-5 md:p-6" aria-busy="true" aria-label="Loading results">
      <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-4">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Activity
          </h2>
          <span className="h-2 w-2 rounded-full bg-[var(--accent)] animate-pulse" />
        </div>

        {trace.length > 0 ? (
          <ol className="flex flex-col gap-3">
            {trace.map((item, index) => (
              <li key={`${item.step ?? "step"}-${index}`} className="flex gap-3">
                <span
                  className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                    index === latestIndex ? "bg-[var(--accent)]" : "bg-green-500"
                  }`}
                />
                <div className="min-w-0">
                  <p className="text-sm text-gray-200 leading-snug">
                    {item.message}
                  </p>
                  {item.search_queries?.length > 0 && (
                    <p className="mt-1 truncate text-xs text-gray-500">
                      {item.search_queries.join(" | ")}
                    </p>
                  )}
                  {item.search_errors?.length > 0 && (
                    <div className="mt-2 flex flex-col gap-1">
                      {item.search_errors.map((error, errorIndex) => (
                        <p key={`${error.query}-${errorIndex}`} className="text-xs text-red-400">
                          {error.query}: {error.message}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="skeleton h-4 w-2/5" />
            <div className="skeleton h-3 w-full" />
            <div className="skeleton h-3 w-4/6" />
          </div>
        )}
      </div>

      {answer && (
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Draft Answer
          </h2>
          <AnswerCard answer={answer} />
        </div>
      )}

      {sources.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Live Sources
          </h2>
          <div className="flex flex-col gap-2">
            {sources.slice(0, 5).map((source, index) => (
              <CitationCard key={`${source.url}-${index}`} citation={source} index={index + 1} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

LoadingState.propTypes = {
  trace: PropTypes.arrayOf(
    PropTypes.shape({
      step: PropTypes.string,
      message: PropTypes.string,
      search_queries: PropTypes.arrayOf(PropTypes.string),
      search_errors: PropTypes.arrayOf(
        PropTypes.shape({
          query: PropTypes.string,
          message: PropTypes.string,
        })
      ),
    })
  ),
  answer: PropTypes.string,
  sources: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string,
      url: PropTypes.string,
      snippet: PropTypes.string,
    })
  ),
};

LoadingState.defaultProps = {
  trace: [],
  answer: "",
  sources: [],
};
