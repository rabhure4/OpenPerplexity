const IconExternalLink = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

function extractDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function CitationCard({ citation, index }) {
  const { title, url, snippet } = citation;
  const domain = extractDomain(url);
  const tooltip = [title, url, snippet].filter(Boolean).join("\n");

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title={tooltip}
      className="group block min-w-0 max-w-full overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-4 hover:border-[#3a3a3a] hover:bg-[#1f1f1f] transition-colors duration-150"
    >
      {/* Index + title row */}
      <div className="flex items-start gap-2.5 mb-2">
        <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-[#2a2a2a] text-[10px] font-semibold text-gray-400 flex items-center justify-center">
          {index}
        </span>
        <p className="min-w-0 break-words text-sm font-medium text-white leading-snug group-hover:text-[var(--accent)] transition-colors duration-150">
          {title}
        </p>
      </div>

      {/* Snippet */}
      {snippet && (
        <p className="mb-3 ml-7 break-words text-xs text-gray-500 leading-relaxed">
          {snippet}
        </p>
      )}

      {/* Domain chip */}
      <div className="ml-7 flex items-center gap-1 text-[11px] text-gray-600">
        <IconExternalLink />
        <span className="truncate">{domain}</span>
      </div>
    </a>
  );
}
