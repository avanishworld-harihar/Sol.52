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

const AVATAR_GRADIENTS = [
  "from-teal-500 to-emerald-600",
  "from-sky-500 to-indigo-600",
  "from-violet-500 to-purple-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
] as const;

function projectInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function projectAvatarGradient(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash + name.charCodeAt(i) * (i + 1)) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[hash];
}

function ProjectRowAvatar({ name }: { name: string }) {
  return (
    <div
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-xs font-extrabold text-white shadow-sm ring-2 ring-white dark:ring-[#0c1017]",
        projectAvatarGradient(name)
      )}
      aria-hidden
    >
      {projectInitials(name)}
    </div>
  );
}

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
        "hidden overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_8px_30px_-12px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-[#0c1017] lg:block",
        className
      )}
    >
      <div className="grid grid-cols-12 gap-4 border-b border-slate-200/90 bg-gradient-to-r from-slate-50 to-white px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:border-white/10 dark:from-[#141a22] dark:to-[#0c1017] dark:text-slate-400">
        <div className="col-span-4 pl-[3.25rem]">Project</div>
        <div className="col-span-2">Stage</div>
        <div className="col-span-2">Health</div>
        <div className="col-span-1">Value</div>
        <div className="col-span-1">Team</div>
        <div className="col-span-2 text-right">Actions</div>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
        {projects.map((p) => {
          const displayName = projectDisplayName(p);
          return (
            <article
              key={p.id}
              className="group/row relative grid grid-cols-12 items-center gap-4 px-5 py-3.5 transition-colors hover:bg-slate-50/90 dark:hover:bg-white/[0.025]"
            >
              <div
                className="pointer-events-none absolute bottom-2 left-0 top-2 w-0.5 rounded-full bg-teal-500 opacity-0 transition-opacity group-hover/row:opacity-100"
                aria-hidden
              />

              <div className="col-span-4 min-w-0">
                <Link href={`/projects/${encodeURIComponent(p.id)}`} className="group flex items-center gap-3">
                  <ProjectRowAvatar name={displayName} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold tracking-tight text-slate-900 transition group-hover:text-teal-700 dark:text-slate-50 dark:group-hover:text-teal-300">
                      {displayName}
                    </p>
                    <p className="mt-0.5 truncate font-mono text-[10px] font-semibold text-slate-400 group-hover:text-slate-500">
                      {p.project_code ?? "—"}
                    </p>
                  </div>
                </Link>
              </div>

              <div className="col-span-2">
                <ProjectStageBadge stage={p.current_stage} compact />
              </div>

              <div className="col-span-2">
                <ProjectHealthBadge health={p.health} />
              </div>

              <div className="col-span-1 tabular-nums text-sm font-extrabold text-slate-900 dark:text-slate-100">
                {formatInrCompact(p.contract_amount_inr)}
              </div>

              <div className="col-span-1 min-w-0">
                <p className="truncate text-xs font-medium text-slate-700 dark:text-slate-200">
                  {p.manager_name ?? "—"}
                </p>
                {p.tech_name ? (
                  <p className="mt-0.5 truncate text-[10px] text-slate-400" title={`Technician: ${p.tech_name}`}>
                    {p.tech_name}
                  </p>
                ) : null}
              </div>

              <div className="col-span-2 flex items-center justify-end gap-1.5">
                {p.lead_id ? (
                  <Link
                    href={buildProposalEditHref({
                      leadId: p.lead_id,
                      proposalId: p.primary_proposal_id,
                    })}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200/90 bg-white text-slate-600 shadow-sm transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700 dark:border-white/10 dark:bg-white/5 dark:hover:bg-teal-950/40"
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
            </article>
          );
        })}
      </div>
    </div>
  );
}
