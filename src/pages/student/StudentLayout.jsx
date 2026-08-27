import React, { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutGrid, Wallet as WalletIcon, Receipt, PlusCircle, PiggyBank,
  LineChart as LineChartIcon, Bell, User, Send,
} from "lucide-react";
import { supabase } from "../../supabase/client.js";
import { naira, initialsOf, CATEGORIES } from "../../lib/constants.js";
import { DashboardSidebar, DashboardTopbar } from "../../components/layout/DashboardShell.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

const NAV = [
  { to: "/student", label: "Dashboard", icon: LayoutGrid, end: true },
  { to: "/student/wallet", label: "Wallet", icon: WalletIcon },
  { to: "/student/transactions", label: "Transactions", icon: Receipt },
  { to: "/student/add-expense", label: "Add Expense", icon: PlusCircle },
  { to: "/student/withdraw", label: "Withdraw", icon: Send },
  { to: "/student/budget", label: "Budget", icon: PiggyBank },
  { to: "/student/insights", label: "Insights", icon: LineChartIcon },
  { to: "/student/notifications", label: "Notifications", icon: Bell },
  { to: "/student/profile", label: "Profile", icon: User },
];

export default function StudentLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [budgetLimits, setBudgetLimits] = useState({});
  const [parentName, setParentName] = useState("your parent");
  const [parentLinked, setParentLinked] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [householdId, setHouseholdId] = useState(null);
  const [householdControls, setHouseholdControls] = useState({});

  const walletBalance = Number(wallet?.balance ?? 0);
  const weeklyLimit = Number(wallet?.weekly_limit ?? 5000);
  const monthlyLimit = Number(wallet?.monthly_limit ?? 18000);

  const monthlySpent = useMemo(
    () => transactions.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0),
    [transactions]
  );

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weeklySpent = useMemo(
    () =>
      transactions
        .filter((t) => t.amount < 0 && new Date(t.created_at) >= weekStart)
        .reduce((s, t) => s + Math.abs(t.amount), 0),
    [transactions, weekStart]
  );

  const spentByCategory = useMemo(() => {
    const map = {};
    transactions.forEach((t) => {
      if (t.amount < 0) map[t.category] = (map[t.category] || 0) + Math.abs(t.amount);
    });
    return map;
  }, [transactions]);

  const budgets = useMemo(
    () =>
      Object.keys(CATEGORIES)
        .filter((cat) => budgetLimits[cat] > 0 || spentByCategory[cat] > 0)
        .map((cat) => ({ category: cat, budgeted: budgetLimits[cat] || 0, spent: spentByCategory[cat] || 0 })),
    [budgetLimits, spentByCategory]
  );

  const loadAll = async () => {
    const { data: links } = await supabase
      .from("households")
      .select("id, parent_id, require_approval, approval_threshold, notify_on_every_transaction")
      .eq("child_id", user.id)
      .maybeSingle();
    if (!links?.parent_id) {
      setParentLinked(false);
      return;
    }
    setParentLinked(true);
    setHouseholdId(links.id);
    setHouseholdControls({
      require_approval: links.require_approval,
      approval_threshold: links.approval_threshold,
      notify_on_every_transaction: links.notify_on_every_transaction,
    });

    const { data: pp } = await supabase
      .from("profiles")
      .select("first_name")
      .eq("id", links.parent_id)
      .maybeSingle();
    if (pp?.first_name) setParentName(pp.first_name);

    const { data: pw } = await supabase
      .from("wallets")
      .select("*")
      .eq("owner_id", links.parent_id)
      .maybeSingle();
    setWallet(pw);

    if (pw?.id) {
      const { data: tx } = await supabase
        .from("transactions")
        .select("*")
        .eq("wallet_id", pw.id)
        .order("created_at", { ascending: false });
      setTransactions(tx ?? []);

      const { data: px } = await supabase
        .from("payouts")
        .select("*")
        .eq("wallet_id", pw.id)
        .order("created_at", { ascending: false });
      setNotifications(
        (px ?? []).map((p) => ({
          id: p.id,
          type: p.status === "completed" ? "success" : p.status === "failed" || p.status === "rejected" ? "alert" : "info",
          title: `Withdrawal ${p.status === "completed" ? "completed" : p.status === "failed" ? "failed" : "requested"}`,
          body: `${naira(p.amount)} → ${p.bank_name || "bank"} · ${p.account_number}`,
          time: new Date(p.created_at).toLocaleDateString("en-NG"),
        }))
      );
    }
  };

  useEffect(() => {
    if (user) loadAll();
  }, [user?.id]);

  const setBudgetLimit = (category, amount) => {
    setBudgetLimits((prev) => ({ ...prev, [category]: amount }));
  };

  const addExpense = async ({ merchant, category, amount, note }) => {
    if (!wallet) return;
    const { error } = await supabase.from("transactions").insert({
      wallet_id: wallet.id,
      merchant,
      category,
      amount,
    });
    if (!error) {
      await supabase
        .from("wallets")
        .update({ balance: walletBalance + amount })
        .eq("id", wallet.id);
      loadAll();
    }
  };

  const addMany = async (rows) => {
    if (!wallet) return;
    const inserts = rows.map((r) => ({
      wallet_id: wallet.id,
      merchant: r.merchant,
      category: r.category,
      amount: r.amount,
    }));
    await supabase.from("transactions").insert(inserts);
    const totalDelta = rows.reduce((s, r) => s + r.amount, 0);
    await supabase
      .from("wallets")
      .update({ balance: walletBalance + totalDelta })
      .eq("id", wallet.id);
    loadAll();
  };

  const pageTitle =
    NAV.find((n) => (n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)))?.label ?? "Dashboard";

  const ctx = {
    user,
    wallet,
    transactions,
    budgets,
    budgetLimits,
    notifications,
    parentName,
    parentLinked,
    parentBalance: walletBalance,
    walletBalance,
    weeklySpent,
    weeklyLimit,
    monthlySpent,
    monthlyLimit,
    householdId,
    householdControls,
    studentName: user?.user_metadata?.first_name || "Student",
    setBudgetLimit,
    addExpense,
    addMany,
  };

  return (
    <div className="flex h-screen w-full bg-paper text-slate-900">
      <DashboardSidebar
        brandLabel="Student"
        items={NAV}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onLogout={async () => { await logout(); navigate("/", { replace: true }); }}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <DashboardTopbar
          title={pageTitle}
          placeholder="Search transactions, insights..."
          onMenu={() => setMobileOpen(true)}
          user={user}
          initialsOf={initialsOf}
        />
        <main className="flex-1 px-4 py-6 lg:px-8">
          <h1 className="mb-6 hidden font-display text-2xl font-bold text-slate-900 lg:block">{pageTitle}</h1>
          <Outlet context={ctx} />
        </main>
      </div>
    </div>
  );
}

