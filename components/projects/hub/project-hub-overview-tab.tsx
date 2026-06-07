"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProjectListItem } from "@/lib/project-api-client";
import { formatInrCompact } from "@/lib/proposal-hub-insights";
import { cn } from "@/lib/utils";
import {
  ArrowUpRight,
  Building2,
  CircleDollarSign,
  ExternalLink,
  MapPin,
  Phone,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import { buildProposalEditHref } from "@/lib/proposal-edit-url";
import type { ReactNode } from "react";
import { ProjectContractValueForm } from "@/components/projects/hub/project-contract-value-form";
import { ProjectHubOverviewDocuments } from "@/components/projects/hub/project-hub-overview-documents";

const ROOF_LABELS: Record<string, string> = {
  rcc: "RCC",
  tin: "Tin",
  metal: "Metal",
  asbestos: "Asbestos",
  terrace: "Terrace",
  ground: "Ground",
  other: "Other",
};

const SYSTEM_LABELS: Record<string, string> = {
  on_grid: "On-grid",
  off_grid: "Off-grid",
  hybrid: "Hybrid",
};

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

function labelOrDash(
  value: string | null | undefined,
  labels?: Record<string, string>
): string {
  if (!value?.trim()) return "—";
  return labels?.[value] ?? value.replace(/_/g, " ");
}

function SummaryCell({
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
        "min-w-0 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5 dark:border-white/5 dark:bg-white/[0.04]",
        className
      )}
    >
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-extrabold tabular-nums text-slate-900 dark:text-slate-50">
        {value}
      </p>
    </div>
  );
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

export function ProjectHubOverviewTab({ project }: { project: ProjectListItem }) {
  const siteLine =
    project.site_address?.trim() ||
    [project.lead_city?.trim()].filter(Boolean).join(", ") ||
    null;
  const capacity =
    project.capacity_kw?.trim() ||
    (project.panel_count != null ? `${project.panel_count} panels` : null);
  const proposalHref = buildProposalEditHref({
    leadId: project.lead_id,
    proposalId: project.primary_proposal_id,
  });

  return (
    <div
      id="project-hub-panel-overview"
      role="tabpanel"
      aria-labelledby="project-hub-tab-overview"
      className="space-y-4"
    >
      {(project.lead_id || project.lead_name) && (
        <Card className="page-lite-item border-slate-200/90 dark:border-white/10">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Linked records
              </p>
              <p className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-100">
                {project.lead_name?.trim() || "Customer lead"}
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
                    <Link href={proposalHref}>
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                      Open proposal
                      <ArrowUpRight className="h-3 w-3 opacity-60" aria-hidden />
                    </Link>
                  </Button>
                </>
              ) : null}
            </div>
          </CardContent>
        </Card>
      )}

      <ProjectHubOverviewDocuments project={project} />

      <Card className="page-lite-item border-slate-200/90 dark:border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
            <CircleDollarSign className="h-4 w-4 text-teal-600 dark:text-teal-400" aria-hidden />
            Financial summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCell
              label="Stored contract"
              value={formatInrCompact(project.stored_contract_amount_inr)}
            />
            <SummaryCell
              label="Suggested (proposal)"
              value={formatInrCompact(project.proposal_suggested_contract_inr)}
            />
            <SummaryCell
              label="Pending"
              value={
                project.pending_inr != null ? formatInrCompact(project.pending_inr) : "—"
              }
              className={
                project.pending_inr != null && project.pending_inr > 0
                  ? "border-amber-200/80 bg-amber-50/60 dark:border-amber-500/20 dark:bg-amber-950/20"
                  : undefined
              }
            />
            <SummaryCell
              label="Received"
              value={formatInrCompact(project.amount_received_inr ?? 0)}
            />
          </div>

          <ProjectContractValueForm project={project} />

          <SummaryCell
            label="Next due date"
            value={formatHubDate(project.target_completion)}
            className="max-w-xs"
          />
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Subsidy:{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {project.has_subsidy ? "Eligible" : "Not flagged"}
            </span>
            <span className="text-slate-400 dark:text-slate-500">
              {" "}
              · Pending uses stored contract only · Target completion is due-date proxy
            </span>
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="page-lite-item border-slate-200/90 dark:border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
              <Users className="h-4 w-4 text-sky-600 dark:text-sky-400" aria-hidden />
              Team
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <DetailRow
              label="Project manager"
              value={
                <span className="inline-flex flex-col items-end gap-0.5">
                  <span>{project.manager_name?.trim() || "—"}</span>
                  {project.manager_phone?.trim() ? (
                    <span className="inline-flex items-center gap-1 font-normal text-slate-500 dark:text-slate-400">
                      <Phone className="h-3 w-3" aria-hidden />
                      {project.manager_phone}
                    </span>
                  ) : null}
                </span>
              }
            />
            <DetailRow
              label="Technician"
              value={
                <span className="inline-flex flex-col items-end gap-0.5">
                  <span>{project.tech_name?.trim() || "—"}</span>
                  {project.tech_phone?.trim() ? (
                    <span className="inline-flex items-center gap-1 font-normal text-slate-500 dark:text-slate-400">
                      <Phone className="h-3 w-3" aria-hidden />
                      {project.tech_phone}
                    </span>
                  ) : null}
                </span>
              }
            />
            <DetailRow label="Start date" value={formatHubDate(project.start_date)} />
          </CardContent>
        </Card>

        <Card className="page-lite-item border-slate-200/90 dark:border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
              <Building2 className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden />
              Site & system
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <DetailRow
              label="Site"
              value={
                siteLine ? (
                  <span className="inline-flex items-start justify-end gap-1">
                    <MapPin className="mt-0.5 h-3 w-3 shrink-0 opacity-60" aria-hidden />
                    <span className="text-left">{siteLine}</span>
                  </span>
                ) : (
                  "—"
                )
              }
            />
            <DetailRow label="Capacity" value={capacity || "—"} />
            <DetailRow
              label="System type"
              value={labelOrDash(project.system_type, SYSTEM_LABELS)}
            />
            <DetailRow label="Roof type" value={labelOrDash(project.roof_type, ROOF_LABELS)} />
            <DetailRow
              label="Structure"
              value={labelOrDash(project.structure_type, STRUCTURE_LABELS)}
            />
            <DetailRow label="Panels" value={project.panel_brand?.trim() || "—"} />
            <DetailRow label="Inverter" value={project.inverter_brand?.trim() || "—"} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
