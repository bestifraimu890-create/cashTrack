export function ProgressBar({ value, max, danger }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${danger ? "bg-red-500" : "bg-mint-600"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
