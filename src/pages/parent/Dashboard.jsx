import React from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Bell, AlertTriangle, Send, Receipt } from "lucide-react";
import { naira } from "../../lib/constants.js";
import { Card, EmptyState, ChildAvatar } from "../../components/common/index.js";

export default function ParentDashboard() {
  const navigate = useNavigate();
  const { user, childrenList, alerts, parentBalance, allTransactions } = useOutletContext();

  const recentTx = allTransactions.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-900">Welcome back, {user?.user_metadata?.first_name || "there"}.</h2>
        <p className="mt-1 text-sm text-slate-500">
          Here's how things are going with {childrenList.length === 1 ? "your child" : "your children"}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase text-slate-400">Wallet Balance</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{naira(parentBalance)}</p>
          <p className="mt-1 text-xs text-slate-400">Shared with {childrenList.length} linked {childrenList.length === 1 ? "child" : "children"}</p>
        </Card>
        <Card className="bg-brand-700 p-5 text-white">
          <p className="text-xs font-semibold uppercase text-brand-100">Children Connected</p>
          <p className="mt-2 text-2xl font-bold">{childrenList.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase text-slate-400">Pending Alerts</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{alerts.length}</p>
          <p className="mt-1 text-xs text-slate-400">Withdrawal requests</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Linked Children</h3>
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
            {childrenList.map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-4">
                <ChildAvatar child={c} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">{c.name}</p>
                  <p className="truncate text-xs text-slate-400">{c.school}</p>
                </div>
                <span className="flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                  Linked
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Recent Transactions</h3>
            <button onClick={() => navigate("/parent/transactions")} className="text-xs font-semibold text-brand-700">
              View All
            </button>
          </div>
          {recentTx.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No transactions yet"
              body="Spending from you or your linked children will show up here."
            />
          ) : (
            <div className="space-y-3">
              {recentTx.map((t) => (
                <div key={t.id} className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{t.merchant}</p>
                    <p className="text-xs text-slate-400">{t.category} · {new Date(t.created_at).toLocaleDateString("en-NG")}</p>
                  </div>
                  <span className={`text-sm font-semibold tabular-nums ${t.amount > 0 ? "text-mint-600" : "text-slate-800"}`}>
                    {t.amount > 0 ? "+" : "-"}{naira(t.amount)}
                  </span>
                </div>
              ))}
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
                body="Withdrawal requests and account updates will show up here."
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
    </div>
  );
}
