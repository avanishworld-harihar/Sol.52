/** Sales Premium Institutional — 5-page Apple-style document model. */

export type InstitutionalAuditMonth = {
  label: string;
  units: number;
  energy_inr: number;
  fixed_inr: number;
  duty_fuel_inr: number;
  net_inr: number;
  is_summer_peak: boolean;
  bar_height_pct: number;
};

export type InstitutionalBillPage = {
  billing_caption: string;
  months: InstitutionalAuditMonth[];
  totals: Omit<InstitutionalAuditMonth, "is_summer_peak" | "bar_height_pct" | "label"> & { label: string };
  summer_trap_pct: number;
  fixed_liability_display: string;
  surcharges_display: string;
  offset_potential_pct: number;
  offset_retention_display: string;
};

export type InstitutionalCapitalPage = {
  gross_cost_inr: number;
  subsidy_inr: number;
  net_cost_inr: number;
  payback_years: number;
  wealth_25yr_lakhs: number;
};

export type InstitutionalFlowNode = {
  title: string;
  sub: string;
  highlight?: boolean;
};

export type InstitutionalBomRow = {
  component: string;
  specification: string;
  brand: string;
  warranty: string;
  warranty_tone?: "green" | "blue" | "default";
};

export type InstitutionalTechnicalPage = {
  flow_nodes: InstitutionalFlowNode[];
  bom_rows: InstitutionalBomRow[];
};

export type InstitutionalTimelineStep = {
  day_label: string;
  title: string;
  description: string;
  complete?: boolean;
};

export type InstitutionalPaymentRow = {
  label: string;
  amount_inr: number;
  is_total?: boolean;
};

export type InstitutionalExecutionPage = {
  team_city: string;
  timeline: InstitutionalTimelineStep[];
  payments: InstitutionalPaymentRow[];
  bank: {
    beneficiary: string;
    account_number: string;
    ifsc: string;
    upi_id: string;
  };
};

export type InstitutionalCoverPage = {
  brand_primary: string;
  brand_secondary: string;
  customer_name: string;
  location_line: string;
  system_profile: string;
};

export type SalesPremiumInstitutionalModel = {
  cover: InstitutionalCoverPage;
  bill: InstitutionalBillPage;
  capital: InstitutionalCapitalPage;
  technical: InstitutionalTechnicalPage;
  execution: InstitutionalExecutionPage;
};
