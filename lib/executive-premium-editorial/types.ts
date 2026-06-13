/** Executive Premium — Editorial Split-Page document model. */

export type EditorialBillMonth = {
  label: string;
  units: number;
  energy_inr: number;
  fixed_inr: number;
  tax_inr: number;
  net_inr: number;
  is_summer_peak: boolean;
  bar_height_pct: number;
};

export type EditorialEmiRow = {
  tenure_label: string;
  interest_paid_inr: number;
  monthly_emi_inr: number;
};

export type EditorialBomRow = {
  name: string;
  brand: string;
  spec: string;
  warranty: string;
  warranty_tone: "green" | "blue" | "copper" | "muted";
};

export type EditorialFlowNode = {
  title: string;
  sub: string;
  complete?: boolean;
};

export type EditorialProcessStep = {
  num: string;
  title: string;
  description: string;
};

export type EditorialPaymentRow = {
  label: string;
  amount_inr: number;
  is_total?: boolean;
};

export type ExecutivePremiumEditorialModel = {
  brand_primary: string;
  brand_secondary: string;
  customer_name: string;
  location_line: string;
  system_size_line: string;
  cover_tagline: string;
  bill: {
    summer_trap_pct: number;
    fixed_charges_display: string;
    solar_savings_pct: number;
    months: EditorialBillMonth[];
    totals: {
      units: number;
      energy_inr: number;
      fixed_inr: number;
      tax_inr: number;
      net_inr: number;
    };
  };
  economics: {
    gross_cost_inr: number;
    subsidy_inr: number;
    net_cost_inr: number;
    payback_years: number;
    savings_25yr_lakhs: number;
    emi_rows: EditorialEmiRow[];
  };
  impact: {
    annual_gen_units: number;
    co2_tons: number;
    trees: number;
  };
  architecture: {
    flow_nodes: EditorialFlowNode[];
    bom_rows: EditorialBomRow[];
  };
  execution: {
    company: string;
    account_number: string;
    ifsc: string;
    upi_id: string;
    steps: EditorialProcessStep[];
    payments: EditorialPaymentRow[];
  };
};
