import React, { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutGrid, Users, Send, History, SlidersHorizontal, Receipt,
  LineChart as LineChartIcon, Bell, ShieldAlert, User,
} from "lucide-react";
import { supabase } from "../../supabase/client.js";
import { naira, initialsOf } from "../../lib/constants.js";
import { DashboardSidebar, DashboardTopbar } from "../../components/layout/DashboardShell.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

const NAV = [
  { to: "/parent", label: "Dashboard", icon: LayoutGrid, end: true },
  { to: "/parent/children", label: "Children", icon: Users },
  { to: "/parent/fund", label: "Fund Wallet", icon: Send },
  { to: "/parent/allowance", label: "Allowance History", icon: History },
  { to: "/parent/limits", label: "Spending Limits", icon: SlidersHorizontal },
  { to: "/parent/transactions", label: "Transactions", icon: Receipt },
  { to: "/parent/insights", label: "Insights", icon: LineChartIcon },
  { to: "/parent/alerts", label: "Alerts", icon: Bell },
  { to: "/parent/controls", label: "Parental Controls", icon: ShieldAlert },
  { to: "/parent/profile", label: "Profile", icon: User },
];

export default function ParentLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [childrenList, setChildrenList] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [allowanceHistory, setAllowanceHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [parentBalance, setParentBalance] = useState(0);

  // Load real children from the DB on mount
  useEffect(() => {
    if (!user) return;
    loadChildren();
  }, [user?.id]);

  const loadChildren = async () => {
    const { data: pw } = await supabase
      .from("wallets")
      .select("id, balance")
      .eq("owner_id", user.id)
      .maybeSingle();
    if (pw) {
      setParentBalance(Number(pw.balance ?? 0));
    }

    const { data: links } = await supabase
      .from("households")
      .select("child_id")
      .eq("parent_id", user.id);
    if (!links?.length) {
      setChildrenList([]);
      setAllTransactions([]);
      setAllowanceHistory([]);
      setAlerts([]);
      return;
    }
    const ids = links.map((l) => l.child_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, school")
      .in("id", ids);

    const childList = (profiles ?? []).map((p) => ({
      id: p.id,
      name: `${p.first_name} ${p.last_name}`,
      school: p.school,
    }));
    setChildrenList(childList);

    // All transactions live on the parent's wallet (students use parent's wallet directly)
    if (!pw?.id) return;

    const { data: tx } = await supabase
      .from("transactions")
      .select("*")
      .eq("wallet_id", pw.id)
      .order("created_at", { ascending: false });
    setAllTransactions(tx ?? []);

    const income = (tx ?? []).filter((t) => t.amount > 0);
    setAllowanceHistory(income);

    // All payouts from the parent's wallet
    const { data: px } = await supabase
      .from("payouts")
      .select("*")
      .eq("wallet_id", pw.id)
      .order("created_at", { ascending: false });
    setAlerts(
      (px ?? []).filter((p) => p.status === "pending_otp" || p.status === "processing").map((p) => ({
        id: p.id,
        type: "approval",
        title: `Withdrawal request: ${naira(p.amount)}`,
        body: `To ${p.bank_name || "bank"} · ${p.account_number}`,
        time: new Date(p.created_at).toLocaleDateString("en-NG"),
      }))
    );
  };

  const respondToAlert = (id, decision) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const pageTitle =
    NAV.find((n) => (n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)))?.label ?? "Dashboard";

  return (
    <div className="flex h-screen w-full bg-paper text-slate-900">
      <DashboardSidebar
        brandLabel="Parent"
        items={NAV}
        alertCount={alerts.length}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onLogout={async () => { await logout(); navigate("/", { replace: true }); }}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <DashboardTopbar
          title={pageTitle}
          placeholder="Search children, transactions..."
          onMenu={() => setMobileOpen(true)}
          user={user}
          initialsOf={initialsOf}
        />
        <main className="flex-1 px-4 py-6 lg:px-8">
          <h1 className="mb-6 hidden font-display text-2xl font-bold text-slate-900 lg:block">{pageTitle}</h1>
          <Outlet context={{ user, childrenList, allTransactions, allowanceHistory, alerts, respondToAlert, loadChildren, parentBalance }} />
        </main>
      </div>
    </div>
  );
}
