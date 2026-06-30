/**
 * Visible UI preview — 4 customers + 4 projects (different stages / health).
 * Run: node scripts/seed-ui-preview-projects.mjs
 * Remove: node scripts/cleanup-ui-preview-projects.mjs
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const TAG = "ui-preview-demo";

function loadEnvLocal() {
  try {
    const text = readFileSync(".env.local", "utf8");
    const env = {};
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
    return env;
  } catch {
    return {};
  }
}

async function insertAdaptive(admin, table, payload) {
  let attempt = { ...payload };
  for (let i = 0; i < 40; i++) {
    const { data, error } = await admin.from(table).insert(attempt).select("*").single();
    if (!error && data) return { data, error: null };
    const miss = /Could not find the '([^']+)' column/i.exec(error?.message ?? "");
    if (miss?.[1] && miss[1] in attempt) {
      delete attempt[miss[1]];
      continue;
    }
    return { data: null, error: error?.message ?? "insert_failed" };
  }
  return { data: null, error: "insert_exhausted" };
}

function daysFromToday(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

async function main() {
  const env = loadEnvLocal();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }

  const admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const stamp = Date.now().toString().slice(-6);

  let orgId = null;
  const { data: org } = await admin
    .from("organizations")
    .select("id")
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  orgId = org?.id ?? null;

  if (!orgId) {
    const { data: newOrg, error: orgErr } = await admin
      .from("organizations")
      .insert({ name: "Sol.52 Preview Org", slug: `preview-${stamp}`, status: "active" })
      .select("id")
      .single();
    if (orgErr) {
      console.error("Organization insert failed:", orgErr.message);
      process.exit(1);
    }
    orgId = newOrg.id;
  }

  let leadsTable = "leads";
  const probe = await admin.from("leads").select("id").limit(1);
  if (probe.error) {
    const probe2 = await admin.from("customers").select("id").limit(1);
    if (!probe2.error) leadsTable = "customers";
  }

  const customerDefs = [
    {
      name: "[Preview] Priya Mehta",
      city: "Indore",
      discom: "MPPKVVCL",
      status: "won",
      phone: `91280${stamp.slice(0, 2)}01`,
      monthly_bill: 3200,
    },
    {
      name: "[Preview] Sunita Devi",
      city: "Bhopal",
      discom: "MPPKVVCL",
      status: "won",
      phone: `91280${stamp.slice(0, 2)}02`,
      monthly_bill: 5100,
    },
    {
      name: "[Preview] Kumar Traders",
      city: "Jabalpur",
      discom: "MPPKVVCL",
      status: "won",
      phone: `91280${stamp.slice(0, 2)}03`,
      monthly_bill: 12000,
    },
    {
      name: "[Preview] Green Valley Society",
      city: "Ujjain",
      discom: "MPPKVVCL",
      status: "won",
      phone: `91280${stamp.slice(0, 2)}04`,
      monthly_bill: 28000,
    },
  ];

  const leadIds = [];
  for (const def of customerDefs) {
    const { data, error } = await insertAdaptive(admin, leadsTable, {
      ...def,
      source: "manual",
      last_touched_at: new Date().toISOString(),
    });
    if (error) {
      console.error("Lead insert failed:", def.name, error);
      process.exit(1);
    }
    leadIds.push(data.id);
    console.log("Customer:", data.id, def.name);
  }

  const now = new Date().toISOString();
  const projectDefs = [
    {
      official_name: "[Preview] Priya Mehta — 3kW Rooftop",
      project_code: `UIPREV-${stamp}-01`,
      current_stage: "survey",
      stage_status: "in_progress",
      target_completion: daysFromToday(28),
      contract_amount_inr: 185000,
      amount_received_inr: 50000,
      capacity_kw: "3",
      lead_id: leadIds[0],
      install_progress: 0,
      has_subsidy: true,
    },
    {
      official_name: "[Preview] Sunita Devi — 5kW Home",
      project_code: `UIPREV-${stamp}-02`,
      current_stage: "design",
      stage_status: "in_progress",
      target_completion: daysFromToday(5),
      contract_amount_inr: 265000,
      amount_received_inr: 100000,
      capacity_kw: "5",
      lead_id: leadIds[1],
      install_progress: 0,
      has_subsidy: true,
    },
    {
      official_name: "[Preview] Kumar Traders — 10kW Commercial",
      project_code: `UIPREV-${stamp}-03`,
      current_stage: "installation",
      stage_status: "in_progress",
      target_completion: daysFromToday(-10),
      contract_amount_inr: 520000,
      amount_received_inr: 300000,
      capacity_kw: "10",
      lead_id: leadIds[2],
      install_progress: 55,
      has_subsidy: false,
    },
    {
      official_name: "[Preview] Green Valley — 25kW Society",
      project_code: `UIPREV-${stamp}-04`,
      current_stage: "net_metering",
      stage_status: "blocked",
      target_completion: daysFromToday(-21),
      contract_amount_inr: 1180000,
      amount_received_inr: 950000,
      capacity_kw: "25",
      lead_id: leadIds[3],
      install_progress: 100,
      has_subsidy: false,
      nm_substatus: "inspection_pending",
    },
  ];

  for (const def of projectDefs) {
    const row = {
      organization_id: orgId,
      lead_id: def.lead_id,
      official_name: def.official_name,
      customer_name: def.official_name,
      project_code: def.project_code,
      current_stage: def.current_stage,
      stage_status: def.stage_status,
      nm_substatus: def.nm_substatus ?? "not_started",
      has_subsidy: def.has_subsidy,
      amount_received_inr: def.amount_received_inr,
      dashboard_visible: true,
      status: "pending",
      install_progress: def.install_progress,
      contract_amount_inr: def.contract_amount_inr,
      target_completion: def.target_completion,
      site_address: `${def.official_name.includes("Indore") ? "Vijay Nagar" : "Main Road"}, MP`,
      detail: `${TAG} — UI preview (safe to delete)`,
      updated_at: now,
      solar_kw: def.capacity_kw,
      capacity_kw: def.capacity_kw,
      start_date: daysFromToday(-45),
    };

    const { data, error } = await insertAdaptive(admin, "projects", row);
    if (error) {
      console.error("Project insert failed:", def.project_code, error);
      process.exit(1);
    }
    console.log(`Project ${def.current_stage}:`, data.id, def.project_code);
  }

  console.log("\nDone — 4 preview customers + projects created.");
  console.log("Open /projects to review. Remove with: node scripts/cleanup-ui-preview-projects.mjs");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
