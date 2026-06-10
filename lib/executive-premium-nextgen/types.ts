/** Executive Premium NextGen — isolated data model (MVP). */

export type NextgenProperty = {
  photograph_url: string | null;
  address_line1: string;
  address_line2: string;
  city: string;
  full_address: string;
};

export type NextgenDocument = {
  reference_id: string;
  created_date: string;
};

export type NextgenFinancials = {
  lifetime_energy_value_inr: number;
};

export type NextgenConfig = {
  outcome_words: [string, string, string];
};

export type NextgenLedgerRow = {
  year: number;
  cumulative_expenditure_inr: number;
};

export type NextgenLedger = {
  without_solar: NextgenLedgerRow[];
  with_solar: NextgenLedgerRow[];
  difference_year25_inr: number;
  column_header_left: string;
  column_header_right: string;
  closing_statement: string;
};

export type NextgenAssetCharacteristic = {
  label: string;
  value: string;
  unit: string;
};

export type NextgenAsset = {
  rooftop_layout_image_url: string | null;
  annual_generation_kwh: number;
  export_percentage: number;
  storage_kwh: number | null;
  characteristics: [NextgenAssetCharacteristic, NextgenAssetCharacteristic, NextgenAssetCharacteristic];
  lifespan_years: number;
  performance_assurance_text: string;
};

export type NextgenGovernanceZone = {
  zone_name: string;
  coverage_line1: string;
  coverage_line2: string;
  response_timeline: string;
};

export type NextgenGovernance = {
  zones: [NextgenGovernanceZone, NextgenGovernanceZone, NextgenGovernanceZone];
  contact: {
    first_name: string;
    title: string;
    contact_method: string;
  };
  closing_statement: string;
};

export type NextgenInvestmentOption = {
  option_label: string;
  monthly_outflow_inr: number;
  monthly_return_inr: number;
  monthly_net_inr: number;
  irr_percent: number;
};

export type NextgenInvestment = {
  net_commitment_inr: number;
  options: [NextgenInvestmentOption, NextgenInvestmentOption];
  recommended_option: "A" | "B";
  recommendation_text: string;
  next_steps: [string, string, string];
  validity_statement: string;
};

export type NextgenFlowMode = "bill" | "requirement";

export type NextgenBillMonthRow = {
  month_label: string;
  units: number;
  net_inr: number;
  is_peak_season: boolean;
};

export type NextgenBillIntelligence = {
  discom_name: string;
  state_name: string;
  annual_spend_inr: number;
  average_monthly_spend_inr: number;
  annual_units: number;
  peak_season_pct: number;
  effective_rate_inr_per_unit: number | null;
  fixed_charges_annual_inr: number;
  monthly_pattern: NextgenBillMonthRow[];
  insight_lines: [string, string, string];
  tariff_context_line: string | null;
};

export type NextgenRequirementContext = {
  declared_monthly_units: number;
  annual_requirement_units: number;
  proposed_capacity_kw: number;
  modelled_annual_production: number;
  coverage_pct: number;
  discom_name: string;
  connection_category: string;
  insight_lines: [string, string, string];
};

export type ExecutivePremiumNextgenModel = {
  flow_mode: NextgenFlowMode;
  property: NextgenProperty;
  document: NextgenDocument;
  financials: NextgenFinancials;
  config: NextgenConfig;
  bill_intelligence: NextgenBillIntelligence | null;
  requirement_context: NextgenRequirementContext | null;
  ledger: NextgenLedger;
  asset: NextgenAsset;
  governance: NextgenGovernance;
  investment: NextgenInvestment;
};
