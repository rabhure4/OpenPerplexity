import { useState } from "react";
import { Button } from "./Button";

const IconCopy = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const IconCheck = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export function CopyButton({ getText }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const text = typeof getText === "function" ? getText() : getText;
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button
      variant="ghost"
      onClick={handleCopy}
      className="h-8 px-2.5 text-xs gap-1.5"
      title="Copy output"
    >
      {copied ? <IconCheck /> : <IconCopy />}
      <span>{copied ? "Copied!" : "Copy"}</span>
    </Button>
  );
}
