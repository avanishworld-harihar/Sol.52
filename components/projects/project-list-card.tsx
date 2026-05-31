"use client";

import { CardActionDots } from "@/components/card-action-dots";
import { ProjectHealthBadge } from "@/components/projects/project-health-badge";
import { ProjectStageBadge } from "@/components/projects/project-stage-badge";
import { useLanguage } from "@/lib/language-context";
import type { ProjectListItem } from "@/lib/project-api-client";
import { projectDisplayName } from "@/lib/project-list-utils";
import { formatInrCompact } from "@/lib/proposal-hub-insights";
import { cn } from "@/lib/utils";
import { Archive, ArchiveRestore, Eye, EyeOff, Send, User } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export type ProjectListPatch = {
  dashboard_visible?: boolean;
  archived_at?: string | null | true;
};

function MetaCell({
  label,
  value,
  className,
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 rounded-lg bg-slate-50 px-2.5 py-2 dark:bg-white/[0.04]", className)}>
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {label}
      </p>
      <p className="mt-0.5 truncate text-xs font-semibold text-slate-800 dark:text-slate-100">
        {value}
      </p>
    </div>
  );
}

export function ProjectListCard({
  project,
  view,
  onPatch,
  onEdit,
  onDelete,
  className,
}: {
  project: ProjectListItem;
  view: "active" | "hidden" | "archived";
  onPatch?: (id: string, patch: ProjectListPatch) => void | Promise<void>;
  onEdit?: (project: ProjectListItem) => void;
  onDelete?: (project: ProjectListItem) => void;
  className?: string;
}) {
  const { t } = useLanguage();
  const name = projectDisplayName(project);
  const pending =
    project.contract_amount_inr != null
      ? Math.max(0, project.contract_amount_inr - (project.amount_received_inr ?? 0))
      : null;

  return (
    <article
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-teal-200/80 hover:shadow-md dark:border-white/10 dark:bg-[#0c1017] dark:hover:border-teal-500/30",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-extrabold text-slate-900 dark:text-slate-50 sm:text-base">
              {name}
            </h3>
            {project.project_code ? (
              <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                {project.project_code}
              </span>
            ) : null}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <ProjectStageBadge stage={project.current_stage} />
            <ProjectHealthBadge health={project.health} />
          </div>

          {project.lead_city ? (
            <p className="mt-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {project.lead_city}
              {project.lead_phone ? ` · ${project.lead_phone}` : ""}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {project.lead_id ? (
            <Link
              href={`/customers/${encodeURIComponent(project.lead_id)}`}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2 text-[10px] font-bold text-slate-700 hover:bg-slate-50 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/5"
              title={t("projects_resumeProposal")}
            >
              <Send className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">CRM</span>
            </Link>
          ) : null}
          {onEdit || onDelete ? (
            <CardActionDots
              className="relative"
              editAriaLabel={t("projects_editProjectAria")}
              deleteAriaLabel={t("projects_deleteProjectAria")}
              onEdit={onEdit ? () => onEdit(project) : undefined}
              onDelete={onDelete ? () => onDelete(project) : undefined}
            />
          ) : null}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MetaCell label="Value" value={formatInrCompact(project.contract_amount_inr)} />
        <MetaCell
          label="Pending"
          value={pending != null ? formatInrCompact(pending) : "—"}
        />
        <MetaCell
          label="Manager"
          value={
            project.manager_name ? (
              <span className="inline-flex items-center gap-1">
                <User className="h-3 w-3 shrink-0 opacity-60" />
                {project.manager_name}
              </span>
            ) : (
              "—"
            )
          }
        />
        <MetaCell
          label="Technician"
          value={project.tech_name ?? "—"}
        />
      </div>

      {view !== "active" && onPatch ? (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3 dark:border-white/[0.06]">
          {view === "hidden" ? (
            <button
              type="button"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-[11px] font-bold text-slate-800 hover:bg-slate-50 dark:border-white/15 dark:text-slate-100"
              onClick={() => void onPatch(project.id, { dashboard_visible: true })}
            >
              <Eye className="h-3.5 w-3.5" />
              {t("projects_kanbanShowDash")}
            </button>
          ) : null}
          {view === "archived" ? (
            <button
              type="button"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-[11px] font-bold text-white dark:bg-slate-100 dark:text-slate-900"
              onClick={() => void onPatch(project.id, { archived_at: null })}
            >
              <ArchiveRestore className="h-3.5 w-3.5" />
              {t("projects_kanbanRestore")}
            </button>
          ) : null}
        </div>
      ) : null}

      {view === "active" && onPatch ? (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3 dark:border-white/[0.06]">
          <button
            type="button"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-[11px] font-bold text-slate-700 hover:bg-slate-50 dark:border-white/15 dark:text-slate-200"
            onClick={() => void onPatch(project.id, { dashboard_visible: false })}
          >
            <EyeOff className="h-3.5 w-3.5" />
            Hide from dashboard
          </button>
          <button
            type="button"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-[11px] font-bold text-slate-700 hover:bg-slate-50 dark:border-white/15 dark:text-slate-200"
            onClick={() => void onPatch(project.id, { archived_at: true })}
          >
            <Archive className="h-3.5 w-3.5" />
            Archive
          </button>
        </div>
      ) : null}
    </article>
  );
}
