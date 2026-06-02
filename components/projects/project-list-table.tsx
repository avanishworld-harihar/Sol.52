"use client";

import { CardActionDots } from "@/components/card-action-dots";
import { ProjectHealthBadge } from "@/components/projects/project-health-badge";
import { ProjectStageBadge } from "@/components/projects/project-stage-badge";
import type { ProjectListPatch } from "@/components/projects/project-list-card";
import { useLanguage } from "@/lib/language-context";
import type { ProjectListItem } from "@/lib/project-api-client";
import { buildProposalEditHref } from "@/lib/proposal-edit-url";
import { projectDisplayName } from "@/lib/project-list-utils";
import { formatInrCompact } from "@/lib/proposal-hub-insights";
import { cn } from "@/lib/utils";
import { Send } from "lucide-react";
import Link from "next/link";

export function ProjectListTable({
  projects,
  view,
  onPatch,
  onEdit,
  onDelete,
  className,
}: {
  projects: ProjectListItem[];
  view?: "active" | "hidden" | "archived";
  onPatch?: (id: string, patch: ProjectListPatch) => void | Promise<void>;
  onEdit?: (project: ProjectListItem) => void;
  onDelete?: (project: ProjectListItem) => void;
  className?: string;
}) {
  const { t } = useLanguage();

  if (projects.length === 0) return null;

  return (
    <div
      className={cn(
        "page-lite-item hidden overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#0c1017] lg:block",
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-black uppercase tracking-wide text-slate-500 dark:border-white/10 dark:bg-[#141a22] dark:text-slate-400">
              <th className="px-4 py-3">Project</th>
              <th className="px-3 py-3">Stage</th>
              <th className="px-3 py-3">Health</th>
              <th className="px-3 py-3">Value</th>
              <th className="px-3 py-3">Manager</th>
              <th className="px-3 py-3">Technician</th>
              <th className="px-3 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
            {projects.map((p) => (
              <tr
                key={p.id}
                className="transition hover:bg-slate-50/80 dark:hover:bg-white/[0.03]"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/projects/${encodeURIComponent(p.id)}`}
                    className="group inline-block"
                  >
                    <p className="font-bold text-slate-900 transition group-hover:text-teal-700 dark:text-slate-100 dark:group-hover:text-teal-300">
                      {projectDisplayName(p)}
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] font-semibold text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300">
                      {p.project_code ?? "—"}
                    </p>
                  </Link>
                </td>
                <td className="px-3 py-3">
                  <ProjectStageBadge stage={p.current_stage} compact />
                </td>
                <td className="px-3 py-3">
                  <ProjectHealthBadge health={p.health} />
                </td>
                <td className="px-3 py-3 tabular-nums font-semibold text-slate-800 dark:text-slate-200">
                  {formatInrCompact(p.contract_amount_inr)}
                </td>
                <td className="px-3 py-3 text-xs font-medium text-slate-600 dark:text-slate-300">
                  {p.manager_name ?? "—"}
                </td>
                <td className="px-3 py-3 text-xs font-medium text-slate-600 dark:text-slate-300">
                  {p.tech_name ?? "—"}
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {p.lead_id ? (
                      <Link
                        href={buildProposalEditHref({
                          leadId: p.lead_id,
                          proposalId: p.primary_proposal_id,
                        })}
                        className="inline-flex h-8 items-center rounded-lg border border-slate-200 px-2 text-[10px] font-bold text-slate-700 dark:border-white/15 dark:text-slate-200"
                        title={t("projects_resumeProposal")}
                      >
                        <Send className="h-3.5 w-3.5" />
                      </Link>
                    ) : null}
                    {view === "hidden" && onPatch ? (
                      <button
                        type="button"
                        className="rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-bold"
                        onClick={() => void onPatch(p.id, { dashboard_visible: true })}
                      >
                        Restore
                      </button>
                    ) : null}
                    {view === "archived" && onPatch ? (
                      <button
                        type="button"
                        className="rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-bold text-white"
                        onClick={() => void onPatch(p.id, { archived_at: null })}
                      >
                        Restore
                      </button>
                    ) : null}
                    {onEdit || onDelete ? (
                      <CardActionDots
                        className="relative"
                        editAriaLabel={t("projects_editProjectAria")}
                        deleteAriaLabel={t("projects_deleteProjectAria")}
                        onEdit={onEdit ? () => onEdit(p) : undefined}
                        onDelete={onDelete ? () => onDelete(p) : undefined}
                      />
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
