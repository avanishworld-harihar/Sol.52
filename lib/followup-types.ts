export type ActivityEventType =
  | "proposal_created"
  | "proposal_opened"
  | "reminder_completed"
  | "customer_contacted"
  | "status_changed"
  | "followup_created"
  | "followup_snoozed"
  | "visit_scheduled"
  | "visit_completed"
  | "note_added";

export type ReminderPriority = "low" | "medium" | "high" | "urgent";
export type ReminderStatus = "pending" | "completed" | "snoozed";
export type ReminderFollowupType = "call" | "visit" | "proposal" | "payment" | "general";

export type FollowupReminder = {
  id: string;
  lead_id: string;
  proposal_id?: string | null;
  project_id?: string | null;
  title: string;
  followup_type: ReminderFollowupType;
  priority: ReminderPriority;
  due_at: string;
  status: ReminderStatus;
  snoozed_until?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
};

export type LeadNoteAttachment = {
  id: string;
  url: string;
  kind: "image";
  name?: string;
  sizeKb?: number;
};

export type LeadNote = {
  id: string;
  lead_id: string;
  body_text: string;
  attachments_json: LeadNoteAttachment[];
  voice_ref?: string | null;
  sketch_ref?: string | null;
  created_at: string;
  updated_at: string;
};

export type LeadVisitStatus = "scheduled" | "completed" | "cancelled" | "rescheduled";
export type LeadVisit = {
  id: string;
  lead_id: string;
  proposal_id?: string | null;
  scheduled_at: string;
  visit_status: LeadVisitStatus;
  summary?: string | null;
  location?: string | null;
  created_at: string;
  updated_at: string;
};

export type ActivityEvent = {
  id: string;
  lead_id: string;
  event_type: ActivityEventType;
  occurred_at: string;
  actor_type: string;
  actor_id?: string | null;
  meta_json: Record<string, unknown>;
  created_at: string;
};

export type FollowupPagination = {
  limit?: number;
  offset?: number;
};
