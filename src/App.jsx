import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./supabase/client.js";
import { useAuth } from "./context/AuthContext.jsx";
import { ProtectedRoute, RoleProtectedRoute, GuestRoute } from "./components/routes/ProtectedRoute.jsx";

import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import AuthCallback from "./pages/AuthCallback.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";

import StudentLayout from "./pages/student/StudentLayout.jsx";
import StudentDashboard from "./pages/student/Dashboard.jsx";
import StudentWallet from "./pages/student/Wallet.jsx";
import StudentTransactions from "./pages/student/Transactions.jsx";
import StudentAddExpense from "./pages/student/AddExpense.jsx";
import StudentWithdraw from "./pages/student/Withdraw.jsx";
import StudentBudget from "./pages/student/Budget.jsx";
import StudentInsights from "./pages/student/Insights.jsx";
import StudentNotifications from "./pages/student/Notifications.jsx";
import StudentProfile from "./pages/student/Profile.jsx";

import ParentLayout from "./pages/parent/ParentLayout.jsx";
import ParentDashboard from "./pages/parent/Dashboard.jsx";
import ParentChildren from "./pages/parent/Children.jsx";
import ParentFundWallet from "./pages/parent/FundWallet.jsx";
import ParentAllowanceHistory from "./pages/parent/AllowanceHistory.jsx";
import ParentSpendingLimits from "./pages/parent/SpendingLimits.jsx";
import ParentTransactions from "./pages/parent/Transactions.jsx";
import ParentInsights from "./pages/parent/Insights.jsx";
import ParentAlerts from "./pages/parent/Alerts.jsx";
import ParentalControls from "./pages/parent/ParentalControls.jsx";
import ParentProfile from "./pages/parent/Profile.jsx";

import AdminLayout from "./pages/admin/AdminLayout.jsx";
import AdminDashboard from "./pages/admin/Dashboard.jsx";
import AdminUsers from "./pages/admin/Users.jsx";
import AdminWallets from "./pages/admin/Wallets.jsx";
import AdminTransactions from "./pages/admin/Transactions.jsx";
import AdminPayouts from "./pages/admin/Payouts.jsx";
import AdminRevenue from "./pages/admin/Revenue.jsx";
import AdminReports from "./pages/admin/Reports.jsx";

function RoleRouter() {
  const { user, role, loading, setRole } = useAuth();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!user) return;
      // Fallback: read the role straight from profiles in case the
      // context hasn't caught up yet
      if (!role) {
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
        if (!active) return;
        if (data?.role) setRole(data.role);
      }
      if (active) setChecked(true);
    })();
    return () => { active = false; };
  }, [user?.id]);

  if (!user) return <Navigate to="/login" replace />;
  // Wait briefly for the profile role so parents/admins land on the right dashboard
  if (loading || (!role && !checked)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-paper">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-700" />
      </div>
    );
  }
  const base = role === "parent" ? "/parent" : role === "admin" ? "/admin" : "/student";
  return <Navigate to={base} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/signup" element={<GuestRoute><Signup /></GuestRoute>} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Role-aware entry: /app sends the user to their role's dashboard */}
      <Route path="/app" element={<RoleRouter />} />

      {/* Student area */}
      <Route
        path="/student"
        element={
          <RoleProtectedRoute allowedRole="student">
            <StudentLayout />
          </RoleProtectedRoute>
        }
      >
        <Route index element={<StudentDashboard />} />
        <Route path="wallet" element={<StudentWallet />} />
        <Route path="transactions" element={<StudentTransactions />} />
        <Route path="add-expense" element={<StudentAddExpense />} />
        <Route path="withdraw" element={<StudentWithdraw />} />
        <Route path="budget" element={<StudentBudget />} />
        <Route path="insights" element={<StudentInsights />} />
        <Route path="notifications" element={<StudentNotifications />} />
        <Route path="profile" element={<StudentProfile />} />
      </Route>

      {/* Parent area */}
      <Route
        path="/parent"
        element={
          <RoleProtectedRoute allowedRole="parent">
            <ParentLayout />
          </RoleProtectedRoute>
        }
      >
        <Route index element={<ParentDashboard />} />
        <Route path="children" element={<ParentChildren />} />
        <Route path="fund" element={<ParentFundWallet />} />
        <Route path="allowance" element={<ParentAllowanceHistory />} />
        <Route path="limits" element={<ParentSpendingLimits />} />
        <Route path="transactions" element={<ParentTransactions />} />
        <Route path="insights" element={<ParentInsights />} />
        <Route path="alerts" element={<ParentAlerts />} />
        <Route path="controls" element={<ParentalControls />} />
        <Route path="profile" element={<ParentProfile />} />
      </Route>

      {/* Admin area */}
      <Route
        path="/admin"
        element={
          <RoleProtectedRoute allowedRole="admin">
            <AdminLayout />
          </RoleProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="wallets" element={<AdminWallets />} />
        <Route path="transactions" element={<AdminTransactions />} />
        <Route path="payouts" element={<AdminPayouts />} />
        <Route path="revenue" element={<AdminRevenue />} />
        <Route path="reports" element={<AdminReports />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
