export function EmptyState({ icon: Icon, title, body, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 px-6 py-10 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <Icon size={20} />
      </div>
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <p className="max-w-xs text-sm text-slate-500">{body}</p>
      {actionLabel && (
        <button
          onClick={onAction}
          className="mt-2 rounded-lg bg-brand-700 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-800"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
