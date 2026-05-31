/**
 * Phase 3A-4 Step 6 — Survey tab screenshot verification.
 * Run: node scripts/verify-phase3a4-step6-screenshots.mjs
 */
import { chromium, devices } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.VERIFY_BASE_URL ?? "http://localhost:3001";
const OUT = path.join(process.cwd(), "scripts", "phase3a4-step6-screenshots");

async function api(method, urlPath, body) {
  const res = await fetch(`${BASE}${urlPath}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function ensureSurveyProject(projectId) {
  const existing = await api("GET", `/api/projects/${projectId}/survey`);
  if (existing.json.data) return existing.json.data;

  const created = await api("POST", `/api/projects/${projectId}/survey`, {
    survey_date: "2026-06-01",
    site_address: "12 Solar Park Road, Udaipur, Rajasthan",
    gps_lat: 24.5854,
    gps_lng: 73.7125,
    roof_type: "rcc",
    roof_area_sqft: 1200,
    shadow_free_sqft: 950,
    roof_height_ft: 14,
    roof_condition: "good",
    roof_orientation: "south",
    consumer_number: "UD-884422",
    sanction_load_kw: 5,
    connected_load_kw: 4.2,
    meter_type: "single_phase",
    transformer_distance_m: 45,
    meter_location: "Ground floor entry",
    db_location: "Staircase landing",
    existing_earthing: true,
    available_area_sqft: 900,
    proposed_capacity_kw: 5,
    shadow_analysis_note: "Minimal shadow from water tank after 4 PM.",
    annual_irradiation: 1850,
    has_dg: false,
    battery_required: false,
    existing_inverter: false,
    project_category: "residential",
    structure_floor: 2,
    special_notes: "Customer prefers panels on south-west terrace. Access via internal stairs.",
  });
  return created.json.data ?? null;
}

async function ensureEmptySurveyProject() {
  const created = await api("POST", "/api/projects", {
    official_name: "Survey Empty Demo",
    project_code: "SOL-SUR-EMPTY",
    capacity_kw: "3",
    detail: "Step 6 empty survey state demo",
  });
  return created.json.data ?? null;
}

async function main() {
  await mkdir(OUT, { recursive: true });

  const list = await api("GET", "/api/projects/list?view=active&limit=10");
  const mainProject = (list.json.data ?? [])[0];
  if (!mainProject?.id) throw new Error("No project for survey demo");

  await ensureSurveyProject(mainProject.id);
  const emptyProject = await ensureEmptySurveyProject();
  if (!emptyProject?.id) throw new Error("Could not create empty survey project");

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  await page.goto(`${BASE}/projects/${mainProject.id}?tab=survey`, {
    waitUntil: "networkidle",
    timeout: 120000,
  });
  await page.waitForSelector("#project-hub-panel-survey", { timeout: 60000 });
  await page.waitForFunction(
    () => document.body.innerText.includes("Survey recorded") || document.body.innerText.includes("Roof details"),
    undefined,
    { timeout: 30000 }
  );
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, "01-survey-populated-desktop.png"), fullPage: true });

  await page.goto(`${BASE}/projects/${emptyProject.id}?tab=survey`, {
    waitUntil: "networkidle",
    timeout: 120000,
  });
  await page.waitForSelector("#project-hub-panel-survey", { timeout: 60000 });
  await page.waitForFunction(
    () => document.body.innerText.includes("No site survey on file"),
    undefined,
    { timeout: 30000 }
  );
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, "02-survey-empty-desktop.png"), fullPage: true });

  const mobile = await browser.newContext({ ...devices["iPhone 13"] });
  const mobilePage = await mobile.newPage();
  await mobilePage.goto(`${BASE}/projects/${mainProject.id}?tab=survey`, {
    waitUntil: "networkidle",
    timeout: 120000,
  });
  await mobilePage.waitForSelector("#project-hub-panel-survey", { timeout: 60000 });
  await mobilePage.waitForTimeout(400);
  await mobilePage.screenshot({
    path: path.join(OUT, "03-survey-populated-mobile.png"),
    fullPage: true,
  });

  const survey = await api("GET", `/api/projects/${mainProject.id}/survey`);

  const report = {
    captured_at: new Date().toISOString(),
    base_url: BASE,
    populated_project_id: mainProject.id,
    empty_project_id: emptyProject.id,
    survey_fields_rendered: survey.json.data
      ? Object.keys(survey.json.data).filter(
          (k) => survey.json.data[k] != null && survey.json.data[k] !== ""
        ).length
      : 0,
    has_site_address: Boolean(survey.json.data?.site_address),
    has_roof_details: Boolean(survey.json.data?.roof_type),
    has_electrical_details: Boolean(survey.json.data?.consumer_number),
    cache_keys: [
      `/api/projects/{id}/survey`,
      `/api/projects/{id}`,
      `/api/projects/{id}/activity`,
      "/api/projects/list",
      "/api/projects/dashboard-stats",
    ],
    files: [
      "01-survey-populated-desktop.png",
      "02-survey-empty-desktop.png",
      "03-survey-populated-mobile.png",
    ],
  };

  await writeFile(path.join(OUT, "verification-report.json"), JSON.stringify(report, null, 2));
  await browser.close();
  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
