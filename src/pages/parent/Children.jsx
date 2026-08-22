import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { PlusCircle, CheckCircle2, AlertTriangle, GraduationCap, Check } from "lucide-react";
import { edgeCall } from "../../supabase/edge.js";
import { naira } from "../../lib/constants.js";
import { Card, ChildAvatar } from "../../components/common/index.js";

export default function Children() {
  const { user, childrenList, loadChildren } = useOutletContext();
  const [showAdd, setShowAdd] = useState(false);
  const [linkCode, setLinkCode] = useState("");
  const [linking, setLinking] = useState(false);
  const [linkBanner, setLinkBanner] = useState(null);

  const linkedChildren = childrenList;

  const handleLink = async () => {
    if (!linkCode.trim()) return;
    setLinking(true);
    setLinkBanner(null);
    try {
      const r = await edgeCall("link-child", { connectionId: linkCode.trim() });
      setLinkBanner({ type: "success", text: `Linked ${r.child.name} successfully!` });
      setLinkCode("");
      setShowAdd(false);
      if (loadChildren) loadChildren();
    } catch (e) {
      setLinkBanner({ type: "error", text: e.message });
    } finally {
      setLinking(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{linkedChildren.length} children connected to your account</p>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white"
        >
          <PlusCircle size={15} /> Connect a Child
        </button>
      </div>

      {showAdd && (
        <Card className="p-6">
          <h3 className="font-semibold text-slate-900">Connect a Child</h3>
          <p className="mt-1 text-sm text-slate-500">
            Ask your child to generate a connection code from their Profile page, then enter it below.
          </p>
          {linkBanner && (
            <div
              className={`mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                linkBanner.type === "success" ? "bg-brand-50 text-brand-700" : "bg-red-50 text-red-600"
              }`}
            >
              {linkBanner.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              {linkBanner.text}
            </div>
          )}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              value={linkCode}
              onChange={(e) => setLinkCode(e.target.value.toUpperCase())}
              placeholder="Enter connection ID (e.g. CTAB12CD)"
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2.5 font-mono text-sm font-semibold tracking-wider outline-none focus:border-brand-500"
            />
            <button
              onClick={handleLink}
              disabled={linking || !linkCode.trim()}
              className="rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {linking ? "Linking…" : "Link Child"}
            </button>
          </div>
          <button onClick={() => { setShowAdd(false); setLinkBanner(null); }} className="mt-3 text-xs font-medium text-slate-400">
            Cancel
          </button>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {linkedChildren.map((c) => (
          <Card key={c.id} className="p-6">
            <div className="flex items-center gap-3">
              <ChildAvatar child={c} size={48} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900">{c.name}</p>
                <p className="truncate text-xs text-slate-400">{c.school}</p>
              </div>
              <span className="flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                <GraduationCap size={12} />
                Student
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-400">Balance</p>
                <p className="text-sm font-bold text-slate-800">{naira(c.balance)}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-400">Weekly Limit</p>
                <p className="text-sm font-bold text-slate-800">{naira(c.weeklyLimit)}</p>
              </div>
            </div>
            <span
              className={`mt-4 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                c.status === "active" ? "bg-brand-50 text-brand-700" : "bg-amber-50 text-amber-700"
              }`}
            >
              <Check size={12} /> {c.status === "active" ? "Active" : "Pending approval"}
            </span>
          </Card>
        ))}
      </div>
    </div>
  );
}
