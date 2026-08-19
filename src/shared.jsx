import React from "react";
import {
  Utensils, Bus, GraduationCap, Wifi, Building2, Clapperboard,
  ShoppingBag, HeartPulse, MoreHorizontal, ArrowUpRight, User,
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

export function Card({ className = "", children }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-card ${className}`}>
      {children}
    </div>
  );
}

export function CategoryIcon({ category, size = 18, className = "" }) {
  const meta = CATEGORIES[category];
  if (!meta) return <ArrowUpRight size={size} className={className} />;
  const Icon = meta.icon;
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full ${className}`}
      style={{ background: `${meta.color}1A`, color: meta.color, width: size + 18, height: size + 18 }}
    >
      <Icon size={size} />
    </span>
  );
}

export function ProgressBar({ value, max, danger }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${danger ? "bg-red-500" : "bg-mint-600"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
