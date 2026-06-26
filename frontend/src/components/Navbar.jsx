import { config } from "../config";

const IconGithub = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
  </svg>
);

const IconBolt = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-[var(--accent)]">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);

export function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center px-4 md:px-6 bg-[#0f0f0f] border-b border-[#2a2a2a]">
      {/* Left — logo + project name */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-7 h-7 rounded-lg bg-[var(--accent)] flex items-center justify-center shrink-0">
          <IconBolt />
        </div>
        <span className="font-semibold text-white text-sm tracking-tight truncate">
          {config.projectName}
        </span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right — LLM badge + GitHub */}
      <div className="flex items-center gap-3">
        <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-gray-400 bg-[#1a1a1a] border border-[#2a2a2a] rounded-full px-3 py-1 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
          {config.llmBadge}
        </span>

        <a
          href={config.githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-white transition-colors duration-150"
          aria-label="GitHub"
        >
          <IconGithub />
        </a>
      </div>
    </header>
  );
}
