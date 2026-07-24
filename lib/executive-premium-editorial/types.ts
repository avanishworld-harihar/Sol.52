/** Executive Premium — Golden / Elite Luxury document model. */

import type { EditorialGenerationMonth } from "@/lib/executive-premium-editorial/build-generation-forecast";

export type { EditorialGenerationMonth };

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
  /** Yield-only rows — capacity/PR/ratio live in blueprint UI (no annual-gen duplicate). */
  metrics_rows: EditorialMetricRow[];
  tilt_deg: number;
  tilt_note: string;
  city_label: string;
  cable_note?: string;
  standards: string[];
  install_phases: EditorialInstallPhase[];
  /** Canvas-style blueprint fields (Golden Design & Performance). */
  panel_count: number;
  panel_watt: number;
  visual_panel_count: number;
  panel_image_url: string;
  azimuth_deg: number;
  site_lat_label: string;
  roof_area_m2: number;
  m2_per_panel: number;
  ac_kw: number;
  dc_kwp: number;
  dc_ac_ratio: number;
  performance_ratio_pct: number;
  peak_sun_hours: number;
  specific_yield: number;
  load_coverage_pct: number;
};

export type EditorialWarrantyModel = {
  intro: string;
  highlights: EditorialWarrantyHighlight[];
  rows: EditorialWarrantyRow[];
};

export type ExecutivePremiumEditorialModel = {
  brand_display: string;
  brand_logo_url?: string;
  brand_tagline?: string;
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
    monthly_savings_inr: number;
    lifetime_profit_inr: number;
    emi_rows: EditorialEmiRow[];
  };
  /** Monthly units/savings only — annual totals live on requirement / economics / closing. */
  generation: {
    months: EditorialGenerationMonth[];
    effective_rate_inr: number;
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
  lifetime_wealth_inr: number;
  installer_name: string;
  contact_line: string;
  contact_person?: string;
  contact_person_designation?: string;
  address?: string;
  gst_number?: string;
  brand_tagline?: string;
  qr_url?: string;
};
