"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { revalidateProjectHubCaches } from "@/lib/project-hub-cache";
import {
  fetchProjectSurvey,
  projectSurveyKey,
  type ProjectListItem,
  type ProjectSurvey,
} from "@/lib/project-api-client";
import { buildProposalEditHref } from "@/lib/proposal-edit-url";
import { cn } from "@/lib/utils";
import {
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  MapPin,
  RefreshCw,
  Ruler,
  User,
  Zap,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import useSWR from "swr";
import { ProjectSurveyPhotosSection } from "@/components/projects/hub/project-survey-photos";

const ROOF_LABELS: Record<string, string> = {
  rcc: "RCC",
  tin: "Tin",
  metal: "Metal",
  asbestos: "Asbestos",
  terrace: "Terrace",
  ground: "Ground",
  other: "Other",
};

const ROOF_CONDITION_LABELS: Record<string, string> = {
  good: "Good",
  minor_repair: "Minor repair needed",
  major_repair: "Major repair needed",
  not_suitable: "Not suitable",
};

const ROOF_ORIENTATION_LABELS: Record<string, string> = {
  south: "South-facing",
  east_west: "East–west",
  flat: "Flat",
  north: "North-facing",
  other: "Other",
};

const METER_TYPE_LABELS: Record<string, string> = {
  single_phase: "Single phase",
  three_phase: "Three phase",
  ltct: "LTCT",
  htct: "HTCT",
  other: "Other",
};

const CATEGORY_LABELS: Record<string, string> = {
  residential: "Residential",
  commercial: "Commercial",
  industrial: "Industrial",
  agricultural: "Agricultural",
  institutional: "Institutional",
  other: "Other",
};

function formatHubDate(iso: string | null | undefined): string {
  if (!iso?.trim()) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function labelOrDash(
  value: string | null | undefined,
  labels?: Record<string, string>
): string {
  if (!value?.trim()) return "—";
  return labels?.[value] ?? value.replace(/_/g, " ");
}

function formatNum(value: number | null | undefined, suffix = ""): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${value.toLocaleString("en-IN")}${suffix}`;
}

function formatBool(value: boolean | null | undefined): string {
  if (value == null) return "—";
  return value ? "Yes" : "No";
}

function formatGps(lat: number | null | undefined, lng: number | null | undefined): string {
  if (lat == null || lng == null) return "—";
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
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

function SurveySection({
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
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}

function LinkedRecordsCard({ project }: { project: ProjectListItem }) {
  if (!project.lead_id && !project.lead_name) return null;
  const proposalHref = buildProposalEditHref({
    leadId: project.lead_id,
    proposalId: project.primary_proposal_id,
  });

  return (
    <Card className="page-lite-item border-slate-200/90 dark:border-white/10">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Linked records
          </p>
          <p className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-100">
            {project.lead_name?.trim() || "Customer lead"}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Site photos and bills may be attached on the CRM customer record.
          </p>
        </div>
        {project.lead_id ? (
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" className="gap-1.5" asChild>
              <Link href={`/customers/${encodeURIComponent(project.lead_id)}`}>
                <User className="h-3.5 w-3.5" aria-hidden />
                Open CRM
                <ArrowUpRight className="h-3 w-3 opacity-60" aria-hidden />
              </Link>
            </Button>
            <Button type="button" variant="outline" size="sm" className="gap-1.5" asChild>
              <Link href={proposalHref}>
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                Open proposal
                <ArrowUpRight className="h-3 w-3 opacity-60" aria-hidden />
              </Link>
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function SurveyStatusStrip({
  survey,
  project,
}: {
  survey: ProjectSurvey | null;
  project: ProjectListItem;
}) {
  const recorded = Boolean(survey?.survey_date || survey?.updated_at);

  return (
    <Card className="page-lite-item border-slate-200/90 dark:border-white/10">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Ruler className="h-4 w-4 text-sky-600 dark:text-sky-400" aria-hidden />
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
              recorded
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
            )}
          >
            {recorded ? (
              <>
                <CheckCircle2 className="h-3 w-3" aria-hidden />
                Survey recorded
              </>
            ) : (
              <>
                <Clock className="h-3 w-3" aria-hidden />
                Survey not submitted
              </>
            )}
          </span>
          {survey?.survey_date ? (
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Site visit: {formatHubDate(survey.survey_date)}
            </span>
          ) : null}
          {project.current_stage === "survey" ? (
            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600 dark:bg-white/10 dark:text-slate-300">
              Active survey stage
            </span>
          ) : null}
        </div>
        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
          Read-only view · POST/PATCH survey APIs available for future editor
        </p>
      </CardContent>
    </Card>
  );
}

function SurveyEmptyState({ project }: { project: ProjectListItem }) {
  return (
    <Card className="page-lite-item border-dashed border-slate-200 dark:border-white/10">
      <CardContent className="px-3 py-3 text-center max-sm:py-2.5 sm:px-4 sm:py-8">
        <Ruler className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" aria-hidden />
        <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
          No site survey on file
        </p>
        <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          Survey data will appear here once a site visit is recorded. Check linked CRM files or
          continue sizing in the proposal workspace.
        </p>
        {project.site_address?.trim() || project.lead_city?.trim() ? (
          <p className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-400">
            <MapPin className="h-3.5 w-3.5" aria-hidden />
            Project site hint: {project.site_address?.trim() || project.lead_city}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function SurveyDataView({ survey }: { survey: ProjectSurvey }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <SurveySection
        title="Survey details"
        icon={<FileText className="h-4 w-4 text-sky-600 dark:text-sky-400" aria-hidden />}
      >
        <DetailRow label="Survey date" value={formatHubDate(survey.survey_date)} />
        <DetailRow
          label="Surveyed by"
          value={
            survey.surveyed_by_id
              ? `ID ${survey.surveyed_by_id.slice(0, 8)}…`
              : "—"
          }
        />
        <DetailRow
          label="Project category"
          value={labelOrDash(survey.project_category, CATEGORY_LABELS)}
        />
        <DetailRow label="Structure floor" value={formatNum(survey.structure_floor)} />
        <DetailRow label="Last updated" value={formatHubDate(survey.updated_at)} />
      </SurveySection>

      <SurveySection
        title="Site information"
        icon={<MapPin className="h-4 w-4 text-teal-600 dark:text-teal-400" aria-hidden />}
      >
        <DetailRow
          label="Site address"
          value={
            survey.site_address?.trim() ? (
              <span className="inline-flex items-start justify-end gap-1 text-left">
                <MapPin className="mt-0.5 h-3 w-3 shrink-0 opacity-60" aria-hidden />
                {survey.site_address}
              </span>
            ) : (
              "—"
            )
          }
        />
        <DetailRow label="GPS coordinates" value={formatGps(survey.gps_lat, survey.gps_lng)} />
        <DetailRow
          label="Available area"
          value={formatNum(survey.available_area_sqft, " sq ft")}
        />
        <DetailRow
          label="Proposed capacity"
          value={formatNum(survey.proposed_capacity_kw, " kW")}
        />
        <DetailRow
          label="Annual irradiation"
          value={formatNum(survey.annual_irradiation, " kWh/m²")}
        />
      </SurveySection>

      <SurveySection
        title="Roof details"
        icon={<Building2 className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden />}
      >
        <DetailRow label="Roof type" value={labelOrDash(survey.roof_type, ROOF_LABELS)} />
        <DetailRow label="Roof area" value={formatNum(survey.roof_area_sqft, " sq ft")} />
        <DetailRow
          label="Shadow-free area"
          value={formatNum(survey.shadow_free_sqft, " sq ft")}
        />
        <DetailRow label="Roof height" value={formatNum(survey.roof_height_ft, " ft")} />
        <DetailRow
          label="Roof condition"
          value={labelOrDash(survey.roof_condition, ROOF_CONDITION_LABELS)}
        />
        <DetailRow
          label="Orientation"
          value={labelOrDash(survey.roof_orientation, ROOF_ORIENTATION_LABELS)}
        />
        {survey.shadow_analysis_note?.trim() ? (
          <div className="border-t border-slate-100 pt-2 dark:border-white/5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Shadow analysis
            </p>
            <p className="mt-1 text-xs font-medium leading-relaxed text-slate-700 dark:text-slate-300">
              {survey.shadow_analysis_note}
            </p>
          </div>
        ) : null}
      </SurveySection>

      <SurveySection
        title="Electrical details"
        icon={<Zap className="h-4 w-4 text-purple-600 dark:text-purple-400" aria-hidden />}
      >
        <DetailRow label="Consumer number" value={survey.consumer_number?.trim() || "—"} />
        <DetailRow label="Sanction load" value={formatNum(survey.sanction_load_kw, " kW")} />
        <DetailRow label="Connected load" value={formatNum(survey.connected_load_kw, " kW")} />
        <DetailRow
          label="Meter type"
          value={labelOrDash(survey.meter_type, METER_TYPE_LABELS)}
        />
        <DetailRow
          label="Transformer distance"
          value={formatNum(survey.transformer_distance_m, " m")}
        />
        <DetailRow label="Meter location" value={survey.meter_location?.trim() || "—"} />
        <DetailRow label="DB location" value={survey.db_location?.trim() || "—"} />
        <DetailRow label="Existing earthing" value={formatBool(survey.existing_earthing)} />
        <DetailRow label="DG set" value={formatBool(survey.has_dg)} />
        <DetailRow label="DG capacity" value={formatNum(survey.dg_kva, " kVA")} />
        <DetailRow label="Battery required" value={formatBool(survey.battery_required)} />
        <DetailRow
          label="Battery capacity"
          value={formatNum(survey.battery_capacity_kwh, " kWh")}
        />
        <DetailRow label="Existing inverter" value={formatBool(survey.existing_inverter)} />
        <DetailRow
          label="Inverter capacity"
          value={formatNum(survey.existing_inverter_kw, " kW")}
        />
      </SurveySection>

      {survey.special_notes?.trim() ? (
        <SurveySection
          title="Customer & site notes"
          icon={<FileText className="h-4 w-4 text-slate-600 dark:text-slate-400" aria-hidden />}
        >
          <p className="text-xs font-medium leading-relaxed text-slate-700 dark:text-slate-300">
            {survey.special_notes}
          </p>
        </SurveySection>
      ) : null}
    </div>
  );
}

function SurveySkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-16 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
    </div>
  );
}

export function ProjectHubSurveyTab({
  project,
  enabled,
}: {
  project: ProjectListItem;
  enabled: boolean;
}) {
  const surveyKey = enabled ? projectSurveyKey(project.id) : null;

  const {
    data: survey,
    error,
    isLoading,
    isValidating,
    mutate: mutateSurvey,
  } = useSWR(surveyKey, fetchProjectSurvey, {
    revalidateOnFocus: false,
    dedupingInterval: 3_000,
  });

  const refresh = async () => {
    await revalidateProjectHubCaches(project.id);
    await mutateSurvey();
  };

  if (!enabled) return null;

  if (isLoading && survey === undefined) {
    return (
      <div id="project-hub-panel-survey" role="tabpanel" aria-labelledby="project-hub-tab-survey">
        <SurveySkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <Card
        id="project-hub-panel-survey"
        role="tabpanel"
        aria-labelledby="project-hub-tab-survey"
        className="border-red-200/90 bg-red-50/90 dark:border-red-900/50 dark:bg-red-950/30"
      >
        <CardContent className="space-y-3 p-5">
          <p className="text-sm font-extrabold text-red-800 dark:text-red-200">
            Could not load survey
          </p>
          <Button type="button" size="sm" variant="outline" onClick={() => void refresh()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const hasSurvey = survey != null;

  return (
    <div
      id="project-hub-panel-survey"
      role="tabpanel"
      aria-labelledby="project-hub-tab-survey"
      className="space-y-4"
    >
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
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
      <SurveyStatusStrip survey={survey ?? null} project={project} />
      <ProjectSurveyPhotosSection projectId={project.id} enabled />

      {hasSurvey ? <SurveyDataView survey={survey} /> : <SurveyEmptyState project={project} />}
    </div>
  );
}
