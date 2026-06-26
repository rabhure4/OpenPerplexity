import { config } from "../../config";

export function EmptyState() {
  return (
    <div className="state-fade flex flex-col items-center justify-center h-full gap-4 text-center px-8">
      <span className="text-5xl select-none">{config.emptyStateIcon}</span>
      <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
        {config.emptyStateMessage}
      </p>
    </div>
  );
}
