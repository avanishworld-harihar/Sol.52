"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { revalidateProjectHubCaches } from "@/lib/project-hub-cache";
import {
  fetchProjectDesigns,
  projectDesignsKey,
  type ProjectDesign,
  type ProjectListItem,
} from "@/lib/project-api-client";
import { cn } from "@/lib/utils";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Cpu,
  ExternalLink,
  Layers,
  PenTool,
  RefreshCw,
  Sun,
  User,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import useSWR from "swr";

const STRUCTURE_LABELS: Record<string, string> = {
  elevated: "Elevated",
  flush: "Flush mount",
  ground_mount: "Ground mount",
  other: "Other",
};

function formatHubDate(iso: string | null | undefined): string {
  if (!iso?.trim()) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatNum(value: number | null | undefined, suffix = ""): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${value.toLocaleString("en-IN")}${suffix}`;
}

function labelOrDash(value: string | null | undefined, labels?: Record<string, string>): string {
  if (!value?.trim()) return "—";
  return labels?.[value] ?? value.replace(/_/g, " ");
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-3 border-b border-slate-100 py-2 last:border-0 dark:border-white/5">
      <span className="shrink-0 text-xs font-medium text-slate-500 dark:text-slate-400">
        {label}
      </span>
      <span className="min-w-0 text-right text-xs font-semibold text-slate-800 dark:text-slate-100">
        {value}
      </span>
    </div>
  );
}

function DesignSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="page-lite-item border-slate-200/90 dark:border-white/10">
      <CardHeader className="pb-1 max-sm:px-3 max-sm:py-2 sm:pb-2">
        <CardTitle className="flex items-center gap-1.5 text-xs font-extrabold sm:gap-2 sm:text-sm">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}

function LinkedRecordsCard({ project }: { project: ProjectListItem }) {
  return (
    <Card className="page-lite-item border-slate-200/90 dark:border-white/10">
      <CardContent className="flex flex-col gap-2 p-3 max-sm:p-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:p-4">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Design sources
          </p>
          <p className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-100">
            {project.lead_name?.trim() || projectDisplayFallback(project)}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Final BOM and pricing live in the proposal workspace until a design version is saved
            here.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {project.lead_id ? (
            <>
              <Button type="button" variant="outline" size="sm" className="gap-1.5" asChild>
                <Link href={`/customers/${encodeURIComponent(project.lead_id)}`}>
                  <User className="h-3.5 w-3.5" aria-hidden />
                  Open CRM
                  <ArrowUpRight className="h-3 w-3 opacity-60" aria-hidden />
                </Link>
              </Button>
              <Button type="button" variant="outline" size="sm" className="gap-1.5" asChild>
                <Link href={`/proposal?leadId=${encodeURIComponent(project.lead_id)}`}>
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  Open proposal
                  <ArrowUpRight className="h-3 w-3 opacity-60" aria-hidden />
                </Link>
              </Button>
              <Button type="button" variant="outline" size="sm" className="gap-1.5" asChild>
                <Link href={`/proposal?leadId=${encodeURIComponent(project.lead_id)}#bom`}>
                  <Layers className="h-3.5 w-3.5" aria-hidden />
                  Open BOM workspace
                  <ArrowUpRight className="h-3 w-3 opacity-60" aria-hidden />
                </Link>
              </Button>
            </>
          ) : (
            <Button type="button" variant="outline" size="sm" className="gap-1.5" asChild>
              <Link href="/proposals">
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                Open proposals hub
                <ArrowUpRight className="h-3 w-3 opacity-60" aria-hidden />
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function projectDisplayFallback(project: ProjectListItem): string {
  return project.official_name?.trim() || "Project";
}

function DesignStatusStrip({
  designs,
  project,
  selected,
}: {
  designs: ProjectDesign[];
  project: ProjectListItem;
  selected: ProjectDesign | null;
}) {
  const hasDesign = designs.length > 0;

  return (
    <Card className="page-lite-item border-slate-200/90 dark:border-white/10">
      <CardContent className="flex flex-col gap-2 p-3 max-sm:p-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-1.5 max-sm:gap-1 sm:gap-2">
          <PenTool className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 sm:h-4 sm:w-4" aria-hidden />
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
              hasDesign
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
            )}
          >
            {hasDesign ? (
              <>
                <CheckCircle2 className="h-3 w-3" aria-hidden />
                Design on file
              </>
            ) : (
              <>
                <Clock className="h-3 w-3" aria-hidden />
                No design version
              </>
            )}
          </span>
          {selected?.is_current ? (
            <span className="rounded-md bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">
              Current version
            </span>
          ) : null}
          {hasDesign ? (
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              {designs.length} version{designs.length === 1 ? "" : "s"}
              {selected?.version_label ? ` · ${selected.version_label}` : ""}
            </span>
          ) : null}
          {project.current_stage === "design" ? (
            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600 dark:bg-white/10 dark:text-slate-300">
              Active design stage
            </span>
          ) : null}
        </div>
        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 max-sm:leading-snug sm:text-[11px]">
          Read-only view · POST design API available for future editor
        </p>
      </CardContent>
    </Card>
  );
}

function DesignEmptyState({ project }: { project: ProjectListItem }) {
  const capacityHint =
    project.capacity_kw?.trim() ||
    (project.panel_count != null ? `${project.panel_count} panels` : null);

  return (
    <Card className="page-lite-item border-dashed border-slate-200 dark:border-white/10">
      <CardContent className="px-3 py-5 text-center max-sm:py-4 sm:px-4 sm:py-8">
        <PenTool className="mx-auto h-7 w-7 text-slate-300 dark:text-slate-600 sm:h-9 sm:w-9" aria-hidden />
        <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200 sm:mt-3">
          No design version saved
        </p>
        <p className="mx-auto mt-1 max-w-md text-[11px] leading-snug text-slate-500 dark:text-slate-400 sm:text-xs sm:leading-relaxed">
          Layout, panel, and inverter selections from the proposal BOM can be captured as a design
          version here. Continue sizing in the proposal workspace linked above.
        </p>
        {capacityHint || project.panel_brand || project.inverter_brand ? (
          <div className="mx-auto mt-4 max-w-sm rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2 text-left text-xs dark:border-white/5 dark:bg-white/[0.04]">
            <p className="font-bold uppercase tracking-wide text-slate-400">Project hints</p>
            {capacityHint ? (
              <p className="mt-1 font-medium text-slate-700 dark:text-slate-300">
                Capacity: {capacityHint}
              </p>
            ) : null}
            {project.panel_brand?.trim() ? (
              <p className="font-medium text-slate-700 dark:text-slate-300">
                Panels: {project.panel_brand}
              </p>
            ) : null}
            {project.inverter_brand?.trim() ? (
              <p className="font-medium text-slate-700 dark:text-slate-300">
                Inverter: {project.inverter_brand}
              </p>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function CapacitySummary({ design }: { design: ProjectDesign }) {
  const impliedDcKw =
    design.panel_count != null && design.panel_watt != null
      ? (design.panel_count * design.panel_watt) / 1000
      : null;

  return (
    <Card className="page-lite-item border-slate-200/90 dark:border-white/10">
      <CardContent className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "System size", value: formatNum(design.system_kw, " kW") },
          { label: "DC capacity", value: formatNum(impliedDcKw, " kW") },
          { label: "Annual yield", value: formatNum(design.annual_yield_kwh, " kWh") },
          {
            label: "Performance ratio",
            value:
              design.performance_ratio != null
                ? `${(design.performance_ratio * 100).toFixed(1)}%`
                : "—",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-slate-100 bg-slate-50/80 px-2.5 py-1.5 dark:border-white/5 dark:bg-white/[0.04] max-sm:px-2 max-sm:py-1 sm:px-3 sm:py-2.5"
          >
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              {item.label}
            </p>
            <p className="mt-0.5 text-sm font-extrabold tabular-nums text-slate-900 dark:text-slate-50">
              {item.value}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function DesignDataView({ design }: { design: ProjectDesign }) {
  const hasStringInfo =
    design.string_count != null || design.modules_per_string != null;

  return (
    <div className="space-y-4">
      <CapacitySummary design={design} />

      <div className="grid gap-4 lg:grid-cols-2">
        <DesignSection
          title="System configuration"
          icon={<Cpu className="h-4 w-4 text-sky-600 dark:text-sky-400" aria-hidden />}
        >
          <DetailRow label="Version" value={`V${design.version_number}`} />
          <DetailRow label="Label" value={design.version_label?.trim() || "—"} />
          <DetailRow
            label="Structure type"
            value={labelOrDash(design.structure_type, STRUCTURE_LABELS)}
          />
          <DetailRow label="Created" value={formatHubDate(design.created_at)} />
        </DesignSection>

        <DesignSection
          title="Panel information"
          icon={<Sun className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden />}
        >
          <DetailRow label="Panel model" value={design.panel_model?.trim() || "—"} />
          <DetailRow label="Panel count" value={formatNum(design.panel_count)} />
          <DetailRow label="Panel wattage" value={formatNum(design.panel_watt, " W")} />
        </DesignSection>

        <DesignSection
          title="Inverter information"
          icon={<Zap className="h-4 w-4 text-purple-600 dark:text-purple-400" aria-hidden />}
        >
          <DetailRow label="Inverter model" value={design.inverter_model?.trim() || "—"} />
          <DetailRow label="Inverter size" value={formatNum(design.inverter_kw, " kW")} />
        </DesignSection>

        {hasStringInfo ? (
          <DesignSection
            title="String & layout"
            icon={<Layers className="h-4 w-4 text-teal-600 dark:text-teal-400" aria-hidden />}
          >
            <DetailRow label="String count" value={formatNum(design.string_count)} />
            <DetailRow
              label="Modules per string"
              value={formatNum(design.modules_per_string)}
            />
          </DesignSection>
        ) : null}

        {design.revision_notes?.trim() ? (
          <DesignSection
            title="Design notes"
            icon={<PenTool className="h-4 w-4 text-slate-600 dark:text-slate-400" aria-hidden />}
          >
            <p className="text-xs font-medium leading-relaxed text-slate-700 dark:text-slate-300">
              {design.revision_notes}
            </p>
          </DesignSection>
        ) : null}
      </div>
    </div>
  );
}

function VersionPicker({
  designs,
  selectedId,
  onSelect,
}: {
  designs: ProjectDesign[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  if (designs.length <= 1) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {designs.map((d) => (
        <button
          key={d.id}
          type="button"
          onClick={() => onSelect(d.id)}
          className={cn(
            "rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition",
            selectedId === d.id
              ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900"
              : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-white/10 dark:text-slate-400"
          )}
        >
          V{d.version_number}
          {d.is_current ? " · current" : ""}
        </button>
      ))}
    </div>
  );
}

function DesignSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-16 rounded-xl" />
      <Skeleton className="h-24 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
    </div>
  );
}

export function ProjectHubDesignTab({
  project,
  enabled,
}: {
  project: ProjectListItem;
  enabled: boolean;
}) {
  const designsKey = enabled ? projectDesignsKey(project.id) : null;

  const {
    data: designs,
    error,
    isLoading,
    isValidating,
    mutate: mutateDesigns,
  } = useSWR(designsKey, fetchProjectDesigns, {
    revalidateOnFocus: false,
    dedupingInterval: 3_000,
  });

  const sortedDesigns = useMemo(() => {
    return [...(designs ?? [])].sort((a, b) => b.version_number - a.version_number);
  }, [designs]);

  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    if (!sortedDesigns.length) return;
    const valid = sortedDesigns.some((d) => d.id === selectedId);
    if (!valid) {
      setSelectedId(
        sortedDesigns.find((d) => d.is_current)?.id ?? sortedDesigns[0]!.id
      );
    }
  }, [sortedDesigns, selectedId]);

  const selectedDesign =
    sortedDesigns.find((d) => d.id === selectedId) ?? sortedDesigns[0] ?? null;

  const refresh = async () => {
    await revalidateProjectHubCaches(project.id);
    await mutateDesigns();
  };

  if (!enabled) return null;

  if (isLoading && !designs) {
    return (
      <div id="project-hub-panel-design" role="tabpanel" aria-labelledby="project-hub-tab-design">
        <DesignSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <Card
        id="project-hub-panel-design"
        role="tabpanel"
        aria-labelledby="project-hub-tab-design"
        className="border-red-200/90 bg-red-50/90 dark:border-red-900/50 dark:bg-red-950/30"
      >
        <CardContent className="space-y-3 p-5">
          <p className="text-sm font-extrabold text-red-800 dark:text-red-200">
            Could not load designs
          </p>
          <Button type="button" size="sm" variant="outline" onClick={() => void refresh()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const hasDesigns = sortedDesigns.length > 0;

  return (
    <div
      id="project-hub-panel-design"
      role="tabpanel"
      aria-labelledby="project-hub-tab-design"
      className="space-y-3 max-sm:space-y-2 sm:space-y-4"
    >
      <div className="flex flex-col gap-2 max-sm:gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        {hasDesigns ? (
          <VersionPicker
            designs={sortedDesigns}
            selectedId={selectedDesign?.id ?? selectedId}
            onSelect={setSelectedId}
          />
        ) : (
          <span />
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 self-start sm:self-auto"
          disabled={isValidating}
          onClick={() => void refresh()}
        >
          <RefreshCw
            className={cn("h-3.5 w-3.5", isValidating && "animate-spin")}
            aria-hidden
          />
          Refresh
        </Button>
      </div>

      <LinkedRecordsCard project={project} />
      <DesignStatusStrip
        designs={sortedDesigns}
        project={project}
        selected={selectedDesign}
      />

      {hasDesigns && selectedDesign ? (
        <DesignDataView design={selectedDesign} />
      ) : (
        <DesignEmptyState project={project} />
      )}
    </div>
  );
}
