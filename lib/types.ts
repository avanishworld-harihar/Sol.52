/**
 * Lead row shape from `/api/customers` / Supabase `leads`.
 *
 * CRM v2 fields (`source`, `last_touched_at`, `state`, `email`) are optional
 * for back-compat with caches / pre-012 envs that haven't run the migration.
 */
export type CustomerLead = {
  id: string;
  /** Lead name: person we met / talked with in the field. */
  name: string;
  /**
   * Consumer name: name on the electricity bill.
   * May differ from `name` in field-sales scenarios.
   * Display as "ConsumerName (LeadName)" when both are present.
   */
  consumer_name?: string | null;
  city: string;
  discom: string;
  monthly_bill: number;
  status: string;
  phone?: string | null;
  /** CRM v2 — origin channel. Undefined means legacy row (treat as 'manual'). */
  source?: string | null;
  /** CRM v2 — ISO timestamp last touched (call/WA/status-change/inbound). */
  last_touched_at?: string | null;
  /** Lead row created_at (list sort fallback). */
  created_at?: string | null;
  /** Indian state / UT. */
  state?: string | null;
  email?: string | null;
  /** Optional DISCOM consumer / CA number. */
  consumer_id?: string | null;
  /** Tariff area: `urban` | `rural`. */
  area?: string | null;
  /** Site locality / landmark (optional). */
  location?: string | null;
  /** Connection category: domestic | commercial | industrial | agricultural | ht. */
  connection_type?: string | null;
  /**
   * Site survey CRM step — when `complete`, the public web proposal shows the
   * survey + install workflow page (`not_started` | `scheduled` | `complete`).
   */
  survey_status?: string | null;
  /** Family / site household group id. */
  household_id?: string | null;
  /** Primary WhatsApp / call contact when household shares a number. */
  is_whatsapp_contact?: boolean | null;
  /** Other member names in the same household (list decoration). */
  household_member_names?: string[] | null;
  /** Derived from projects linkage for Customers UI. */
  customer_stage?: "lead" | "in-pipeline" | "active-project";
  /** Latest commercial proposal for this lead (CRM hand-off to /proposals/[id]). */
  primary_proposal_id?: string | null;
  /** CRM Phase 2 — next pending follow-up (from followup_reminders). */
  next_followup_at?: string | null;
  /** CRM Phase 2 — title of next followup reminder. */
  next_followup_title?: string | null;
  /** CRM Phase 2 — latest activity ISO timestamp (from activity_events). */
  last_activity_at?: string | null;
  /** CRM Phase 2 — latest activity event type. */
  last_activity_type?: string | null;
};

export type MonthKey = "jan" | "feb" | "mar" | "apr" | "may" | "jun" | "jul" | "aug" | "sep" | "oct" | "nov" | "dec";

export type MonthlyUnits = Record<MonthKey, number>;

export interface SolarResult {
  annualUnits: number;
  solarKw: number;
  panels: number;
  annualGeneration: number;
  currentMonthlyBill: number;
  newMonthlyBill: number;
  monthlySavings: number;
  annualSavings: number;
  grossCost: number;
  centralSubsidy: number;
  netCost: number;
  paybackYears: number;
  paybackDisplay: string;
  savings25yr: number;
  profit25yr: number;
}
