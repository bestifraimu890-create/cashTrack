export function StatusBadge({ status, map, labelMap }) {
  const m = {
    active: "bg-brand-50 text-brand-700",
    suspended: "bg-red-50 text-red-600",
    frozen: "bg-blue-50 text-blue-600",
    successful: "bg-brand-50 text-brand-700",
    failed: "bg-red-50 text-red-600",
    pending: "bg-amber-50 text-amber-700",
    past_due: "bg-amber-50 text-amber-700",
    ...map,
  };
  const labels = { past_due: "Past Due", ...labelMap };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${m[status] ?? "bg-slate-100 text-slate-600"}`}>
      {labels[status] ?? status}
    </span>
  );
}
