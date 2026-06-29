/** CRM Command Center — daily action engine types. */

export type CommandUrgency = "critical" | "today" | "upcoming" | "low";

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
  stage: string;
  system_kw: number | null;
  deal_value_inr: number | null;
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
};

export type CommandCenterPayload = {
  kpis: CommandCenterKpis;
  actions: CommandActionItem[];
  generated_at: string;
};
