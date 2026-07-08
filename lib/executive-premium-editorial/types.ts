/** Executive Premium — Golden / Elite Luxury document model. */

export type EditorialBillMonth = {
  label: string;
  units: number;
  energy_inr: number;
  fixed_inr: number;
  duty_inr: number;
  net_inr: number;
  is_summer_peak: boolean;
  highlight_net: boolean;
  bar_height_pct: number;
};

export type EditorialEmiRow = {
  tenure_label: string;
  interest_paid_inr: number;
  monthly_emi_inr: number;
};

export type EditorialBomRow = {
  name: string;
  spec: string;
  brand: string;
  warranty: string;
  description: string;
  technical_points: string[];
};

export type EditorialProcessStep = {
  num: string;
  title: string;
  description: string;
};

export type EditorialPaymentRow = {
  label: string;
  pct_label: string;
  amount_inr: number;
  is_total?: boolean;
};

export type EditorialTermsModel = {
  installer_name: string;
  terms_conditions: string[];
  documents_required: string[];
  amc_objective: string;
  amc_scope: string[];
  client_scope: string[];
  amc_cost_paragraph: string;
  amc_terms: string[];
};

export type EditorialMetricRow = {
  label: string;
  value: string;
  highlight?: boolean;
};

export type EditorialInstallPhase = {
  num: string;
  title: string;
  detail: string;
};

export type EditorialWarrantyRow = {
  item: string;
  duration: string;
  by: string;
  coverage: string;
};

export type EditorialWarrantyHighlightIcon = "shield" | "panel" | "structure" | "support";

export type EditorialWarrantyHighlight = {
  icon: EditorialWarrantyHighlightIcon;
  value: string;
  unit: string;
  label: string;
};

export type EditorialEngineeringModel = {
  metrics_rows: EditorialMetricRow[];
  tilt_deg: number;
  tilt_note: string;
  city_label: string;
  cable_note?: string;
  standards: string[];
  install_phases: EditorialInstallPhase[];
};

export type EditorialWarrantyModel = {
  intro: string;
  highlights: EditorialWarrantyHighlight[];
  rows: EditorialWarrantyRow[];
};

export type ExecutivePremiumEditorialModel = {
  brand_display: string;
  brand_logo_url?: string;
  customer_name: string;
  location_line: string;
  asset_profile_line: string;
  bill: {
    summer_trap_pct: number;
    fixed_charges_display: string;
    solar_savings_pct: number;
    months: EditorialBillMonth[];
    totals: {
      units: number;
      energy_inr: number;
      fixed_inr: number;
      duty_inr: number;
      net_inr: number;
    };
  };
  economics: {
    gross_cost_inr: number;
    subsidy_inr: number;
    net_cost_inr: number;
    payback_years: number;
    emi_rows: EditorialEmiRow[];
  };
  impact: {
    co2_tons: number;
    trees: number;
  };
  architecture: {
    bom_rows: EditorialBomRow[];
  };
  engineering: EditorialEngineeringModel;
  warranty: EditorialWarrantyModel;
  execution: {
    company: string;
    account_number: string;
    ifsc: string;
    upi_id: string;
    steps: EditorialProcessStep[];
    payments: EditorialPaymentRow[];
  };
  terms: EditorialTermsModel;
  closing: EditorialClosingModel;
};

export type EditorialClosingModel = {
  customer_name: string;
  annual_units: number;
  annual_savings_inr: number;
  installer_name: string;
  contact_line: string;
  qr_url?: string;
};
