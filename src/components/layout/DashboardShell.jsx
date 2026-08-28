import { NavLink, useNavigate } from "react-router-dom";
import { HelpCircle, LogOut, Menu, Bell } from "lucide-react";

export function DashboardSidebar({ brandLabel, items, alertCount = 0, supportLabel = "Support", supportIcon: SupportIcon, extraFooter, onLogout, mobileOpen, setMobileOpen }) {
  const content = (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center gap-2 px-6 py-6">
        <img src="/cashtrack-logo.png" alt="CashTrack" className="h-14 w-auto" />
        <p className="text-[11px] font-medium text-slate-400 leading-tight">{brandLabel}</p>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} className={isActive ? "text-brand-700" : "text-slate-400"} />
                {label}
                {label === "Alerts" && alertCount > 0 && (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-semibold text-white">
                    {alertCount}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-1 border-t border-slate-100 px-3 py-3">
        {extraFooter}
        <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50">
          {SupportIcon ? <SupportIcon size={18} className="text-slate-400" /> : <HelpCircle size={18} className="text-slate-400" />}
          {supportLabel}
        </button>
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50"
        >
          <LogOut size={18} className="text-slate-400" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 overflow-y-auto border-r border-slate-200 lg:block">
        {content}
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 shadow-xl">{content}</div>
        </div>
      )}
    </>
  );
}

export function DashboardTopbar({ title, placeholder, onMenu, user, initialsOf, alertCount = 0, alertsPath = "/parent/alerts" }) {
  const navigate = useNavigate();
  return (
    <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-paper/80 px-4 py-4 backdrop-blur lg:px-8">
      <button onClick={onMenu} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden">
        <Menu size={20} />
      </button>
      <h1 className="text-lg font-bold font-display text-slate-900 lg:hidden">{title}</h1>
      <div className="ml-auto" />
      <button
        onClick={() => navigate(alertsPath)}
        className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100"
      >
        <Bell size={19} />
        {alertCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {alertCount}
          </span>
        )}
      </button>
      <div
        className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-700 text-sm font-semibold text-white"
        title={(user?.user_metadata?.first_name || "") + " " + (user?.user_metadata?.last_name || "")}
      >
        {initialsOf(user)}
      </div>
    </div>
  );
}

export function SearchIcon({ size = 16, className = "text-slate-400" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
