export function Button({ children, onClick, disabled, variant = "primary", className = "", ...props }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium text-sm transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f0f]";

  const variants = {
    primary:
      "bg-[var(--accent)] text-white hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-[var(--accent)]",
    ghost:
      "bg-transparent text-gray-400 hover:text-white hover:bg-[#2a2a2a] active:scale-[0.98] focus-visible:ring-gray-500",
    danger:
      "bg-red-900/40 text-red-400 border border-red-800 hover:bg-red-900/60 active:scale-[0.98] focus-visible:ring-red-500",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
