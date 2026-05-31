/**
 * Phase 3A-2 test data seed — 1 lead, 1 customer (won), 3 projects (survey/design/installation).
 * Run: node scripts/seed-phase3a2-test-data.mjs
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const BASE = process.env.SEED_BASE_URL ?? "http://localhost:3000";
const TAG = "phase3a2-seed";

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

async function api(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

function daysFromToday(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
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
      .insert({ name: "Sol.52 Demo Installer", slug: `demo-${stamp}`, status: "active" })
      .select("id")
      .single();
    if (orgErr) {
      console.error("Organization insert failed:", orgErr.message);
      process.exit(1);
    }
    orgId = newOrg.id;
    console.log("Organization created:", orgId);
  } else {
    console.log("Organization:", orgId);
  }

  // Resolve leads table
  let leadsTable = "leads";
  const probe = await admin.from("leads").select("id").limit(1);
  if (probe.error) {
    const probe2 = await admin.from("customers").select("id").limit(1);
    if (!probe2.error) leadsTable = "customers";
  }

  const leadPhone = `98765${stamp.slice(0, 5)}`;
  const { data: leadRow, error: leadErr } = await insertAdaptive(admin, leadsTable, {
    name: "Amit Verma",
    city: "Jaipur",
    discom: "JVVNL",
    status: "contacted",
    phone: leadPhone,
    monthly_bill: 4200,
    source: "manual",
    last_touched_at: new Date().toISOString(),
  });
  if (leadErr) {
    console.error("Lead insert failed:", leadErr.message);
    process.exit(1);
  }
  console.log("Lead created:", leadRow.id, leadRow.name);

  // 1 customer (won lead)
  const custPhone = `98766${stamp.slice(0, 5)}`;
  const { data: custRow, error: custErr } = await insertAdaptive(admin, leadsTable, {
    name: "Ravi Sharma",
    city: "Udaipur",
    discom: "AVVNL",
    status: "won",
    phone: custPhone,
    monthly_bill: 8500,
    source: "manual",
    last_touched_at: new Date().toISOString(),
  });
  if (custErr) {
    console.error("Customer insert failed:", custErr.message);
    process.exit(1);
  }
  console.log("Customer created:", custRow.id, custRow.name);

  const now = new Date().toISOString();
  const projectDefs = [
    {
      official_name: "Ravi Sharma — 5kW Rooftop",
      project_code: `SOL-${stamp}-001`,
      current_stage: "survey",
      stage_status: "in_progress",
      target_completion: daysFromToday(30),
      contract_amount_inr: 285000,
      capacity_kw: "5",
      lead_id: custRow.id,
    },
    {
      official_name: "Green Valley Apartments — 25kW",
      project_code: `SOL-${stamp}-002`,
      current_stage: "design",
      stage_status: "in_progress",
      target_completion: daysFromToday(5),
      contract_amount_inr: 1250000,
      capacity_kw: "25",
      lead_id: null,
    },
    {
      official_name: "Patel Industries — 50kW",
      project_code: `SOL-${stamp}-003`,
      current_stage: "installation",
      stage_status: "blocked",
      target_completion: daysFromToday(-14),
      contract_amount_inr: 2100000,
      capacity_kw: "50",
      lead_id: null,
    },
  ];

  const createdProjects = [];
  for (const def of projectDefs) {
    const row = {
      organization_id: orgId,
      lead_id: def.lead_id,
      official_name: def.official_name,
      customer_name: def.official_name,
      project_code: def.project_code,
      current_stage: def.current_stage,
      stage_status: def.stage_status,
      nm_substatus: "not_started",
      has_subsidy: false,
      amount_received_inr: 0,
      dashboard_visible: true,
      status: "pending",
      install_progress: def.current_stage === "installation" ? 45 : 0,
      contract_amount_inr: def.contract_amount_inr,
      target_completion: def.target_completion,
      detail: `${TAG} verification project`,
      updated_at: now,
      solar_kw: def.capacity_kw,
    };

    const { data, error } = await insertAdaptive(admin, "projects", {
      ...row,
      capacity_kw: def.capacity_kw,
    });
    if (data) {
      createdProjects.push(data);
      console.log(`Project ${def.current_stage}:`, data.id, def.project_code);
      continue;
    }
    console.error(`Project insert failed (${def.project_code}):`, error);
    process.exit(1);
  }

  // Verify POST /api/projects works after adaptive fix
  const postCheck = await api("POST", "/api/projects", {
    official_name: "API Smoke Test",
    project_code: `SOL-${stamp}-API`,
    contract_amount_inr: 100000,
    detail: `${TAG} via POST — will delete`,
    capacity_kw: "3",
  });
  console.log("POST /api/projects:", postCheck.status, postCheck.json.ok ? "ok" : postCheck.json.error);
  if (postCheck.json.ok && postCheck.json.data?.id) {
    await admin.from("projects").delete().eq("id", postCheck.json.data.id);
  }

  const list = await api("GET", "/api/projects/list?view=active&limit=50");
  const seeded = (list.json.data ?? []).filter((p) =>
    String(p.detail ?? "").includes(TAG) ||
    projectDefs.some((d) => d.project_code === p.project_code)
  );
  console.log("\nSeed complete.");
  console.log("Active seeded projects visible in list:", seeded.length);
  console.log(
    "Stages:",
    seeded.map((p) => `${p.project_code}:${p.current_stage}/${p.health ?? "?"}`).join(", ")
  );

  if (seeded.length < 3) {
    console.warn("Warning: expected 3 projects in list — check organization_id filter.");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
