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
  warranty: string;
  description: string;
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
  execution: {
    company: string;
    account_number: string;
    ifsc: string;
    upi_id: string;
    steps: EditorialProcessStep[];
    payments: EditorialPaymentRow[];
  };
};
