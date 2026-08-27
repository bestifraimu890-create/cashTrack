import React from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Bell, AlertTriangle, Send } from "lucide-react";
import { naira } from "../../lib/constants.js";
import { Card, ProgressBar, EmptyState, ChildAvatar } from "../../components/common/index.js";

export default function ParentDashboard() {
  const navigate = useNavigate();
  const { user, childrenList, alerts, parentBalance } = useOutletContext();

  const totalBalance = parentBalance + childrenList.reduce((s, c) => s + c.balance, 0);
  const totalWeeklySpent = childrenList.reduce((s, c) => s + (c.weeklySpent || 0), 0);
  const totalWeeklyLimit = childrenList.reduce((s, c) => s + c.weeklyLimit, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-900">Welcome back, {user?.user_metadata?.first_name || "there"}.</h2>
        <p className="mt-1 text-sm text-slate-500">
          Here's how {childrenList.length === 1 ? "your child is" : "your children are"} doing this week.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase text-slate-400">Combined Balance</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{naira(totalBalance)}</p>
          <p className="mt-1 text-xs text-slate-400">
            {naira(parentBalance)} yours + {naira(totalBalance - parentBalance)} across {childrenList.length} {childrenList.length === 1 ? "child" : "children"}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase text-slate-400">Spent This Week</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{naira(totalWeeklySpent)}</p>
          <div className="mt-2"><ProgressBar value={totalWeeklySpent} max={totalWeeklyLimit} /></div>
        </Card>
        <Card className="bg-brand-700 p-5 text-white">
          <p className="text-xs font-semibold uppercase text-brand-100">Children Connected</p>
          <p className="mt-2 text-2xl font-bold">{childrenList.length}</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Children Overview</h3>
          <button onClick={() => navigate("/parent/children")} className="text-xs font-semibold text-brand-700">
            Manage
          </button>
        </div>
        {childrenList.length === 0 ? (
          <EmptyState
            icon={Send}
            title="No children linked yet"
            body="Connect a child using their connection ID to see their wallet activity here."
            actionLabel="Connect a child"
            onAction={() => navigate("/parent/children")}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {childrenList.map((c) => {
              const over = (c.weeklySpent || 0) > c.weeklyLimit;
              return (
                <div key={c.id} className="rounded-xl border border-slate-100 p-4">
                  <div className="flex items-center gap-3">
                    <ChildAvatar child={c} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">{c.name}</p>
                      <p className="truncate text-xs text-slate-400">{c.school}</p>
                    </div>
                    <span className="text-sm font-bold text-slate-900">{naira(c.balance)}</span>
                  </div>
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-xs text-slate-500">
                      <span>Weekly limit</span>
                      <span className={over ? "font-semibold text-red-600" : ""}>
                        {naira(c.weeklySpent)} / {naira(c.weeklyLimit)}
                      </span>
                    </div>
                    <ProgressBar value={c.weeklySpent} max={c.weeklyLimit} danger={over} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Recent Alerts</h3>
          <button onClick={() => navigate("/parent/alerts")} className="text-xs font-semibold text-brand-700">
            View All
          </button>
        </div>
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="No alerts yet"
              body="Budget warnings and fund requests from your children will show up here."
            />
          ) : (
            alerts.slice(0, 3).map((a) => (
              <div key={a.id} className="flex items-start gap-3">
                {a.type === "alert" ? (
                  <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-500" />
                ) : a.type === "approval" ? (
                  <Send size={16} className="mt-0.5 shrink-0 text-amber-500" />
                ) : (
                  <Bell size={16} className="mt-0.5 shrink-0 text-blue-500" />
                )}
                <div>
                  <p className="text-sm font-medium text-slate-800">{a.title}</p>
                  <p className="text-xs text-slate-500">{a.body}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
