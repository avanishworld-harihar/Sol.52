"use client";

import { ProjectContractValueForm, ProjectReceivedAmountForm } from "@/components/projects/hub/project-contract-value-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProjectListItem } from "@/lib/project-api-client";
import { formatInrCompact } from "@/lib/proposal-hub-insights";
import { CircleDollarSign, IndianRupee, TrendingUp, WalletCards } from "lucide-react";

export function ProjectHubFinanceTab({ project }: { project: ProjectListItem }) {
  const contract = project.stored_contract_amount_inr ?? 0;
  const received = project.amount_received_inr ?? 0;
  const pending = project.pending_inr ?? Math.max(0, contract - received);
  const pct = contract > 0 ? Math.min(100, Math.round((received / contract) * 100)) : 0;
  const items = [
    { label: "Contract value", value: formatInrCompact(contract), icon: IndianRupee, tone: "text-slate-700" },
    { label: "Received", value: formatInrCompact(received), icon: WalletCards, tone: "text-emerald-700" },
    { label: "Outstanding", value: formatInrCompact(pending), icon: CircleDollarSign, tone: pending > 0 ? "text-amber-700" : "text-emerald-700" },
    { label: "Collection", value: `${pct}%`, icon: TrendingUp, tone: "text-indigo-700" },
  ];

  return (
    <div id="project-hub-panel-finance" role="tabpanel" aria-labelledby="project-hub-tab-finance" className="space-y-4">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {items.map(({ label, value, icon: Icon, tone }) => (
          <Card key={label} className="border-slate-200/90 dark:border-white/10">
            <CardContent className="p-3 sm:p-4">
              <Icon className={`h-4 w-4 ${tone}`} aria-hidden />
              <p className="mt-2 text-[9px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
              <p className={`mt-0.5 text-lg font-extrabold tabular-nums ${tone}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="border-slate-200/90 dark:border-white/10">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-extrabold">Collection progress</CardTitle></CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all" style={{ width: `${pct}%` }} /></div>
          <ProjectContractValueForm project={project} />
          <ProjectReceivedAmountForm project={project} />
        </CardContent>
      </Card>
    </div>
  );
}
