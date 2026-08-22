export function Card({ className = "", children }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-card ${className}`}>
      {children}
    </div>
  );
}
