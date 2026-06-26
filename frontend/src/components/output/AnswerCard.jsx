function normalizeAnswer(text) {
  let value = String(text ?? "").trim();

  try {
    const parsed = JSON.parse(value);
    if (typeof parsed === "string") {
      value = parsed;
    } else if (parsed && typeof parsed.answer === "string") {
      value = parsed.answer;
    }
  } catch {
    // Keep plain markdown as-is.
  }

  return value
    .replace(/\\n/g, "\n")
    .replace(/\\"/g, '"')
    .replace(/\\t/g, "  ")
    .trim();
}

function renderMarkdown(text, citations) {
  const lines = normalizeAnswer(text).split("\n");
  const elements = [];
  let key = 0;
  let inCodeBlock = false;
  let codeLines = [];

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        elements.push(
          <pre key={key++} className="my-2 max-w-full overflow-x-auto rounded-md border border-[#2a2a2a] bg-[#111] px-3 py-2 text-xs leading-relaxed text-gray-300">
            <code>{codeLines.join("\n")}</code>
          </pre>
        );
        codeLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={key++} className="text-base font-semibold text-white mt-4 mb-1">
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith("# ")) {
      elements.push(
        <h1 key={key++} className="text-lg font-bold text-white mt-4 mb-2">
          {line.slice(2)}
        </h1>
      );
    } else if (line.startsWith("### ")) {
      elements.push(
        <h3 key={key++} className="text-sm font-semibold text-gray-200 mt-3 mb-1">
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(
        <li key={key++} className="ml-4 break-words text-sm text-gray-300 leading-relaxed list-disc">
          {inlineMarkdown(line.slice(2), citations)}
        </li>
      );
    } else if (line.trim() === "") {
      elements.push(<div key={key++} className="h-2" />);
    } else {
      elements.push(
        <p key={key++} className="break-words text-sm text-gray-300 leading-relaxed">
          {inlineMarkdown(line, citations)}
        </p>
      );
    }
  }

  if (inCodeBlock && codeLines.length > 0) {
    elements.push(
      <pre key={key++} className="my-2 max-w-full overflow-x-auto rounded-md border border-[#2a2a2a] bg-[#111] px-3 py-2 text-xs leading-relaxed text-gray-300">
        <code>{codeLines.join("\n")}</code>
      </pre>
    );
  }

  return elements;
}

function inlineMarkdown(text, citations) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[\d+\])/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="font-mono text-[0.92em] text-gray-100">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (/^\[\d+\]$/.test(part)) {
      const index = Number(part.slice(1, -1)) - 1;
      const citation = citations?.[index];
      if (citation?.url) {
        const title = [citation.title, citation.url, citation.snippet]
          .filter(Boolean)
          .join("\n");
        return (
          <a
            key={i}
            href={citation.url}
            target="_blank"
            rel="noopener noreferrer"
            title={title}
            className="align-super text-[var(--accent)] text-xs font-semibold ml-0.5 hover:underline"
          >
            {part}
          </a>
        );
      }
      return (
        <sup key={i} className="text-[var(--accent)] text-xs font-medium ml-0.5">
          {part}
        </sup>
      );
    }
    return part;
  });
}

export function AnswerCard({ answer, citations = [] }) {
  return (
    <div className="min-w-0 max-w-full overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-5">
      <div className="flex min-w-0 flex-col gap-0.5">
        {renderMarkdown(answer, citations)}
      </div>
    </div>
  );
}
