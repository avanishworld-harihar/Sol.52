/** Sales Premium Pearl — 5-page Apple Pro document model. */

export type InstitutionalAuditMonth = {
  label: string;
  units: number;
  energy_inr: number;
  fixed_inr: number;
  duty_inr: number;
  net_inr: number;
  is_summer_peak: boolean;
  bar_height_pct: number;
};

export type InstitutionalEmiRow = {
  tenure_label: string;
  interest_inr: number;
  monthly_inr: number;
};

export type InstitutionalBomRow = {
  index: number;
  component: string;
  specification: string;
  brand: string;
  warranty: string;
  warranty_tone: "green" | "blue" | "default";
};

export type InstitutionalCheckoutStep = {
  num: string;
  title: string;
  description: string;
  highlight_title?: boolean;
};

export type InstitutionalCoverPage = {
  brand_display: string;
  customer_name: string;
  location_line: string;
  system_kw_line: string;
  system_architecture_line: string;
  savings_lakhs: number;
};

export type InstitutionalBillPage = {
  current_annual_inr: number;
  cost_after_solar_inr: number;
  annual_savings_inr: number;
  months: InstitutionalAuditMonth[];
  totals: {
    units: number;
    energy_inr: number;
    fixed_inr: number;
    duty_inr: number;
    net_inr: number;
  };
};

export type InstitutionalCapitalPage = {
  net_investment_lakhs: number;
  lifetime_returns_lakhs: number;
  gross_cost_inr: number;
  subsidy_inr: number;
  net_cost_inr: number;
  emi_rows: InstitutionalEmiRow[];
};

export type InstitutionalTechnicalPage = {
  bom_rows: InstitutionalBomRow[];
  co2_tons: number;
  trees: number;
};

export type InstitutionalExecutionPage = {
  steps: InstitutionalCheckoutStep[];
  bank: {
    beneficiary: string;
    account_number: string;
    ifsc: string;
    upi_id: string;
  };
};

export type SalesPremiumInstitutionalModel = {
  cover: InstitutionalCoverPage;
  bill: InstitutionalBillPage;
  capital: InstitutionalCapitalPage;
  technical: InstitutionalTechnicalPage;
  execution: InstitutionalExecutionPage;
};
