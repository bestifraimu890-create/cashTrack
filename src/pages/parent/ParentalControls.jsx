import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Toggle } from "../../components/common/index.js";
import { Card } from "../../components/common/index.js";

export default function ParentalControls() {
  const { childrenList } = useOutletContext();
  const [selected, setSelected] = useState(childrenList[0]?.id ?? "");
  const [settings, setSettings] = useState(
    Object.fromEntries(
      childrenList.map((c) => [
        c.id,
        {
          requireApproval: false,
          approvalThreshold: 5000,
          blockEntertainment: false,
          allowCsvImport: true,
          notifyOnEveryTransaction: false,
        },
      ])
    )
  );

  const child = childrenList.find((c) => c.id === selected);
  const current = settings[selected] || {};

  const update = (key, value) =>
    setSettings((prev) => ({ ...prev, [selected]: { ...prev[selected], [key]: value } }));

  return (
    <div className="space-y-5">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {childrenList.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelected(c.id)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium ${
              selected === c.id ? "bg-brand-700 text-white" : "bg-white text-slate-500 border border-slate-200"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {childrenList.length === 0 && (
        <Card className="p-10 text-center text-sm text-slate-400">
          No children linked yet. Link a child to manage their parental controls.
        </Card>
      )}

      {child && (
        <Card className="divide-y divide-slate-100">
          <div className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm font-medium text-slate-800">Require approval for purchases</p>
              <p className="text-xs text-slate-400">
                {child.name} must get your approval before spending above the threshold
              </p>
            </div>
            <Toggle checked={current.requireApproval} onChange={(v) => update("requireApproval", v)} />
          </div>

          {current.requireApproval && (
            <div className="flex items-center justify-between p-5">
              <p className="text-sm font-medium text-slate-800">Approval threshold</p>
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5">
                <span className="text-sm text-slate-400">₦</span>
                <input
                  type="number"
                  min="0"
                  value={current.approvalThreshold}
                  onChange={(e) => update("approvalThreshold", parseFloat(e.target.value) || 0)}
                  className="w-24 bg-transparent text-sm outline-none"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm font-medium text-slate-800">Block Entertainment category</p>
              <p className="text-xs text-slate-400">Prevent spending on Entertainment purchases entirely</p>
            </div>
            <Toggle checked={current.blockEntertainment} onChange={(v) => update("blockEntertainment", v)} />
          </div>

          <div className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm font-medium text-slate-800">Allow CSV import</p>
              <p className="text-xs text-slate-400">Let {child.name} bulk-import expenses from a spreadsheet</p>
            </div>
            <Toggle checked={current.allowCsvImport} onChange={(v) => update("allowCsvImport", v)} />
          </div>

          <div className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm font-medium text-slate-800">Notify on every transaction</p>
              <p className="text-xs text-slate-400">Get an alert for each purchase, not just limit breaches</p>
            </div>
            <Toggle
              checked={current.notifyOnEveryTransaction}
              onChange={(v) => update("notifyOnEveryTransaction", v)}
            />
          </div>
        </Card>
      )}
    </div>
  );
}
