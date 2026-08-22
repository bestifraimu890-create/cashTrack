import {
  Utensils, Bus, GraduationCap, Wifi, Building2, Clapperboard,
  ShoppingBag, HeartPulse, MoreHorizontal, User,
} from "lucide-react";

export const CATEGORIES = {
  Food: { icon: Utensils, color: "#059669" },
  Transport: { icon: Bus, color: "#0891b2" },
  School: { icon: GraduationCap, color: "#7c3aed" },
  Data: { icon: Wifi, color: "#2563eb" },
  Accommodation: { icon: Building2, color: "#b45309" },
  Entertainment: { icon: Clapperboard, color: "#db2777" },
  Shopping: { icon: ShoppingBag, color: "#ea580c" },
  Health: { icon: HeartPulse, color: "#dc2626" },
  Personal: { icon: User, color: "#4f46e5" },
  Other: { icon: MoreHorizontal, color: "#64748b" },
};

export const naira = (n) =>
  `₦${Math.abs(n).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const initialsOf = (user) => {
  const m = user?.user_metadata || {};
  const first = (m.first_name || "").trim();
  const last = (m.last_name || "").trim();
  if (first && last) return (first[0] + last[0]).toUpperCase();
  if (first) return first.slice(0, 2).toUpperCase();
  if (user?.email) return user.email.slice(0, 2).toUpperCase();
  return "CT";
};

// Fee model — shared by student ledger and admin revenue pages
export const FEE_RATE = 0.015; // 1.5%
export const FEE_CAP = 200; // ₦200 max fee per transaction
export const feeFor = (amount) => Math.round(Math.min(Math.abs(amount) * FEE_RATE, FEE_CAP));

export const PAYOUT_STATUS = {
  pending_otp: { label: "Awaiting approval", cls: "bg-amber-50 text-amber-700" },
  processing: { label: "Processing", cls: "bg-blue-50 text-blue-600" },
  completed: { label: "Completed", cls: "bg-emerald-50 text-emerald-700" },
  failed: { label: "Failed", cls: "bg-red-50 text-red-600" },
  rejected: { label: "Rejected", cls: "bg-red-50 text-red-600" },
};
