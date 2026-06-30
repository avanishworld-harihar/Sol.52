/**
 * Add dummy documents + SLD + design versions to UI preview projects.
 * Run after seed-ui-preview-projects.mjs:
 *   node scripts/seed-ui-preview-documents.mjs
 */
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const PROJECT_TAG = "ui-preview-demo";
const DOC_TAG = "ui-preview-demo-doc";

const MINI_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

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

function minimalPdf(title) {
  const safe = String(title).replace(/[()\\]/g, " ");
  return Buffer.from(
    `%PDF-1.4
1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj
2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj
3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources<< /Font<< /F1<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> >>endobj
4 0 obj<< /Length ${safe.length + 30} >>stream
BT /F1 14 Tf 72 720 Td (${safe}) Tj ET
endstream endobj
xref
0 5
0000000000 65535 f 
trailer<< /Size 5 /Root 1 0 R >>
startxref
0
%%EOF`,
    "utf8"
  );
}

async function ensureBucket(admin, name, opts) {
  const { data: bucket } = await admin.storage.getBucket(name);
  if (bucket) return;
  const { error } = await admin.storage.createBucket(name, opts);
  if (error && !error.message.toLowerCase().includes("already")) {
    throw new Error(`bucket ${name}: ${error.message}`);
  }
}

async function uploadProjectFile(admin, orgId, projectId, buffer, mimeType, ext) {
  const documentId = randomUUID();
  const storagePath = `${orgId}/${projectId}/${documentId}.${ext}`;
  const { error } = await admin.storage.from("project-files").upload(storagePath, buffer, {
    upsert: false,
    contentType: mimeType,
    cacheControl: "3600",
  });
  if (error) throw new Error(`project upload: ${error.message}`);
  return storagePath;
}

async function uploadCustomerFile(admin, customerId, fileType, buffer, mimeType, ext) {
  const storagePath = `${customerId}/${fileType}/${randomUUID()}.${ext}`;
  const { error } = await admin.storage.from("customer-files").upload(storagePath, buffer, {
    upsert: false,
    contentType: mimeType,
    cacheControl: "3600",
  });
  if (error) throw new Error(`customer upload: ${error.message}`);
  const { data } = admin.storage.from("customer-files").getPublicUrl(storagePath);
  return { storagePath, publicUrl: data?.publicUrl ?? null };
}

async function insertProjectAsset(admin, row) {
  const { data, error } = await admin.from("project_assets").insert(row).select("id").single();
  if (error) throw new Error(`project_assets: ${error.message}`);
  return data;
}

async function insertCustomerAsset(admin, row) {
  const { data, error } = await admin.from("customer_assets").insert(row).select("id").single();
  if (error) throw new Error(`customer_assets: ${error.message}`);
  return data;
}

async function insertAssetLink(admin, row) {
  const { error } = await admin.from("asset_links").insert(row);
  if (error && !error.message.includes("duplicate")) {
    throw new Error(`asset_links: ${error.message}`);
  }
}

function designForKw(kw) {
  const panelWatt = 550;
  const panelCount = Math.max(1, Math.round((kw * 1000) / panelWatt));
  const systemKw = Math.round(((panelCount * panelWatt) / 1000) * 10) / 10;
  const stringCount = Math.max(1, Math.ceil(panelCount / 12));
  const modulesPerString = Math.ceil(panelCount / stringCount);
  const inverterKw = systemKw <= 5 ? 5 : systemKw <= 10 ? 10 : 25;
  return {
    system_kw: systemKw,
    panel_count: panelCount,
    panel_watt: panelWatt,
    panel_model: "Waaree 550W Mono PERC DCR",
    inverter_kw: inverterKw,
    inverter_model: `Growatt ${inverterKw}kW 3-Phase`,
    structure_type: kw >= 15 ? "elevated" : "flush",
    string_count: stringCount,
    modules_per_string: modulesPerString,
    annual_yield_kwh: Math.round(systemKw * 1450),
    performance_ratio: 0.78,
  };
}

async function seedDesign(admin, project, specs, label) {
  const { count } = await admin
    .from("project_designs")
    .select("id", { count: "exact", head: true })
    .eq("project_id", project.id);

  if ((count ?? 0) > 0) {
    console.log("  design: already exists, skip");
    return;
  }

  await admin
    .from("project_designs")
    .update({ is_current: false })
    .eq("project_id", project.id)
    .eq("is_current", true);

  const { error } = await admin.from("project_designs").insert({
    organization_id: project.organization_id,
    project_id: project.id,
    version_number: 1,
    version_label: label,
    is_current: true,
    revision_notes: `${DOC_TAG} — preview design version`,
    ...specs,
  });
  if (error) throw new Error(`project_designs: ${error.message}`);
  console.log("  design: V1 created");
}

async function seedProjectDoc(admin, project, category, fileName, pdfTitle) {
  const existing = await admin
    .from("project_assets")
    .select("id")
    .eq("project_id", project.id)
    .eq("category", category)
    .is("archived_at", null)
    .limit(1);
  if ((existing.data ?? []).length > 0) {
    console.log(`  doc ${category}: already exists, skip`);
    return;
  }

  const buffer = minimalPdf(pdfTitle);
  const storagePath = await uploadProjectFile(
    admin,
    project.organization_id,
    project.id,
    buffer,
    "application/pdf",
    "pdf"
  );

  await insertProjectAsset(admin, {
    organization_id: project.organization_id,
    customer_id: project.lead_id,
    project_id: project.id,
    category,
    storage_bucket: "project-files",
    storage_path: storagePath,
    filename: fileName,
    mime_type: "application/pdf",
    size_bytes: buffer.length,
    notes: `${DOC_TAG} — ${category}`,
  });
  console.log(`  doc ${category}: ${fileName}`);
}

async function seedCustomerPhoto(admin, project, category, fileName) {
  const existing = await admin
    .from("customer_assets")
    .select("id")
    .eq("customer_id", project.lead_id)
    .eq("category", category)
    .is("archived_at", null)
    .limit(1);
  if ((existing.data ?? []).length > 0) {
    console.log(`  photo ${category}: already exists, skip`);
    return;
  }

  const { storagePath, publicUrl } = await uploadCustomerFile(
    admin,
    project.lead_id,
    "site_image",
    MINI_PNG,
    "image/png",
    "png"
  );

  const asset = await insertCustomerAsset(admin, {
    organization_id: project.organization_id,
    customer_id: project.lead_id,
    category,
    storage_bucket: "customer-files",
    storage_path: storagePath,
    filename: fileName,
    mime_type: "image/png",
    size_bytes: MINI_PNG.length,
    notes: `${DOC_TAG} — ${category}`,
  });

  await insertAssetLink(admin, {
    organization_id: project.organization_id,
    asset_id: asset.id,
    customer_id: project.lead_id,
    project_id: project.id,
    link_role: category,
  });
  console.log(`  photo ${category}: ${fileName}`);
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

  await ensureBucket(admin, "project-files", { public: false });
  await ensureBucket(admin, "customer-files", { public: true });

  const { data: projects, error } = await admin
    .from("projects")
    .select("*")
    .ilike("detail", `%${PROJECT_TAG}%`)
    .order("project_code", { ascending: true });

  if (error) {
    console.error("projects fetch failed:", error.message);
    process.exit(1);
  }

  if (!projects?.length) {
    console.error("No UI preview projects found. Run: node scripts/seed-ui-preview-projects.mjs");
    process.exit(1);
  }

  console.log(`Found ${projects.length} preview project(s).\n`);

  for (const project of projects) {
    const kw = Number.parseFloat(String(project.capacity_kw ?? project.solar_kw ?? "5")) || 5;
    const name = project.official_name ?? project.project_code;
    const stage = project.current_stage ?? "survey";
    console.log(`→ ${name} (${stage}, ${kw} kW)`);

    if (!project.lead_id) {
      console.warn("  skip: no lead_id");
      continue;
    }

    const specs = designForKw(kw);

    if (stage === "survey") {
      await seedCustomerPhoto(admin, project, "roof_photo", "Preview-roof-survey.png");
      await seedCustomerPhoto(admin, project, "meter_photo", "Preview-meter.png");
      await seedCustomerPhoto(admin, project, "db_photo", "Preview-db-panel.png");
    }

    if (["design", "installation", "net_metering", "approval"].includes(stage)) {
      await seedDesign(admin, project, specs, `V1 — ${kw} kW Initial`);
      await seedProjectDoc(
        admin,
        project,
        "sld",
        `Preview-SLD-${kw}kW.pdf`,
        `Single Line Diagram — ${kw} kW Preview`
      );
      await seedProjectDoc(
        admin,
        project,
        "agreement",
        "Preview-customer-agreement.pdf",
        "Customer Agreement — Preview"
      );
      await seedProjectDoc(admin, project, "aadhaar", "Preview-aadhaar.pdf", "Aadhaar — Preview");
      await seedProjectDoc(admin, project, "pan", "Preview-pan.pdf", "PAN — Preview");
      await seedCustomerPhoto(admin, project, "roof_photo", "Preview-roof-survey.png");
    }

    if (["installation", "net_metering", "approval"].includes(stage)) {
      await seedProjectDoc(
        admin,
        project,
        "advance_receipt",
        "Preview-advance-receipt.pdf",
        "Advance Receipt — Preview"
      );
      await seedProjectDoc(
        admin,
        project,
        "installation_photo",
        "Preview-install-progress.pdf",
        "Installation Progress — Preview"
      );
    }

    if (stage === "net_metering") {
      await seedProjectDoc(
        admin,
        project,
        "net_metering",
        "Preview-net-metering-application.pdf",
        "Net Metering Application — Preview"
      );
    }

    console.log("");
  }

  console.log("Done — open any [Preview] project → Documents / Design tabs.");
  console.log("Remove with: node scripts/cleanup-ui-preview-projects.mjs");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
