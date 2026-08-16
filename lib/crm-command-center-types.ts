/** CRM Command Center — daily action engine types. */

export type CommandUrgency = "critical" | "overdue" | "today" | "hot" | "upcoming";

export type CommandFilterId = "all" | "critical" | "today" | "hot" | "upcoming";

export type CommandActionKind =
  | "reminder_overdue"
  | "reminder_today"
  | "reminder_upcoming"
  | "visit_today"
  | "visit_upcoming"
  | "hot_proposal"
  | "hot_bill"
  | "payment_pending";

export type CommandActionItem = {
  id: string;
  lead_id: string;
  customer_name: string;
  phone: string | null;
  /** Lead location / city — distinguishes same names on the dashboard. */
  location: string | null;
  stage: string;
  system_kw: number | null;
  deal_value_inr: number | null;
  /** Short action label — e.g. "Call for decision", "Site visit" */
  action_title: string;
  /** Event / scheduling context — e.g. "Proposal opened 44h ago" */
  event_context: string;
  /** @deprecated use action_title + event_context */
  reason: string;
  reason_icon: string;
  due_at: string | null;
  urgency: CommandUrgency;
  kind: CommandActionKind;
  reminder_id?: string;
  visit_id?: string;
  sort_score: number;
};

export type CommandCenterKpis = {
  hot_leads: number;
  overdue_followups: number;
  today_tasks: number;
  pipeline_at_risk_inr: number;
  critical_count: number;
};

export type CommandCenterPayload = {
  kpis: CommandCenterKpis;
  actions: CommandActionItem[];
  generated_at: string;
};
