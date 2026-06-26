import { config } from "../config";

export function InputPanel({ children }) {
  return (
    <aside className="w-full md:w-[380px] md:shrink-0 flex flex-col gap-6 p-5 md:p-6 border-b md:border-b-0 md:border-r border-[#2a2a2a]">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight mb-1">
          {config.projectName}
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          {config.description}
        </p>
      </div>

      {/* Input slot — children injected from App */}
      <div className="flex-1">
        {children ?? (
          <div className="rounded-lg border border-dashed border-[#2a2a2a] p-4 text-xs text-gray-600 text-center">
            Input fields go here
          </div>
        )}
      </div>

    </aside>
  );
}
