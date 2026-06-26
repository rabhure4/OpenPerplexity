export function Card({ children, className = "", tinted = false }) {
  return (
    <div
      className={`
        rounded-xl border border-[#2a2a2a] p-4
        ${tinted ? "bg-red-950/30 border-red-900/50" : "bg-[#1a1a1a]"}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
