"use client";

import { CardActionDots } from "@/components/card-action-dots";
import { ProjectHealthBadge } from "@/components/projects/project-health-badge";
import { ProjectStageBadge } from "@/components/projects/project-stage-badge";
import { useLanguage } from "@/lib/language-context";
import type { ProjectListItem } from "@/lib/project-api-client";
import { projectDisplayName } from "@/lib/project-list-utils";
import { formatInrCompact } from "@/lib/proposal-hub-insights";
import { cn } from "@/lib/utils";
import { Archive, ArchiveRestore, Eye, EyeOff, Send } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
    <div
      className={cn(
        "min-w-0 rounded-md bg-slate-50 px-2 py-1.5 dark:bg-white/[0.04]",
        className
      )}
    >
      <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {label}
      </p>
      <p className="mt-0.5 truncate text-xs font-semibold text-slate-800 dark:text-slate-100">
        {value}
      </p>
    </div>
  );
}

function MetaInline({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <span className="inline-flex min-w-0 max-w-[50%] items-baseline gap-0.5">
      <span className="shrink-0 text-[8px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {label}
      </span>
      <span className="truncate text-[10px] font-semibold text-slate-800 dark:text-slate-100">
        {value}
      </span>
    </span>
  );
}

function MetaDot() {
  return (
    <span className="shrink-0 text-[10px] font-bold text-slate-300 dark:text-slate-600" aria-hidden>
      ·
    </span>
  );
}

const actionBtnClass =
  "inline-flex min-h-[28px] flex-1 items-center justify-center gap-1 rounded-md border border-slate-200 px-2 text-[10px] font-bold text-slate-700 hover:bg-slate-50 dark:border-white/15 dark:text-slate-200 max-sm:min-h-[28px] max-sm:py-1 sm:h-8 sm:flex-none sm:rounded-lg sm:px-3 sm:text-[11px]";

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
  const router = useRouter();
  const name = projectDisplayName(project);
  const pending =
    project.contract_amount_inr != null
      ? Math.max(0, project.contract_amount_inr - (project.amount_received_inr ?? 0))
      : null;

  const locationLine =
    project.lead_city || project.lead_phone
      ? [project.lead_city, project.lead_phone].filter(Boolean).join(" · ")
      : null;

  return (
    <article
      role="link"
      tabIndex={0}
      aria-label={`Open ${name} project`}
      onClick={() => router.push(`/projects/${encodeURIComponent(project.id)}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(`/projects/${encodeURIComponent(project.id)}`);
        }
      }}
      className={cn(
        "rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-teal-200/80 hover:shadow-md dark:border-white/10 dark:bg-[#0c1017] dark:hover:border-teal-500/30",
        "max-sm:p-2 sm:rounded-xl sm:p-4",
        className
      )}
    >
      <div className="flex items-start gap-1.5 sm:gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-1">
            <div className="group min-w-0 flex-1">
              <h3 className="truncate text-[13px] font-extrabold leading-tight text-slate-900 transition group-hover:text-teal-700 dark:text-slate-50 dark:group-hover:text-teal-300 sm:text-base">
                {name}
              </h3>
            </div>
            <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
              {project.lead_id ? (
                <Link
                  href={`/customers/${encodeURIComponent(project.lead_id)}`}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  className="inline-flex h-7 min-w-[28px] items-center justify-center rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/5 sm:h-8 sm:px-2"
                  title={t("projects_resumeProposal")}
                  aria-label={t("projects_resumeProposal")}
                >
                  <Send className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </Link>
              ) : null}
              {onEdit || onDelete ? (
                <CardActionDots
                  className="relative"
                  interaction="menu"
                  editAriaLabel={t("projects_editProjectAria")}
                  deleteAriaLabel={t("projects_deleteProjectAria")}
                  onEdit={onEdit ? () => onEdit(project) : undefined}
                  onDelete={onDelete ? () => onDelete(project) : undefined}
                />
              ) : null}
            </div>
          </div>

          <div className="mt-0.5 flex flex-wrap items-center gap-1 sm:mt-1.5 sm:gap-1.5">
            {project.project_code ? (
              <span className="shrink-0 rounded bg-slate-100 px-1 py-px font-mono text-[9px] font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300 sm:rounded-md sm:px-1.5 sm:text-[10px]">
                {project.project_code}
              </span>
            ) : null}
            <ProjectStageBadge stage={project.current_stage} compact />
            <ProjectHealthBadge health={project.health} />
          </div>

          {locationLine ? (
            <p className="mt-0.5 truncate text-[10px] font-medium text-slate-500 dark:text-slate-400 sm:mt-1 sm:text-[11px]">
              {locationLine}
            </p>
          ) : null}
        </div>
      </div>

      {/* Mobile: compact inline rows */}
      <div className="mt-1 space-y-0.5 sm:hidden">
        <div className="flex min-w-0 flex-wrap items-center gap-x-1">
          <MetaInline label="Val" value={formatInrCompact(project.contract_amount_inr)} />
          <MetaDot />
          <MetaInline
            label="Pend"
            value={pending != null ? formatInrCompact(pending) : "—"}
          />
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-x-1">
          <MetaInline label="Mgr" value={project.manager_name?.trim() || "—"} />
          <MetaDot />
          <MetaInline label="Tech" value={project.tech_name?.trim() || "—"} />
        </div>
      </div>

      {/* Desktop: grid cells */}
      <div className="mt-3 hidden grid-cols-4 gap-2 sm:grid">
        <MetaCell label="Value" value={formatInrCompact(project.contract_amount_inr)} />
        <MetaCell
          label="Pending"
          value={pending != null ? formatInrCompact(pending) : "—"}
        />
        <MetaCell label="Manager" value={project.manager_name?.trim() || "—"} />
        <MetaCell label="Technician" value={project.tech_name?.trim() || "—"} />
      </div>

      {view !== "active" && onPatch ? (
        <div className="mt-1.5 flex gap-1 border-t border-slate-100 pt-1.5 dark:border-white/[0.06] sm:mt-3 sm:gap-2 sm:pt-3">
          {view === "hidden" ? (
            <button
              type="button"
              className={actionBtnClass}
              onClick={() => void onPatch(project.id, { dashboard_visible: true })}
            >
              <Eye className="h-3 w-3 shrink-0" />
              <span className="truncate sm:hidden">{t("projects_kanbanShowDash")}</span>
              <span className="hidden sm:inline">{t("projects_kanbanShowDash")}</span>
            </button>
          ) : null}
          {view === "archived" ? (
            <button
              type="button"
              className={cn(actionBtnClass, "border-transparent bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900")}
              onClick={() => void onPatch(project.id, { archived_at: null })}
            >
              <ArchiveRestore className="h-3 w-3 shrink-0" />
              <span className="truncate">{t("projects_kanbanRestore")}</span>
            </button>
          ) : null}
        </div>
      ) : null}

      {view === "active" && onPatch ? (
        <div className="mt-1.5 flex gap-1 border-t border-slate-100 pt-1.5 dark:border-white/[0.06] sm:mt-3 sm:gap-2 sm:pt-3">
          <button
            type="button"
            className={actionBtnClass}
            onClick={() => void onPatch(project.id, { dashboard_visible: false })}
          >
            <EyeOff className="h-3 w-3 shrink-0" aria-hidden />
            <span className="truncate max-sm:text-[9px]">Hide</span>
            <span className="hidden sm:inline">Hide from dashboard</span>
          </button>
          <button
            type="button"
            className={actionBtnClass}
            onClick={() => void onPatch(project.id, { archived_at: true })}
          >
            <Archive className="h-3 w-3 shrink-0" aria-hidden />
            Archive
          </button>
        </div>
      ) : null}
    </article>
  );
}
