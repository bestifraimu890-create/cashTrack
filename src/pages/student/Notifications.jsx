import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Bell, AlertTriangle, CheckCircle2, Send, PlusCircle, Wallet,
  ArrowDownLeft, ArrowUpRight, Link2, Clock,
} from "lucide-react";
import { supabase } from "../../supabase/client.js";
import { naira } from "../../lib/constants.js";
import { Card, EmptyState } from "../../components/common/index.js";

const ACTIVITY_ICONS = {
  transaction: { icon: PlusCircle, color: "text-blue-500", bg: "bg-blue-50" },
  withdrawal: { icon: Send, color: "text-brand-700", bg: "bg-brand-50" },
  withdrawal_completed: { icon: CheckCircle2, color: "text-mint-600", bg: "bg-mint-50" },
  withdrawal_failed: { icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50" },
  funding: { icon: ArrowDownLeft, color: "text-mint-600", bg: "bg-mint-50" },
  fund_pending: { icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
  fund_approved: { icon: CheckCircle2, color: "text-mint-600", bg: "bg-mint-50" },
  fund_declined: { icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50" },
  linked: { icon: Link2, color: "text-blue-500", bg: "bg-blue-50" },
};

function activityIcon(type) {
  const cfg = ACTIVITY_ICONS[type] ?? ACTIVITY_ICONS.transaction;
  const Icon = cfg.icon;
  return (
    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${cfg.bg}`}>
      <Icon size={16} className={cfg.color} />
    </div>
  );
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

export default function Notifications() {
  const { wallet, parentLinked, user } = useOutletContext();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadActivities = async () => {
    if (!wallet?.id) { setLoading(false); return; }

    const items = [];

    const { data: tx } = await supabase
      .from("transactions")
      .select("id, merchant, category, amount, fee, created_at")
      .eq("wallet_id", wallet.id)
      .order("created_at", { ascending: false })
      .limit(20);
    (tx ?? []).forEach((t) => {
      items.push({
        id: `tx-${t.id}`,
        type: "transaction",
        title: t.amount > 0 ? `Money received: ${naira(t.amount)}` : `Spent ${naira(Math.abs(t.amount))} at ${t.merchant}`,
        body: `${t.category}${t.fee ? ` · Fee: ${naira(t.fee)}` : ""}`,
        time: t.created_at,
      });
    });

    const { data: px } = await supabase
      .from("payouts")
      .select("id, amount, bank_name, account_number, status, created_at")
      .eq("wallet_id", wallet.id)
      .order("created_at", { ascending: false })
      .limit(20);
    (px ?? []).forEach((p) => {
      const type = p.status === "completed" ? "withdrawal_completed"
        : p.status === "failed" || p.status === "rejected" ? "withdrawal_failed"
        : "withdrawal";
      const label = p.status === "completed" ? "Withdrawal completed"
        : p.status === "failed" || p.status === "rejected" ? `Withdrawal ${p.status}`
        : "Withdrawal requested";
      items.push({
        id: `px-${p.id}`,
        type,
        title: `${label}: ${naira(p.amount)}`,
        body: `${p.bank_name || "Bank"} · ${p.account_number}`,
        time: p.created_at,
      });
    });

    const { data: links } = await supabase
      .from("households")
      .select("id, created_at")
      .eq("child_id", user.id)
      .maybeSingle();
    if (links) {
      items.push({
        id: "linked",
        type: "linked",
        title: "Parent account linked",
        body: "You're now connected to your parent's wallet.",
        time: links.created_at,
      });
    }

    const { data: fr } = await supabase
      .from("fund_requests")
      .select("id, amount, note, status, created_at")
      .eq("student_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    (fr ?? []).forEach((r) => {
      const type = r.status === "approved" ? "fund_approved"
        : r.status === "declined" ? "fund_declined"
        : "fund_pending";
      const label = r.status === "approved" ? "Fund request approved"
        : r.status === "declined" ? "Fund request declined"
        : "Fund request sent — waiting for approval";
      items.push({
        id: `fr-${r.id}`,
        type,
        title: `${label}: ${naira(r.amount)}`,
        body: r.note || "No note",
        time: r.created_at,
      });
    });

    items.sort((a, b) => new Date(b.time) - new Date(a.time));
    setActivities(items);
    setLoading(false);
  };

  useEffect(() => {
    loadActivities();
  }, [wallet?.id]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Activity Feed</h2>
          <p className="text-sm text-slate-500">Transactions, withdrawals, fund requests and account events.</p>
        </div>
      </div>

      <Card>
        {loading ? (
          <div className="p-10 text-center text-sm text-slate-400">Loading activity...</div>
        ) : activities.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={Bell}
              title="You're all caught up"
              body="Transactions, fund requests and account updates will show up here."
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activities.map((n) => (
              <div key={n.id} className="flex gap-3 px-5 py-4">
                {activityIcon(n.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                  <p className="mt-0.5 text-sm text-slate-500">{n.body}</p>
                </div>
                <span className="whitespace-nowrap text-xs text-slate-400">{timeAgo(n.time)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
