export type WorkRole = "office_sales" | "field_staff" | "hybrid";
export type FieldAssignmentType = "site_survey" | "document_collection" | "customer_concern" | "follow_up_visit";
export type FieldAssignmentStatus = "assigned" | "accepted" | "in_progress" | "completed" | "cancelled";

export type FieldLeadSummary = {
  id: string;
  assigned_to_user_id?: string | null;
  name: string;
  consumer_name?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  location?: string | null;
  discom?: string | null;
  survey_status?: string | null;
  status?: string | null;
  created_at?: string | null;
};

export type FieldAssignment = {
  id: string;
  organization_id: string;
  lead_id: string;
  assigned_user_id: string | null;
  assignment_type: FieldAssignmentType;
  status: FieldAssignmentStatus;
  priority: "low" | "normal" | "high" | "urgent";
  instructions?: string | null;
  field_notes?: string | null;
  due_at?: string | null;
  assigned_by_user_id?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
};

export const FIELD_ASSIGNMENT_LABELS: Record<FieldAssignmentType, string> = {
  site_survey: "Site survey",
  document_collection: "Document collection",
  customer_concern: "Customer concern",
  follow_up_visit: "Follow-up visit",
};

export const FIELD_STATUS_LABELS: Record<FieldAssignmentStatus, string> = {
  assigned: "Assigned",
  accepted: "Accepted",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};
