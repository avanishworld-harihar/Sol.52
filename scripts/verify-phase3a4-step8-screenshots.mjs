/**
 * Phase 3A-4 Step 8 — Comments tab screenshot verification.
 * Run: node scripts/verify-phase3a4-step8-screenshots.mjs
 */
import { chromium, devices } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.VERIFY_BASE_URL ?? "http://localhost:3001";
const OUT = path.join(process.cwd(), "scripts", "phase3a4-step8-screenshots");

async function api(method, urlPath, body) {
  const res = await fetch(`${BASE}${urlPath}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function ensureComments(projectId) {
  const existing = await api("GET", `/api/projects/${projectId}/comments`);
  if ((existing.json.data?.length ?? 0) >= 2) return existing.json.data;

  const root = await api("POST", `/api/projects/${projectId}/comments`, {
    comment: "Site visit complete — roof shadow acceptable after 4 PM.",
  });
  const rootId = root.json.data?.id;
  if (rootId) {
    await api("PATCH", `/api/projects/${projectId}/comments/${rootId}`, {
      is_pinned: true,
    });
    await api("POST", `/api/projects/${projectId}/comments`, {
      comment: "Confirmed with customer — proceed with 5 kW layout.",
      parent_comment_id: rootId,
    });
  }
  await api("POST", `/api/projects/${projectId}/comments`, {
    comment: "DISCOM consumer number verified on electricity bill.",
  });

  const list = await api("GET", `/api/projects/${projectId}/comments`);
  return list.json.data ?? [];
}

async function ensureEmptyCommentsProject() {
  const code = `SOL-CMT-E-${Date.now().toString(36).slice(-6)}`;
  const created = await api("POST", "/api/projects", {
    official_name: "Comments Empty Demo",
    project_code: code,
    detail: "Step 8 empty comments demo",
  });
  return created.json.data ?? null;
}

async function main() {
  await mkdir(OUT, { recursive: true });

  const list = await api("GET", "/api/projects/list?view=active&limit=10");
  const mainProject = (list.json.data ?? [])[0];
  if (!mainProject?.id) throw new Error("No project for comments demo");

  await ensureComments(mainProject.id);
  const emptyProject = await ensureEmptyCommentsProject();
  if (!emptyProject?.id) throw new Error("Could not create empty comments project");

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  await page.goto(`${BASE}/projects/${emptyProject.id}?tab=comments`, {
    waitUntil: "networkidle",
    timeout: 120000,
  });
  await page.waitForSelector("#project-hub-panel-comments", { timeout: 60000 });
  await page.waitForFunction(
    () => document.body.innerText.includes("No comments yet"),
    undefined,
    { timeout: 30000 }
  );
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, "01-comments-empty-desktop.png"), fullPage: true });

  await page.goto(`${BASE}/projects/${mainProject.id}?tab=comments`, {
    waitUntil: "networkidle",
    timeout: 120000,
  });
  await page.waitForSelector("#project-hub-panel-comments", { timeout: 60000 });
  await page.waitForFunction(
    () =>
      document.body.innerText.includes("Pinned") ||
      document.body.innerText.includes("Project comments") &&
        !document.body.innerText.includes("0 comments"),
    undefined,
    { timeout: 60000 }
  );
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, "02-comments-populated-desktop.png"), fullPage: true });

  const textarea = page.getByPlaceholder("Add a note for the project team…");
  await textarea.fill("Playwright verification comment — Step 8.");
  await page.getByRole("button", { name: "Post comment" }).click();
  await page.waitForFunction(
    () => document.body.innerText.includes("Playwright verification comment"),
    undefined,
    { timeout: 30000 }
  );
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, "03-after-new-comment.png"), fullPage: true });

  const activity = await api("GET", `/api/projects/${mainProject.id}/activity?limit=5`);

  const mobile = await browser.newContext({ ...devices["iPhone 13"] });
  const mobilePage = await mobile.newPage();
  await mobilePage.goto(`${BASE}/projects/${mainProject.id}?tab=comments`, {
    waitUntil: "networkidle",
    timeout: 120000,
  });
  await mobilePage.waitForSelector("#project-hub-panel-comments", { timeout: 60000 });
  await mobilePage.waitForTimeout(400);
  await mobilePage.screenshot({
    path: path.join(OUT, "04-comments-mobile.png"),
    fullPage: true,
  });

  const comments = await api("GET", `/api/projects/${mainProject.id}/comments`);

  const report = {
    captured_at: new Date().toISOString(),
    base_url: BASE,
    populated_project_id: mainProject.id,
    empty_project_id: emptyProject.id,
    comment_count: comments.json.data?.length ?? 0,
    pinned_count: (comments.json.data ?? []).filter((c) => c.is_pinned).length,
    reply_count: (comments.json.data ?? []).filter((c) => c.parent_comment_id).length,
    comment_added_logged: (activity.json.data ?? []).some(
      (e) => e.event_type === "comment_added"
    ),
    files: [
      "01-comments-empty-desktop.png",
      "02-comments-populated-desktop.png",
      "03-after-new-comment.png",
      "04-comments-mobile.png",
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
