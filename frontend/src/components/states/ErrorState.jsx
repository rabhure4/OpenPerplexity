import { Card } from "../shared/Card";
import { Button } from "../shared/Button";

const IconAlertCircle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400 shrink-0 mt-0.5">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

export function ErrorState({ message, onRetry }) {
  return (
    <div className="state-fade p-6">
      <Card tinted>
        <div className="flex gap-3 items-start mb-4">
          <IconAlertCircle />
          <div>
            <p className="text-red-300 font-medium text-sm mb-1">Something went wrong</p>
            <p className="text-red-400/80 text-sm leading-relaxed">{message}</p>
          </div>
        </div>
        <Button variant="danger" onClick={onRetry} className="px-4 py-2">
          Try again
        </Button>
      </Card>
    </div>
  );
}
