import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "../../supabase/client.js";
import { Card, ChildAvatar } from "../../components/common/index.js";

export default function SpendingLimits() {
  const { user, childrenList } = useOutletContext();
  const [banner, setBanner] = useState(null);

  return (
    <div className="space-y-5">
      {banner && (
        <div className="flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
          <CheckCircle2 size={16} /> {banner}
        </div>
      )}
      {childrenList.length === 0 && (
        <Card className="p-10 text-center text-sm text-slate-400">
          No children linked yet. Link a child to set their withdrawal limits.
        </Card>
      )}
      {childrenList.map((c) => (
        <Card key={c.id} className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <ChildAvatar child={c} />
            <div>
              <p className="font-semibold text-slate-900">{c.name}</p>
              <p className="text-xs text-slate-400">{c.school || "Student"}</p>
            </div>
          </div>
          <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
            Spending limits are managed through <span className="font-semibold">Parental Controls</span>.
            Set an approval threshold there to control how much {c.name} can withdraw per day.
          </div>
        </Card>
      ))}
    </div>
  );
}
