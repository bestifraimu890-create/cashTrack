import { Loader2 } from "lucide-react";

export function LoadingButton({ children, loading, className = "" }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className={`flex w-full items-center justify-center gap-2 rounded-lg bg-brand-700 py-2.5 text-sm font-semibold text-white disabled:opacity-60 ${className}`}
    >
      {loading && <Loader2 size={15} className="animate-spin" />}
      {children}
    </button>
  );
}
