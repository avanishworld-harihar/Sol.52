/**
 * Phase 3A-4 Step 7 — Design tab screenshot verification.
 * Run: node scripts/verify-phase3a4-step7-screenshots.mjs
 */
import { chromium, devices } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.VERIFY_BASE_URL ?? "http://localhost:3001";
const OUT = path.join(process.cwd(), "scripts", "phase3a4-step7-screenshots");

async function api(method, urlPath, body) {
  const res = await fetch(`${BASE}${urlPath}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function ensureDesignProject(projectId) {
  const existing = await api("GET", `/api/projects/${projectId}/designs`);
  if ((existing.json.data?.length ?? 0) > 0) return existing.json.data;

  const v1 = await api("POST", `/api/projects/${projectId}/designs`, {
    version_label: "V1 – Initial layout",
    system_kw: 5,
    panel_count: 12,
    panel_watt: 540,
    panel_model: "Waaree 540W Mono PERC",
    inverter_kw: 5,
    inverter_model: "Growatt MIN 5000TL-X",
    structure_type: "elevated",
    string_count: 2,
    modules_per_string: 6,
    annual_yield_kwh: 7800,
    performance_ratio: 0.78,
    revision_notes: "South-facing RCC terrace layout. 2 strings × 6 modules.",
  });

  await api("POST", `/api/projects/${projectId}/designs`, {
    version_label: "V2 – Revision after survey",
    system_kw: 5,
    panel_count: 11,
    panel_watt: 540,
    panel_model: "Waaree 540W Mono PERC",
    inverter_kw: 5,
    inverter_model: "Growatt MIN 5000TL-X",
    structure_type: "flush",
    string_count: 2,
    modules_per_string: 6,
    annual_yield_kwh: 7650,
    performance_ratio: 0.77,
    revision_notes: "Reduced one panel after shadow analysis on east corner.",
  });

  const list = await api("GET", `/api/projects/${projectId}/designs`);
  return list.json.data ?? v1.json.data ?? [];
}

async function ensureEmptyDesignProject() {
  const code = `SOL-DES-E-${Date.now().toString(36).slice(-6)}`;
  const created = await api("POST", "/api/projects", {
    official_name: "Design Empty Demo",
    project_code: code,
    capacity_kw: "5",
    panel_brand: "Waaree",
    inverter_brand: "Growatt",
    detail: "Step 7 empty design state demo",
  });
  return created.json.data ?? null;
}

async function main() {
  await mkdir(OUT, { recursive: true });

  const list = await api("GET", "/api/projects/list?view=active&limit=10");
  const mainProject = (list.json.data ?? [])[0];
  if (!mainProject?.id) throw new Error("No project for design demo");

  await ensureDesignProject(mainProject.id);
  const emptyProject = await ensureEmptyDesignProject();
  if (!emptyProject?.id) throw new Error("Could not create empty design project");

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  await page.goto(`${BASE}/projects/${mainProject.id}?tab=design`, {
    waitUntil: "networkidle",
    timeout: 120000,
  });
  await page.waitForSelector("#project-hub-panel-design", { timeout: 60000 });
  await page.waitForFunction(
    () =>
      document.body.innerText.includes("Design on file") ||
      document.body.innerText.includes("System size") ||
      document.body.innerText.includes("Panel model"),
    undefined,
    { timeout: 60000 }
  );
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, "01-design-populated-desktop.png"), fullPage: true });

  await page.goto(`${BASE}/projects/${emptyProject.id}?tab=design`, {
    waitUntil: "networkidle",
    timeout: 120000,
  });
  await page.waitForSelector("#project-hub-panel-design", { timeout: 60000 });
  await page.waitForFunction(
    () => document.body.innerText.includes("No design version saved"),
    undefined,
    { timeout: 30000 }
  );
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, "02-design-empty-desktop.png"), fullPage: true });

  const mobile = await browser.newContext({ ...devices["iPhone 13"] });
  const mobilePage = await mobile.newPage();
  await mobilePage.goto(`${BASE}/projects/${mainProject.id}?tab=design`, {
    waitUntil: "networkidle",
    timeout: 120000,
  });
  await mobilePage.waitForSelector("#project-hub-panel-design", { timeout: 60000 });
  await mobilePage.waitForTimeout(400);
  await mobilePage.screenshot({
    path: path.join(OUT, "03-design-populated-mobile.png"),
    fullPage: true,
  });

  const designs = await api("GET", `/api/projects/${mainProject.id}/designs`);

  const report = {
    captured_at: new Date().toISOString(),
    base_url: BASE,
    populated_project_id: mainProject.id,
    empty_project_id: emptyProject.id,
    design_versions: designs.json.data?.length ?? 0,
    current_version: designs.json.data?.find((d) => d.is_current)?.version_label ?? null,
    has_panel_info: Boolean(designs.json.data?.[0]?.panel_model),
    has_inverter_info: Boolean(designs.json.data?.[0]?.inverter_model),
    has_string_layout: Boolean(designs.json.data?.[0]?.string_count),
    cache_keys: [
      `/api/projects/{id}/designs`,
      `/api/projects/{id}`,
      `/api/projects/{id}/activity`,
      "/api/projects/list",
      "/api/projects/dashboard-stats",
    ],
    files: [
      "01-design-populated-desktop.png",
      "02-design-empty-desktop.png",
      "03-design-populated-mobile.png",
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
