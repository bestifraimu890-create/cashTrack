export function ChildAvatar({ child, name, size = 40 }) {
  const label = name ?? child?.name ?? "";
  const initials = label.split(" ").map((p) => p[0]).join("").slice(0, 2);
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  );
}

export function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`h-6 w-11 shrink-0 rounded-full p-0.5 transition-colors ${checked ? "bg-brand-700" : "bg-slate-200"}`}
    >
      <div className={`h-5 w-5 rounded-full bg-white transition-transform ${checked ? "translate-x-5" : ""}`} />
    </button>
  );
}
