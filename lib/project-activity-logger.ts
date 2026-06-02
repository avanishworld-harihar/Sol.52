/**
 * Sol.52 — Phase 3A Project Activity Logger.
 *
 * SERVER-ONLY helper. Inserts records into project_activity_log.
 * Every project write operation (stage advance, survey save, design version, etc.)
 * MUST call logProjectActivity() so the Project Hub timeline is always complete.
 *
 * Non-fatal: logging failures are console-error'd but never throw to callers.
 * NEVER import this in client components.
 */

import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { supabase } from "@/lib/supabase";

function db() {
  return createSupabaseAdmin() ?? supabase;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ProjectEventType =
  | "project_created"
  | "stage_changed"
  | "survey_submitted"
  | "design_created"
  | "design_revised"
  | "task_completed"
  | "installation_substage_done"
  | "document_uploaded"
  | "payment_recorded"
  | "subsidy_status_changed"
  | "nm_substatus_changed"
  | "comment_added"
  | "team_assigned"
  | "project_completed"
  | "project_archived"
  | "custom";

export interface LogProjectActivityInput {
  organizationId: string;
  projectId: string;
  eventType: ProjectEventType;
  eventTitle: string;
  eventDescription?: string | null;
  /** Structured payload — shape varies per eventType. See migration 036 comments. */
  metadata?: Record<string, unknown>;
  createdById?: string | null;
}

export interface ProjectActivityLogRow {
  id: string;
  organization_id: string;
  project_id: string;
  event_type: string;
  event_title: string;
  event_description: string | null;
  metadata_json: Record<string, unknown>;
  created_by_id: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Core logger
// ---------------------------------------------------------------------------

export async function logProjectActivity(
  input: LogProjectActivityInput
): Promise<ProjectActivityLogRow | null> {
  const client = db();
  if (!client) return null;

  const { data, error } = await client
    .from("project_activity_log")
    .insert({
      organization_id: input.organizationId,
      project_id: input.projectId,
      event_type: input.eventType,
      event_title: input.eventTitle,
      event_description: input.eventDescription ?? null,
      metadata_json: input.metadata ?? {},
      created_by_id: input.createdById ?? null,
    })
    .select("*")
    .single();

  if (error) {
    console.error("[project-activity-logger] insert failed:", error.message, {
      projectId: input.projectId,
      eventType: input.eventType,
    });
    return null;
  }

  return data as ProjectActivityLogRow;
}

// ---------------------------------------------------------------------------
// Convenience wrappers — typed for common events
// ---------------------------------------------------------------------------

export async function logStageChanged(opts: {
  organizationId: string;
  projectId: string;
  fromStage: string;
  toStage: string;
  fromStatus: string;
  createdById?: string | null;
}) {
  return logProjectActivity({
    organizationId: opts.organizationId,
    projectId: opts.projectId,
    eventType: "stage_changed",
    eventTitle: `Stage advanced to ${opts.toStage.replace(/_/g, " ")}`,
    metadata: {
      from_stage: opts.fromStage,
      to_stage: opts.toStage,
      from_status: opts.fromStatus,
    },
    createdById: opts.createdById,
  });
}

export async function logSurveySubmitted(opts: {
  organizationId: string;
  projectId: string;
  surveyDate: string | null;
  surveyedByName?: string | null;
  createdById?: string | null;
}) {
  return logProjectActivity({
    organizationId: opts.organizationId,
    projectId: opts.projectId,
    eventType: "survey_submitted",
    eventTitle: "Site survey saved",
    metadata: {
      survey_date: opts.surveyDate,
      surveyed_by: opts.surveyedByName ?? null,
    },
    createdById: opts.createdById,
  });
}

export async function logDesignCreated(opts: {
  organizationId: string;
  projectId: string;
  designId: string;
  versionNumber: number;
  versionLabel: string | null;
  isRevision: boolean;
  createdById?: string | null;
}) {
  return logProjectActivity({
    organizationId: opts.organizationId,
    projectId: opts.projectId,
    eventType: opts.isRevision ? "design_revised" : "design_created",
    eventTitle: opts.isRevision
      ? `Design revised — V${opts.versionNumber}`
      : `Design created — V${opts.versionNumber}`,
    metadata: {
      design_id: opts.designId,
      version_number: opts.versionNumber,
      version_label: opts.versionLabel,
    },
    createdById: opts.createdById,
  });
}

export async function logTaskCompleted(opts: {
  organizationId: string;
  projectId: string;
  taskTitle: string;
  taskStage: string;
  createdById?: string | null;
}) {
  return logProjectActivity({
    organizationId: opts.organizationId,
    projectId: opts.projectId,
    eventType: "task_completed",
    eventTitle: `Task completed: ${opts.taskTitle}`,
    metadata: {
      task_title: opts.taskTitle,
      stage: opts.taskStage,
    },
    createdById: opts.createdById,
  });
}

export async function logNmSubstatusChanged(opts: {
  organizationId: string;
  projectId: string;
  fromSubstatus: string;
  toSubstatus: string;
  createdById?: string | null;
}) {
  return logProjectActivity({
    organizationId: opts.organizationId,
    projectId: opts.projectId,
    eventType: "nm_substatus_changed",
    eventTitle: `Net metering status: ${opts.toSubstatus.replace(/_/g, " ")}`,
    metadata: {
      from_substatus: opts.fromSubstatus,
      to_substatus: opts.toSubstatus,
    },
    createdById: opts.createdById,
  });
}

export async function logDocumentUploaded(opts: {
  organizationId: string;
  projectId: string;
  docCategory: string;
  docName: string;
  stage: string;
  documentId?: string;
  createdById?: string | null;
}) {
  return logProjectActivity({
    organizationId: opts.organizationId,
    projectId: opts.projectId,
    eventType: "document_uploaded",
    eventTitle: `Document uploaded: ${opts.docName}`,
    metadata: {
      doc_category: opts.docCategory,
      doc_name: opts.docName,
      stage: opts.stage,
      document_id: opts.documentId ?? null,
    },
    createdById: opts.createdById,
  });
}

export async function logCommentAdded(opts: {
  organizationId: string;
  projectId: string;
  createdById?: string | null;
}) {
  return logProjectActivity({
    organizationId: opts.organizationId,
    projectId: opts.projectId,
    eventType: "comment_added",
    eventTitle: "Comment added",
    createdById: opts.createdById,
  });
}

export async function logProjectCreated(opts: {
  organizationId: string;
  projectId: string;
  customerName?: string | null;
  createdById?: string | null;
}) {
  return logProjectActivity({
    organizationId: opts.organizationId,
    projectId: opts.projectId,
    eventType: "project_created",
    eventTitle: opts.customerName
      ? `Project created for ${opts.customerName}`
      : "Project created",
    createdById: opts.createdById,
  });
}
