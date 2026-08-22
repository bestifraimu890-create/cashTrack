import React from "react";
import { ShieldCheck } from "lucide-react";

export function AuthShell({ title, subtitle, badgeTitle, badgeText, children }) {
  return (
    <div className="flex min-h-screen w-full bg-paper">
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-brand-800 via-brand-700 to-brand-600 lg:block">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10" />
        <div className="absolute bottom-[-4rem] right-[-4rem] h-96 w-96 rounded-full bg-brand-900/30" />
        <div className="relative z-10 flex h-full flex-col justify-between p-10">
          <div className="flex items-center gap-2 text-white">
            <img src="/cashtrack-logo.png" alt="CashTrack" className="h-14 w-auto" />
          </div>
          <div className="rounded-2xl bg-white/95 p-6 shadow-xl">
            <p className="font-display text-lg font-bold text-slate-900">{badgeTitle}</p>
            <p className="mt-2 text-sm text-slate-600">{badgeText}</p>
            <div className="mt-4 flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                <ShieldCheck size={16} />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-800">Bank Level Security</p>
                <p className="text-xs text-slate-500">Your data stays encrypted and private.</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-brand-100">Built for Nigerian students &amp; parents.</p>
        </div>
      </div>
      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <h1 className="font-display text-2xl font-bold text-slate-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
