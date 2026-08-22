import { AlertTriangle } from "lucide-react";

export function ErrorBanner({ error }) {
  if (!error) return null;
  return (
    <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
      <AlertTriangle size={15} /> {error}
    </div>
  );
}
