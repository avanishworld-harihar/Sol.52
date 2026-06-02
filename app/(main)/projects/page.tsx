"use client";

import { Send } from "lucide-react";
import type { GlassProjectSummary } from "@/components/glass-project-card";
import { ProjectListCard, type ProjectListPatch } from "@/components/projects/project-list-card";
import { ProjectListEmpty } from "@/components/projects/project-list-empty";
import { ProjectListFiltersBar } from "@/components/projects/project-list-filters";
import { ProjectListPagination } from "@/components/projects/project-list-pagination";
import { ProjectListSkeleton } from "@/components/projects/project-list-skeleton";
import { ProjectListTable } from "@/components/projects/project-list-table";
import { ProjectOpsDashboard } from "@/components/projects/ops/project-ops-dashboard";
import { WorkflowLifecycleStrip } from "@/components/workflow-lifecycle-strip";
import { FloatingLabelInput, FloatingLabelSelect } from "@/components/ui/floating-label-input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast-center";
import { useLanguage } from "@/lib/language-context";
import {
  fetchProjectDashboardStats,
  fetchProjectList,
  patchProject,
  PROJECT_DASHBOARD_STATS_KEY,
  type ProjectListItem,
} from "@/lib/project-api-client";
import { DASHBOARD_STATS_SWR_KEY } from "@/lib/dashboard-stats-client";
import {
  applyProjectListPipeline,
  buildProjectListUrl,
  DEFAULT_LIST_FILTERS,
  type ProjectListFilters,
} from "@/lib/project-list-utils";
import type { ProjectHealth } from "@/lib/project-health";
import type { ProjectStageId } from "@/lib/project-stages";
import { isProjectStageId } from "@/lib/project-stages";
import { formatPipelineDisplayName } from "@/lib/supabase";
import { WorkspacePage, WorkspacePageHero, WorkspaceStaggerItem } from "@/components/workspace";
import { buildProposalEditHref } from "@/lib/proposal-edit-url";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { FormEvent } from "react";
import { Suspense, useCallback, useMemo, useState } from "react";
import useSWR, { useSWRConfig } from "swr";

type ProjectsView = "active" | "hidden" | "archived";

const TAB_DEFS: {
  id: ProjectsView;
  labelKey: string;
  fallback: string;
  shortLabel: string;
  description: string;
}[] = [
  {
    id: "active",
    labelKey: "projects_tabActive",
    fallback: "Active",
    shortLabel: "Active",
    description: "On the dashboard right now.",
  },
  {
    id: "hidden",
    labelKey: "projects_tabHidden",
    fallback: "Hidden from dashboard",
    shortLabel: "Hidden",
    description: "Decluttered from the home dashboard, still in the pipeline.",
  },
  {
    id: "archived",
    labelKey: "projects_tabArchived",
    fallback: "Archived",
    shortLabel: "Archive",
    description: "End-of-life projects. Restore anytime.",
  },
];

function resolveView(raw: string | null): ProjectsView {
  if (raw === "hidden" || raw === "archived") return raw;
  return "active";
}

function mapPipelineStatus(s: string | null): GlassProjectSummary["status"] {
  const x = (s ?? "").toLowerCase();
  if (x.includes("done") || x.includes("complete") || x.includes("commission")) return "done";
  if (x.includes("active") || x.includes("install") || x.includes("progress")) return "active";
  return "pending";
}

function readFiltersFromParams(params: URLSearchParams): ProjectListFilters {
  const stageRaw = params.get("stage");
  const healthRaw = params.get("health");
  const sortRaw = params.get("sort");
  const dirRaw = params.get("dir");
  const pageRaw = Number(params.get("page") ?? "1");

  const validSorts = new Set([
    "updated_at",
    "name",
    "value",
    "stage",
    "health",
    "target_completion",
  ]);

  return {
    ...DEFAULT_LIST_FILTERS,
    search: params.get("q") ?? "",
    stage: stageRaw && isProjectStageId(stageRaw) ? stageRaw : "all",
    health:
      healthRaw === "on_track" ||
      healthRaw === "attention_needed" ||
      healthRaw === "delayed" ||
      healthRaw === "blocked"
        ? (healthRaw as ProjectHealth)
        : "all",
    sort: validSorts.has(sortRaw ?? "") ? (sortRaw as ProjectListFilters["sort"]) : "updated_at",
    sortDir: dirRaw === "asc" ? "asc" : "desc",
    page: Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1,
  };
}

type ProjectEditStatus = GlassProjectSummary["status"];

function ProjectsBoard() {
  const { t } = useLanguage();
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = resolveView(searchParams.get("view"));
  const filters = useMemo(() => readFiltersFromParams(searchParams), [searchParams]);
  const { mutate: mutateGlobal } = useSWRConfig();

  const [projectModal, setProjectModal] = useState<"none" | "edit">("none");
  const [editProject, setEditProject] = useState<ProjectListItem | null>(null);
  const [deleteProjectTarget, setDeleteProjectTarget] = useState<ProjectListItem | null>(null);
  const [projForm, setProjForm] = useState({
    official_name: "",
    detail: "",
    capacity_kw: "",
    next_action: "",
    install_progress: "0",
    status: "pending" as ProjectEditStatus,
  });
  const [projError, setProjError] = useState("");

  const modalFloatingClass =
    "h-12 rounded-xl border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 focus:border-teal-500 focus:ring-teal-200/70";

  const listUrl = buildProjectListUrl({
    view,
    stage: filters.stage !== "all" ? filters.stage : null,
  });

  const { data, error, isLoading, mutate: mutateList } = useSWR(
    listUrl,
    fetchProjectList,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5_000,
      keepPreviousData: true,
    }
  );

  const { data: activeRows } = useSWR(
    buildProjectListUrl({ view: "active" }),
    fetchProjectList,
    { revalidateOnFocus: false, dedupingInterval: 30_000 }
  );
  const { data: hiddenRows } = useSWR(
    buildProjectListUrl({ view: "hidden" }),
    fetchProjectList,
    { revalidateOnFocus: false, dedupingInterval: 30_000 }
  );
  const { data: archivedRows } = useSWR(
    buildProjectListUrl({ view: "archived" }),
    fetchProjectList,
    { revalidateOnFocus: false, dedupingInterval: 30_000 }
  );

  const { data: opsStats, isLoading: opsStatsLoading } = useSWR(
    PROJECT_DASHBOARD_STATS_KEY,
    fetchProjectDashboardStats,
    { revalidateOnFocus: false, dedupingInterval: 30_000 }
  );

  const listPipeline = useMemo(() => {
    const rows = data ?? [];
    return applyProjectListPipeline(rows, filters);
  }, [data, filters]);

  const updateFilters = useCallback(
    (patch: Partial<ProjectListFilters>) => {
      const next = { ...filters, ...patch };
      const params = new URLSearchParams(searchParams.toString());
      if (view === "active") params.delete("view");
      else params.set("view", view);

      if (next.search.trim()) params.set("q", next.search.trim());
      else params.delete("q");

      if (next.stage !== "all") params.set("stage", next.stage);
      else params.delete("stage");

      if (next.health !== "all") params.set("health", next.health);
      else params.delete("health");

      if (next.sort !== "updated_at") params.set("sort", next.sort);
      else params.delete("sort");

      if (next.sortDir !== "desc") params.set("dir", next.sortDir);
      else params.delete("dir");

      if (next.page > 1) params.set("page", String(next.page));
      else params.delete("page");

      const qs = params.toString();
      router.replace(qs ? `/projects?${qs}` : "/projects", { scroll: false });
    },
    [filters, router, searchParams, view]
  );

  function setView(next: ProjectsView) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "active") params.delete("view");
    else params.set("view", next);
    params.delete("page");
    const qs = params.toString();
    router.replace(qs ? `/projects?${qs}` : "/projects", { scroll: false });
  }

  function closeProjectEditModal() {
    setProjectModal("none");
    setEditProject(null);
    setProjError("");
    setProjForm({
      official_name: "",
      detail: "",
      capacity_kw: "",
      next_action: "",
      install_progress: "0",
      status: "pending",
    });
  }

  const openEditProject = useCallback((project: ProjectListItem) => {
    setProjError("");
    setEditProject(project);
    setProjectModal("edit");
    setProjForm({
      official_name: project.official_name?.trim() ?? "",
      detail: project.detail?.trim() ?? "",
      capacity_kw: project.capacity_kw?.trim() ?? "",
      next_action: project.next_action?.trim() ?? "",
      install_progress: String(project.install_progress ?? 0),
      status: mapPipelineStatus(project.status),
    });
  }, []);

  const revalidateAllLists = useCallback(async () => {
    await mutateList();
    await mutateGlobal(buildProjectListUrl({ view: "active" }));
    await mutateGlobal(buildProjectListUrl({ view: "hidden" }));
    await mutateGlobal(buildProjectListUrl({ view: "archived" }));
    await mutateGlobal(DASHBOARD_STATS_SWR_KEY, undefined, { revalidate: true });
    await mutateGlobal(PROJECT_DASHBOARD_STATS_KEY, undefined, { revalidate: true });
  }, [mutateGlobal, mutateList]);

  const handlePatch = useCallback(
    async (id: string, patch: ProjectListPatch) => {
      const before = data ?? [];
      const stamp = new Date().toISOString();

      const optimistic = before.filter((row) => {
        if (row.id !== id) return true;
        if (patch.dashboard_visible === false && view === "active") return false;
        if (patch.archived_at === true && view !== "archived") return false;
        if (patch.archived_at === null && view === "archived") return false;
        if (patch.dashboard_visible === true && view === "hidden") return false;
        return true;
      });

      void mutateList(optimistic, { revalidate: false });

      const apiPatch: Parameters<typeof patchProject>[1] = {};
      if (patch.dashboard_visible !== undefined) {
        apiPatch.dashboard_visible = patch.dashboard_visible;
      }
      if (patch.archived_at === true) {
        apiPatch.archived_at = stamp;
      } else if (patch.archived_at !== undefined) {
        apiPatch.archived_at = patch.archived_at;
      }

      const result = await patchProject(id, apiPatch);
      if (!result.ok) {
        void mutateList(before, { revalidate: false });
        toast.error("Update failed", result.error ?? "Please try again.");
        return;
      }

      await revalidateAllLists();

      if (patch.dashboard_visible === false) {
        toast.success("Hidden from dashboard", "Find it under Hidden tab anytime.");
      } else if (patch.dashboard_visible === true) {
        toast.success("Restored to dashboard", "Project is back on the home view.");
      }
      if (patch.archived_at === true) {
        toast.success("Archived", "Project moved to Archived. Restore anytime.");
      } else if (patch.archived_at === null) {
        toast.success("Restored", "Project is back in the active pipeline.");
      }
    },
    [data, mutateList, revalidateAllLists, toast, view]
  );

  async function confirmDeleteProject() {
    if (!deleteProjectTarget) return;
    const id = deleteProjectTarget.id;
    const prev = data ?? [];
    setDeleteProjectTarget(null);
    void mutateList(prev.filter((r) => r.id !== id), { revalidate: false });
    try {
      const r = await fetch(`/api/pipeline/${id}`, { method: "DELETE" });
      const j = (await r.json()) as { ok?: boolean; error?: string };
      if (!j.ok) throw new Error(j.error || "Delete failed");
      await revalidateAllLists();
      toast.success(t("projects_projectDeleted"), t("projects_projectDeletedSub"));
    } catch (e) {
      void mutateList(prev, { revalidate: false });
      toast.error(
        t("projects_projectDeleteFailed"),
        e instanceof Error ? e.message : "Please try again."
      );
    }
  }

  function onSubmitProjectEdit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setProjError("");
    if (!editProject) return;
    const progress = Number(projForm.install_progress);
    if (Number.isNaN(progress) || progress < 0 || progress > 100) {
      setProjError(t("customers_fillRequired"));
      return;
    }
    void (async () => {
      try {
        const r = await fetch(`/api/pipeline/${editProject.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            official_name: projForm.official_name.trim(),
            detail: projForm.detail.trim(),
            capacity_kw: projForm.capacity_kw.trim(),
            next_action: projForm.next_action.trim() || null,
            install_progress: progress,
            status: projForm.status,
          }),
        });
        const j = (await r.json()) as { ok?: boolean; error?: string };
        if (!j.ok) throw new Error(j.error || "Could not update project");
        await revalidateAllLists();
        closeProjectEditModal();
        toast.success(t("projects_projectUpdated"), t("projects_projectUpdatedSub"));
      } catch (e) {
        toast.error(
          t("projects_projectUpdateFailed"),
          e instanceof Error ? e.message : "Please try again."
        );
      }
    })();
  }

  const counts: Record<ProjectsView, number> = {
    active: activeRows?.length ?? 0,
    hidden: hiddenRows?.length ?? 0,
    archived: archivedRows?.length ?? 0,
  };

  const activeTabDef = TAB_DEFS.find((tab) => tab.id === view) ?? TAB_DEFS[0];
  const showEmpty = !isLoading && !error && listPipeline.items.length === 0;
  const hasRawData = (data?.length ?? 0) > 0;

  return (
    <>
      <WorkspacePage tone="projects">
        <WorkspaceStaggerItem>
          <WorkspacePageHero
            tone="projects"
            eyebrow={t("projects_opsModuleTag")}
            title={t("projects_opsPipelineTitle")}
            subtitle={t("projects_opsPipelineSub")}
            footer={<WorkflowLifecycleStrip surface="projects" />}
          />
        </WorkspaceStaggerItem>

        <WorkspaceStaggerItem>
          <ProjectOpsDashboard
            stats={opsStats}
            projects={activeRows}
            loading={opsStatsLoading}
          />
        </WorkspaceStaggerItem>

        <WorkspaceStaggerItem>
          <div
            role="tablist"
            aria-label="Projects view"
            className="workspace-filter-rail workspace-filter-rail--compact-mobile"
          >
            {TAB_DEFS.map((tab) => {
              const isActive = view === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  type="button"
                  onClick={() => setView(tab.id)}
                  className={cn(
                    "workspace-filter-pill min-w-0 flex-1 justify-center max-sm:flex-col max-sm:gap-0 max-sm:px-0.5 max-sm:py-1 max-sm:text-[8px] sm:min-w-fit sm:flex-row sm:gap-1.5 sm:py-2 sm:text-sm",
                    isActive ? "workspace-filter-pill--active" : "workspace-filter-pill--idle"
                  )}
                >
                  <span className="truncate leading-tight sm:hidden">{tab.shortLabel}</span>
                  <span className="hidden truncate sm:inline">{tab.fallback}</span>
                  <span
                    className={cn(
                      "inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[9px] tabular-nums max-sm:h-3.5 max-sm:min-w-[0.875rem] max-sm:text-[8px] sm:h-5 sm:min-w-[1.25rem] sm:px-1.5 sm:text-[10px]",
                      isActive
                        ? "bg-white/25 text-white"
                        : "bg-slate-200/80 text-slate-700 dark:bg-slate-800/80 dark:text-slate-200"
                    )}
                  >
                    {counts[tab.id]}
                  </span>
                </button>
              );
            })}
          </div>
        </WorkspaceStaggerItem>

        <p className="page-lite-item -mt-1 hidden px-1 text-xs font-semibold text-slate-500 dark:text-slate-400 sm:block sm:text-sm">
          {view === "active" ? t("projects_opsBoardHint") : activeTabDef.description}
        </p>

        <ProjectListFiltersBar
          filters={filters}
          onChange={updateFilters}
          totalCount={data?.length ?? 0}
          filteredCount={listPipeline.filtered.length}
        />

        {error ? (
          <Card className="page-lite-item border-red-200/90 bg-red-50/90 dark:border-red-900/50 dark:bg-red-950/30">
            <CardContent className="p-4">
              <p className="text-sm font-extrabold text-red-800 dark:text-red-200">
                Could not load projects
              </p>
              <p className="mt-1 text-xs font-medium text-red-700 dark:text-red-300">
                {error instanceof Error ? error.message : t("projects_pipelineLoadErr")}
              </p>
              <button
                type="button"
                className="mt-3 rounded-lg bg-red-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-800"
                onClick={() => void mutateList()}
              >
                Retry
              </button>
            </CardContent>
          </Card>
        ) : null}

        {isLoading && !data ? <ProjectListSkeleton count={6} /> : null}

        {showEmpty && !hasRawData ? (
          <ProjectListEmpty
            title={
              view === "active"
                ? t("projects_pipelineEmpty")
                : view === "hidden"
                  ? t("projects_hiddenEmpty")
                  : t("projects_archivedEmpty")
            }
          />
        ) : null}

        {showEmpty && hasRawData ? (
          <ProjectListEmpty
            title="No projects match your filters"
            description="Try clearing search or changing stage / health filters."
          />
        ) : null}

        {!isLoading && listPipeline.items.length > 0 ? (
          <>
            <ProjectListTable
              projects={listPipeline.items}
              view={view}
              onPatch={handlePatch}
              onEdit={openEditProject}
              onDelete={setDeleteProjectTarget}
            />
            <div className="page-lite-item space-y-1.5 max-sm:space-y-1 lg:hidden sm:space-y-3">
              {listPipeline.items.map((project) => (
                <ProjectListCard
                  key={project.id}
                  project={project}
                  view={view}
                  onPatch={handlePatch}
                  onEdit={openEditProject}
                  onDelete={setDeleteProjectTarget}
                />
              ))}
            </div>
            <ProjectListPagination
              page={listPipeline.page}
              totalPages={listPipeline.totalPages}
              total={listPipeline.filtered.length}
              onPageChange={(page) => updateFilters({ page })}
            />
          </>
        ) : null}
      </WorkspacePage>

      {projectModal === "edit" && editProject ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-[12px] sm:items-center sm:p-4">
          <div className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/55 bg-[hsl(var(--card))/0.96] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_30px_70px_-26px_rgba(15,23,42,0.48)] sm:max-h-[90vh] sm:pb-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-base font-extrabold text-brand-800 sm:text-lg">
                {t("projects_editProjectTitle")}
              </h3>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-200"
                onClick={closeProjectEditModal}
                aria-label={t("actions_close")}
              >
                ×
              </button>
            </div>
            <form className="space-y-2.5 sm:space-y-3" onSubmit={onSubmitProjectEdit}>
              <p className="text-[11px] font-semibold text-slate-600">
                <span className="text-slate-500">{t("projects_leadContactReadonly")}: </span>
                {formatPipelineDisplayName(editProject.official_name, editProject.lead_name)}
              </p>
              {editProject.lead_id ? (
                <Link
                  href={buildProposalEditHref({
                    leadId: editProject.lead_id,
                    proposalId: editProject.primary_proposal_id,
                  })}
                  className="mb-1 flex min-h-10 items-center justify-center gap-2 rounded-xl border border-teal-300 bg-teal-50 px-3 text-xs font-extrabold text-teal-900 shadow-sm transition hover:bg-teal-100 dark:border-teal-500/45 dark:bg-teal-950/40 dark:text-teal-100"
                  onClick={() => closeProjectEditModal()}
                >
                  <Send className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                  {t("projects_resumeProposal")}
                </Link>
              ) : null}
              <FloatingLabelInput
                label={t("projects_labelOfficialName")}
                containerClassName="my-4"
                className={modalFloatingClass}
                value={projForm.official_name}
                onChange={(e) => setProjForm((p) => ({ ...p, official_name: e.target.value }))}
              />
              <FloatingLabelInput
                label={t("projects_labelDetail")}
                containerClassName="my-4"
                className={modalFloatingClass}
                value={projForm.detail}
                onChange={(e) => setProjForm((p) => ({ ...p, detail: e.target.value }))}
              />
              <FloatingLabelInput
                label={t("projects_capacityLabel")}
                containerClassName="my-4"
                className={modalFloatingClass}
                value={projForm.capacity_kw}
                onChange={(e) => setProjForm((p) => ({ ...p, capacity_kw: e.target.value }))}
              />
              <FloatingLabelInput
                label={t("projects_labelNextAction")}
                containerClassName="my-4"
                className={modalFloatingClass}
                value={projForm.next_action}
                onChange={(e) => setProjForm((p) => ({ ...p, next_action: e.target.value }))}
              />
              <FloatingLabelInput
                label={t("projects_labelProgress")}
                containerClassName="my-4"
                className={modalFloatingClass}
                type="number"
                min={0}
                max={100}
                value={projForm.install_progress}
                onChange={(e) => setProjForm((p) => ({ ...p, install_progress: e.target.value }))}
              />
              <FloatingLabelSelect
                suppressHydrationWarning
                label={t("projects_formBoardStatus")}
                containerClassName="my-4"
                className={modalFloatingClass}
                value={projForm.status}
                onChange={(e) =>
                  setProjForm((p) => ({ ...p, status: e.target.value as ProjectEditStatus }))
                }
              >
                <option value="pending">{t("projects_statusPending")}</option>
                <option value="active">{t("projects_statusActive")}</option>
                <option value="done">{t("projects_statusDone")}</option>
              </FloatingLabelSelect>
              {projError ? <p className="text-sm font-semibold text-red-600">{projError}</p> : null}
              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-4 py-3 text-sm font-extrabold text-white shadow-[0_14px_30px_-16px_rgba(20,184,166,0.9)] transition-all hover:brightness-105"
              >
                {t("projects_saveProjectChanges")}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {deleteProjectTarget ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-project-title"
            className="w-full max-w-sm rounded-2xl border border-white/50 bg-[hsl(var(--card))] p-5 shadow-xl"
          >
            <h3 id="delete-project-title" className="text-base font-extrabold text-brand-900">
              {t("projects_deleteConfirmTitle")}
            </h3>
            <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">
              {t("projects_deleteConfirmBody", {
                name: formatPipelineDisplayName(
                  deleteProjectTarget.official_name,
                  deleteProjectTarget.lead_name
                ),
              })}
            </p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
                onClick={() => setDeleteProjectTarget(null)}
              >
                {t("projects_deleteCancel")}
              </button>
              <button
                type="button"
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-red-700"
                onClick={() => void confirmDeleteProject()}
              >
                {t("projects_deleteConfirmCta")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense
      fallback={
        <div className="ss-page-shell">
          <Card className="page-lite-item border-brand-100 bg-brand-50/30 p-6">
            <Skeleton className="h-5 w-40 rounded-md" />
            <Skeleton className="mt-3 h-3 w-72 rounded-md" />
            <ProjectListSkeleton count={4} />
          </Card>
        </div>
      }
    >
      <ProjectsBoard />
    </Suspense>
  );
}
