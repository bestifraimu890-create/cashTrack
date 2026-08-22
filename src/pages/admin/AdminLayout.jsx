import React, { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutGrid, Users, Wallet as WalletIcon, Receipt, Percent,
  FileBarChart2, Settings,
} from "lucide-react";
import { supabase } from "../../supabase/client.js";
import { initialsOf } from "../../lib/constants.js";
import { DashboardSidebar, DashboardTopbar } from "../../components/layout/DashboardShell.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutGrid, end: true },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/wallets", label: "Wallets", icon: WalletIcon },
  { to: "/admin/transactions", label: "Transactions", icon: Receipt },
  { to: "/admin/payouts", label: "Payouts", icon: Receipt },
  { to: "/admin/revenue", label: "Revenue", icon: Percent },
  { to: "/admin/reports", label: "Reports", icon: FileBarChart2 },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const loadAll = async () => {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, role, school, created_at");
    const enriched = (profiles ?? []).map((p) => ({
      id: p.id,
      name: `${p.first_name} ${p.last_name}`,
      email: "",
      role: p.role === "student" ? "Student" : p.role === "parent" ? "Parent" : "Admin",
      joined: new Date(p.created_at).toLocaleDateString("en-NG"),
      status: "active",
    }));
    setUsers(enriched);

    const { data: w } = await supabase.from("wallets").select("*");
    const ownerIds = [...new Set((w ?? []).map((x) => x.owner_id))];
    let profilesById = {};
    if (ownerIds.length > 0) {
      const { data: owners } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", ownerIds);
      profilesById = Object.fromEntries((owners ?? []).map((o) => [o.id, `${o.first_name} ${o.last_name}`]));
    }
    const enrichedW = (w ?? []).map((row) => ({
      id: row.id,
      ownerId: row.owner_id,
      user: profilesById[row.owner_id] || "Unknown",
      balance: Number(row.balance),
      status: row.status,
    }));
    setWallets(enrichedW);

    if (enrichedW.length > 0) {
      const { data: tx } = await supabase
        .from("transactions")
        .select("*")
        .in("wallet_id", enrichedW.map((x) => x.id))
        .order("created_at", { ascending: false });
      setTransactions(
        (tx ?? []).map((t) => {
          const wallet = enrichedW.find((x) => x.id === t.wallet_id);
          return {
            id: t.id,
            merchant: t.merchant,
            category: t.category,
            amount: Number(t.amount),
            fee: Number(t.fee),
            date: new Date(t.created_at).toLocaleDateString("en-NG"),
            user: wallet?.user ?? "Unknown",
          };
        })
      );
    }
  };

  useEffect(() => {
    if (user) loadAll();
  }, [user?.id]);

  const toggleUserStatus = async (id) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: u.status === "active" ? "suspended" : "active" } : u))
    );
  };

  const toggleWalletFreeze = async (id) => {
    const w = wallets.find((x) => x.id === id);
    if (!w) return;
    const newStatus = w.status === "frozen" ? "active" : "frozen";
    await supabase.from("wallets").update({ status: newStatus }).eq("id", id);
    setWallets((prev) => prev.map((x) => (x.id === id ? { ...x, status: newStatus } : x)));
  };

  const pageTitle =
    NAV.find((n) => (n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)))?.label ?? "Dashboard";

  return (
    <div className="flex h-screen w-full bg-paper text-slate-900">
      <DashboardSidebar
        brandLabel="Super Admin"
        items={NAV}
        supportLabel="Platform Settings"
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onLogout={async () => { await logout(); navigate("/", { replace: true }); }}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <DashboardTopbar
          title={pageTitle}
          placeholder="Search users, transactions..."
          onMenu={() => setMobileOpen(true)}
          user={user}
          initialsOf={initialsOf}
        />
        <main className="flex-1 px-4 py-6 lg:px-8">
          <h1 className="mb-6 hidden font-display text-2xl font-bold text-slate-900 lg:block">{pageTitle}</h1>
          <Outlet context={{ users, wallets, transactions, loadAll, toggleUserStatus, toggleWalletFreeze }} />
        </main>
      </div>
    </div>
  );
}
