"use client";

/**
 * More → Brand & Proposals — company profile, contact, branding, banking.
 * Saved settings freeze onto proposal ppt_input and drive cover / footer / closing identity.
 */

import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  emptyPortfolioProject,
  type BrandSectionDisplayPreference,
  type CompanyCredentials,
  type CompanyProfileCore,
  type PortfolioProject,
  type PortfolioSector,
  type ProposalColorStyle,
  type ProposalTypographyPreset,
} from "@/lib/company-profile-schema";
import {
  DEFAULT_PROPOSAL_BRANDING_SETTINGS,
  PROPOSAL_BRANDING_UPDATED_EVENT,
  readProposalBrandingSettings,
  type ProposalAmcYears,
  type ProposalBrandDisplayMode,
  type ProposalBrandingSettings,
  type ProposalThemePreset,
  writeProposalBrandingSettings,
} from "@/lib/proposal-branding-settings";
import { AnimatePresence, motion } from "framer-motion";
import {
  Building2,
  ChevronDown,
  ImageIcon,
  Landmark,
  Palette,
  Plus,
  QrCode,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";

type Props = {
  markSaved: (message: string) => void;
  markIssue: (message: string) => void;
};

type SettingsSectionId =
  | "companyProfile"
  | "branding"
  | "credentials"
  | "portfolio"
  | "banking"
  | "appearance";

export function BrandProposalsSettingsPanel({ markSaved, markIssue }: Props) {
  const [openSection, setOpenSection] = useState<SettingsSectionId | null>("companyProfile");

  const [companyName, setCompanyName] = useState(DEFAULT_PROPOSAL_BRANDING_SETTINGS.installerName);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfileCore>(
    DEFAULT_PROPOSAL_BRANDING_SETTINGS.companyProfile
  );
  const [companyContact, setCompanyContact] = useState(DEFAULT_PROPOSAL_BRANDING_SETTINGS.installerContact);
  const [companyEmail, setCompanyEmail] = useState(DEFAULT_PROPOSAL_BRANDING_SETTINGS.installerEmail);
  const [companyLogo, setCompanyLogo] = useState(DEFAULT_PROPOSAL_BRANDING_SETTINGS.installerLogoUrl);

  const [brandDisplayPreference, setBrandDisplayPreference] = useState<
    ProposalBrandDisplayMode | "nameOnly"
  >(DEFAULT_PROPOSAL_BRANDING_SETTINGS.brandDisplayPreference);
  const [brandSectionRules, setBrandSectionRules] = useState(
    DEFAULT_PROPOSAL_BRANDING_SETTINGS.brandSectionRules
  );

  const [credentials, setCredentials] = useState<CompanyCredentials>(
    DEFAULT_PROPOSAL_BRANDING_SETTINGS.companyCredentials
  );
  const [portfolioProjects, setPortfolioProjects] = useState<PortfolioProject[]>([]);

  const [bankAccName, setBankAccName] = useState(DEFAULT_PROPOSAL_BRANDING_SETTINGS.bankAccountName);
  const [bankAccNo, setBankAccNo] = useState(DEFAULT_PROPOSAL_BRANDING_SETTINGS.bankAccountNumber);
  const [bankIfsc, setBankIfsc] = useState(DEFAULT_PROPOSAL_BRANDING_SETTINGS.bankIfsc);
  const [bankBranch, setBankBranch] = useState(DEFAULT_PROPOSAL_BRANDING_SETTINGS.bankBranch);
  const [bankUpi, setBankUpi] = useState(DEFAULT_PROPOSAL_BRANDING_SETTINGS.bankUpiId);
  const [paymentQrCodeUrl, setPaymentQrCodeUrl] = useState(
    DEFAULT_PROPOSAL_BRANDING_SETTINGS.paymentQrCodeUrl
  );

  const [themePreset, setThemePreset] = useState<ProposalThemePreset>(
    DEFAULT_PROPOSAL_BRANDING_SETTINGS.themePreset
  );
  const [colorStyle, setColorStyle] = useState<ProposalColorStyle>("greenBlueClassic");
  const [typographyPreset, setTypographyPreset] = useState<ProposalTypographyPreset>("montserrat");
  const [amcYears, setAmcYears] = useState<ProposalAmcYears>(DEFAULT_PROPOSAL_BRANDING_SETTINGS.amcSelectedYears);

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);
  const [uploadingPortfolioId, setUploadingPortfolioId] = useState<string | null>(null);

  const hydrate = useCallback(() => {
    const s = readProposalBrandingSettings();
    setCompanyName(s.installerName);
    setCompanyProfile(s.companyProfile);
    setCompanyContact(s.installerContact);
    setCompanyEmail(s.installerEmail);
    setCompanyLogo(s.installerLogoUrl);
    setBrandDisplayPreference(s.brandDisplayPreference);
    setBrandSectionRules(s.brandSectionRules);
    setCredentials(s.companyCredentials);
    setPortfolioProjects(s.portfolioProjects);
    setBankAccName(s.bankAccountName);
    setBankAccNo(s.bankAccountNumber);
    setBankIfsc(s.bankIfsc);
    setBankBranch(s.bankBranch);
    setBankUpi(s.bankUpiId);
    setPaymentQrCodeUrl(s.paymentQrCodeUrl);
    setThemePreset(s.proposalAppearance.themePreset);
    setColorStyle(s.proposalAppearance.colorStyle);
    setTypographyPreset(s.proposalAppearance.typographyPreset);
    setAmcYears(s.amcSelectedYears);
  }, []);

  useEffect(() => {
    hydrate();
    const onUpdate = () => hydrate();
    window.addEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, onUpdate);
  }, [hydrate]);

  function buildSnapshot(overrides: Partial<ProposalBrandingSettings> = {}): Partial<ProposalBrandingSettings> {
    const appearance = {
      themePreset,
      colorStyle,
      typographyPreset,
    };
    const profile = {
      ...companyProfile,
      gstNumber: companyProfile.gstNumber.trim().toUpperCase(),
      pan: companyProfile.pan.trim().toUpperCase(),
      registrationNumber: companyProfile.registrationNumber.trim().toUpperCase(),
    };
    return {
      installerName: companyName.trim(),
      installerContact: companyContact.trim(),
      installerEmail: companyEmail.trim(),
      installerLogoUrl: companyLogo.trim(),
      paymentQrCodeUrl: paymentQrCodeUrl.trim(),
      amcSelectedYears: amcYears,
      bankAccountName: bankAccName.trim(),
      bankAccountNumber: bankAccNo.trim(),
      bankIfsc: bankIfsc.trim(),
      bankBranch: bankBranch.trim(),
      bankUpiId: bankUpi.trim(),
      proposalSiteImages: readProposalBrandingSettings().proposalSiteImages,
      companyProfile: profile,
      companyCredentials: credentials,
      portfolioProjects,
      brandSectionRules,
      brandDisplayPreference,
      proposalAppearance: appearance,
      ...overrides,
    };
  }

  function saveAll(message = "Company profile settings saved.") {
    writeProposalBrandingSettings(buildSnapshot());
    markSaved(message);
  }

  async function uploadLogo(file: File | null) {
    if (!file) return;
    setUploadingLogo(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/company-logo-upload", { method: "POST", body: form });
      const payload = (await res.json()) as { ok?: boolean; url?: string; error?: string };
      if (!res.ok || !payload.ok || !payload.url) throw new Error(payload.error || "Logo upload failed.");
      setCompanyLogo(payload.url);
      writeProposalBrandingSettings(buildSnapshot({ installerLogoUrl: payload.url }));
      markSaved("Logo uploaded and saved.");
    } catch (e) {
      markIssue(e instanceof Error ? e.message : "Logo upload failed.");
    } finally {
      setUploadingLogo(false);
    }
  }

  async function uploadPaymentQr(file: File | null) {
    if (!file) return;
    setUploadingQr(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/company-logo-upload", { method: "POST", body: form });
      const payload = (await res.json()) as { ok?: boolean; url?: string; error?: string };
      if (!res.ok || !payload.ok || !payload.url) throw new Error(payload.error || "QR upload failed.");
      setPaymentQrCodeUrl(payload.url);
      writeProposalBrandingSettings(buildSnapshot({ paymentQrCodeUrl: payload.url }));
      markSaved("Payment QR code uploaded and saved.");
    } catch (e) {
      markIssue(e instanceof Error ? e.message : "QR upload failed.");
    } finally {
      setUploadingQr(false);
    }
  }

  async function uploadPortfolioPhoto(projectId: string, file: File | null) {
    if (!file) return;
    setUploadingPortfolioId(projectId);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/site-photo-upload", { method: "POST", body: form });
      const payload = (await res.json()) as { ok?: boolean; url?: string; error?: string };
      if (!res.ok || !payload.ok || !payload.url) throw new Error(payload.error || "Photo upload failed.");
      setPortfolioProjects((prev) => {
        const next = prev.map((p) => (p.id === projectId ? { ...p, photoUrl: payload.url! } : p));
        writeProposalBrandingSettings(buildSnapshot({ portfolioProjects: next }));
        return next;
      });
      markSaved("Portfolio photo uploaded.");
    } catch (e) {
      markIssue(e instanceof Error ? e.message : "Photo upload failed.");
    } finally {
      setUploadingPortfolioId(null);
    }
  }

  function patchCredential<K extends keyof CompanyCredentials>(key: K, value: string) {
    setCredentials((c) => ({ ...c, [key]: value }));
  }

  function patchPortfolio(id: string, patch: Partial<PortfolioProject>) {
    setPortfolioProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  function removePortfolio(id: string) {
    setPortfolioProjects((prev) => prev.filter((p) => p.id !== id));
  }

  function applyGlobalBrandPreference(pref: ProposalBrandDisplayMode | "nameOnly") {
    setBrandDisplayPreference(pref);
    if (pref === "logoOnly") {
      setBrandSectionRules({
        cover: "logoOnly",
        header: "logoOnly",
        footer: "logoOnly",
        closing: "logoOnly",
      });
    } else if (pref === "logoAndName") {
      setBrandSectionRules({
        cover: "logoAndName",
        header: "logoAndName",
        footer: "logoAndName",
        closing: "logoAndName",
      });
    } else if (pref === "nameOnly") {
      setBrandSectionRules({
        cover: "nameOnly",
        header: "nameOnly",
        footer: "nameOnly",
        closing: "nameOnly",
      });
    }
  }

  const sections: {
    id: SettingsSectionId;
    title: string;
    description: string;
    icon: typeof Building2;
    content: ReactNode;
  }[] = [
    {
      id: "companyProfile",
      title: "1. Company Profile",
      description: "Identity and contact — used when generating new proposals.",
      icon: Building2,
      content: (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <LabeledInput label="Company name" value={companyName} onChange={setCompanyName} placeholder="Shivangan Solar" />
          <div className="sm:col-span-2">
            <LabeledInput label="Tagline (optional)" value={companyProfile.tagline} onChange={(v) => setCompanyProfile({ ...companyProfile, tagline: v })} placeholder="100% Local · Satna · Madhya Pradesh" />
          </div>
          <LabeledInput label="Legal name (optional)" value={companyProfile.legalName} onChange={(v) => setCompanyProfile({ ...companyProfile, legalName: v })} placeholder="Registered entity name" />
          <LabeledInput label="Contact person (optional)" value={companyProfile.contactPerson} onChange={(v) => setCompanyProfile({ ...companyProfile, contactPerson: v })} placeholder="Director / Owner" />
          <LabeledInput label="Contact designation (optional)" value={companyProfile.contactPersonDesignation} onChange={(v) => setCompanyProfile({ ...companyProfile, contactPersonDesignation: v })} placeholder="Director, Proprietor" />
          <LabeledInput label="Phone" value={companyContact} onChange={setCompanyContact} placeholder="+91-9993322267" />
          <LabeledInput label="Email" value={companyEmail} onChange={setCompanyEmail} placeholder="contact@company.com" />
          <LabeledInput label="GSTIN (optional)" value={companyProfile.gstNumber} onChange={(v) => setCompanyProfile({ ...companyProfile, gstNumber: v.toUpperCase() })} placeholder="23AAAAA0000A1Z5" />
          <LabeledInput label="PAN (optional)" value={companyProfile.pan} onChange={(v) => setCompanyProfile({ ...companyProfile, pan: v.toUpperCase() })} placeholder="AAAAA0000A" />
          <LabeledInput label="Registration no. (optional)" value={companyProfile.registrationNumber} onChange={(v) => setCompanyProfile({ ...companyProfile, registrationNumber: v.toUpperCase() })} placeholder="CIN / LLPIN" />
          <div className="sm:col-span-2">
            <LabeledInput label="Address (optional)" value={companyProfile.address} onChange={(v) => setCompanyProfile({ ...companyProfile, address: v })} placeholder="Office / workshop address" />
          </div>
          <div className="sm:col-span-2">
            <LabeledInput label="Website (optional)" value={companyProfile.website} onChange={(v) => setCompanyProfile({ ...companyProfile, website: v })} placeholder="https://yourcompany.com" />
          </div>
        </div>
      ),
    },
    {
      id: "branding",
      title: "2. Branding",
      description: "Logo and how it appears on proposal surfaces.",
      icon: ImageIcon,
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <LabeledInput label="Logo URL" value={companyLogo} onChange={setCompanyLogo} placeholder="https://.../logo.png" />
            <label className="inline-flex min-h-10 w-fit cursor-pointer items-center justify-center rounded-xl border border-brand-300 bg-brand-50 px-4 text-xs font-bold text-brand-800 hover:bg-brand-100">
              {uploadingLogo ? <Skeleton className="mr-2 h-4 w-4 rounded-full" /> : <UploadCloud className="mr-2 h-4 w-4" />}
              Upload logo
              <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={(e) => void uploadLogo(e.target.files?.[0] ?? null)} disabled={uploadingLogo} />
            </label>
          </div>

          <div className="rounded-xl border border-white/50 bg-white/60 p-3 space-y-3">
            <p className="text-xs font-extrabold text-brand-900">Display options</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {(
                [
                  { id: "logoOnly" as const, label: "Logo only", desc: "Hide company name" },
                  { id: "logoAndName" as const, label: "Logo + name", desc: "Show both" },
                  { id: "nameOnly" as const, label: "Name only", desc: "Phase 2 templates" },
                  { id: "customPerSection" as const, label: "Per section", desc: "Cover / header / footer / closing" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => applyGlobalBrandPreference(opt.id)}
                  className={cn(
                    "rounded-xl border px-3 py-3 text-left transition",
                    brandDisplayPreference === opt.id ? "border-brand-500 bg-brand-50" : "border-slate-200 bg-white/80 hover:border-brand-300"
                  )}
                >
                  <p className="text-sm font-extrabold text-brand-900">{opt.label}</p>
                  <p className="mt-1 text-[11px] font-semibold text-slate-600">{opt.desc}</p>
                </button>
              ))}
            </div>
            {brandDisplayPreference === "nameOnly" ? (
              <p className="text-[11px] font-medium text-amber-800">
                Saved for future templates. Live proposals still use your previous logo/name rules until Phase 2.
              </p>
            ) : null}

            {brandDisplayPreference === "customPerSection" ? (
              <div className="space-y-2 border-t border-slate-200/70 pt-3">
                <BrandSectionRuleRow label="Cover page" value={brandSectionRules.cover} onChange={(mode) => setBrandSectionRules({ ...brandSectionRules, cover: mode })} />
                <BrandSectionRuleRow label="Header" value={brandSectionRules.header} onChange={(mode) => setBrandSectionRules({ ...brandSectionRules, header: mode })} />
                <BrandSectionRuleRow label="Footer" value={brandSectionRules.footer} onChange={(mode) => setBrandSectionRules({ ...brandSectionRules, footer: mode })} />
                <BrandSectionRuleRow label="Closing page" value={brandSectionRules.closing} onChange={(mode) => setBrandSectionRules({ ...brandSectionRules, closing: mode })} />
              </div>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      id: "credentials",
      title: "3. Company Credentials",
      description: "Optional trust signals — not shown in proposals until Phase 2.",
      icon: Landmark,
      content: (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <LabeledInput label="Years in business" value={credentials.yearsInBusiness} onChange={(v) => patchCredential("yearsInBusiness", v)} placeholder="e.g. 12" />
          <LabeledInput label="Installed capacity (MW)" value={credentials.installedCapacityMw} onChange={(v) => patchCredential("installedCapacityMw", v)} placeholder="e.g. 25" />
          <LabeledInput label="Projects completed" value={credentials.projectsCompleted} onChange={(v) => patchCredential("projectsCompleted", v)} placeholder="e.g. 180" />
          <LabeledInput label="Team size" value={credentials.teamSize} onChange={(v) => patchCredential("teamSize", v)} placeholder="e.g. 45" />
          <div className="sm:col-span-2">
            <LabeledInput label="Service coverage areas" value={credentials.serviceCoverageAreas} onChange={(v) => patchCredential("serviceCoverageAreas", v)} placeholder="Madhya Pradesh, Chhattisgarh, …" />
          </div>
          <div className="sm:col-span-2">
            <LabeledInput label="MNRE empanelment no. (optional)" value={credentials.mnreEmpanelmentNo} onChange={(v) => patchCredential("mnreEmpanelmentNo", v)} placeholder="MNRE registration / empanelment ID" />
          </div>
          <div className="sm:col-span-2">
            <LabeledInput label="Certifications" value={credentials.certifications} onChange={(v) => patchCredential("certifications", v)} placeholder="ISO, BIS, …" />
          </div>
          <div className="sm:col-span-2">
            <LabeledInput label="Awards" value={credentials.awards} onChange={(v) => patchCredential("awards", v)} placeholder="Optional" />
          </div>
          <div className="sm:col-span-2">
            <LabeledInput label="OEM partnerships" value={credentials.oemPartnerships} onChange={(v) => patchCredential("oemPartnerships", v)} placeholder="Waaree, Sungrow, …" />
          </div>
        </div>
      ),
    },
    {
      id: "portfolio",
      title: "4. Company Portfolio",
      description: "Structured project records — not auto-inserted into proposals in Phase 1.",
      icon: ImageIcon,
      content: (
        <div className="space-y-3">
          <p className="text-[11px] text-slate-600">
            Replaces the old flat site-photo list. Legacy install photos are imported here automatically. Templates can pick 0, 2, 4, or a portfolio page later.
          </p>
          {portfolioProjects.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-xs text-slate-500">
              No portfolio projects yet. Add your first completed installation.
            </p>
          ) : null}
          {portfolioProjects.map((project, index) => (
            <div key={project.id} className="rounded-xl border border-slate-200/80 bg-white/70 p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-slate-800">Project {index + 1}</p>
                <button type="button" onClick={() => removePortfolio(project.id)} className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:underline">
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <LabeledInput label="Project name" value={project.projectName} onChange={(v) => patchPortfolio(project.id, { projectName: v })} placeholder="Hotel rooftop — Indore" />
                <LabeledInput label="Capacity" value={project.capacity} onChange={(v) => patchPortfolio(project.id, { capacity: v })} placeholder="100 kW" />
                <LabeledInput label="Location" value={project.location} onChange={(v) => patchPortfolio(project.id, { location: v })} placeholder="City, State" />
                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Sector (optional)</span>
                  <select
                    value={project.sector}
                    onChange={(e) => patchPortfolio(project.id, { sector: e.target.value as PortfolioSector | "" })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800"
                  >
                    <option value="">—</option>
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                    <option value="school">School / Institution</option>
                    <option value="industrial">Industrial</option>
                  </select>
                </label>
                <LabeledInput label="Completed year (optional)" value={project.completedYear} onChange={(v) => patchPortfolio(project.id, { completedYear: v })} placeholder="e.g. 2024" />
                <div className="sm:col-span-2">
                  <LabeledInput label="Description (optional)" value={project.description} onChange={(v) => patchPortfolio(project.id, { description: v })} placeholder="Brief scope or outcome" />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {project.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={project.photoUrl} alt="" className="h-16 w-24 rounded-lg border border-slate-200 object-cover" />
                ) : null}
                <label className="inline-flex min-h-9 cursor-pointer items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-[11px] font-bold text-slate-700 hover:bg-slate-100">
                  {uploadingPortfolioId === project.id ? "Uploading…" : "Upload project photo"}
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => void uploadPortfolioPhoto(project.id, e.target.files?.[0] ?? null)} disabled={uploadingPortfolioId === project.id} />
                </label>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setPortfolioProjects((p) => [...p, emptyPortfolioProject()])}
            className="inline-flex items-center gap-2 rounded-xl border border-dashed border-brand-300 bg-brand-50/50 px-4 py-2.5 text-xs font-bold text-brand-800 hover:bg-brand-50"
          >
            <Plus className="h-4 w-4" /> Add portfolio project
          </button>
        </div>
      ),
    },
    {
      id: "banking",
      title: "5. Banking & Payment",
      description: "Bank transfer details and optional payment QR.",
      icon: Landmark,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <LabeledInput label="Account name" value={bankAccName} onChange={setBankAccName} placeholder="Company name" />
            <LabeledInput label="Account number" value={bankAccNo} onChange={setBankAccNo} placeholder="Account No." />
            <LabeledInput label="IFSC" value={bankIfsc} onChange={setBankIfsc} placeholder="IFSC" />
            <LabeledInput label="Branch" value={bankBranch} onChange={setBankBranch} placeholder="Branch" />
            <div className="sm:col-span-2">
              <LabeledInput label="UPI ID" value={bankUpi} onChange={setBankUpi} placeholder="company@bank" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="inline-flex min-h-10 w-fit cursor-pointer items-center justify-center rounded-xl border border-brand-300 bg-brand-50 px-4 text-xs font-bold text-brand-800 hover:bg-brand-100">
                {uploadingQr ? <Skeleton className="mr-2 h-4 w-4 rounded-full" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                Upload payment QR
                <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => void uploadPaymentQr(e.target.files?.[0] ?? null)} disabled={uploadingQr} />
              </label>
              {paymentQrCodeUrl ? (
                <button type="button" onClick={() => { setPaymentQrCodeUrl(""); writeProposalBrandingSettings(buildSnapshot({ paymentQrCodeUrl: "" })); markSaved("Payment QR removed."); }} className="block text-[11px] font-semibold text-rose-600 hover:underline">
                  Remove QR
                </button>
              ) : null}
            </div>
            {paymentQrCodeUrl ? (
              <div className="flex justify-center sm:justify-end">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={paymentQrCodeUrl} alt="Payment QR" className="h-28 w-28 rounded-xl border border-slate-200 object-contain p-1" />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-6">
                <QrCode className="h-7 w-7 text-slate-300" />
                <p className="text-[11px] text-slate-400">Optional QR preview</p>
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      id: "appearance",
      title: "6. Proposal Appearance",
      description: "Theme and typography presets for residential deck exports.",
      icon: Palette,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <ThemePresetCard title="Green / Blue Classic" desc="Trusted enterprise tone" active={themePreset === "greenBlueClassic"} onClick={() => { setThemePreset("greenBlueClassic"); setColorStyle("greenBlueClassic"); }} />
            <ThemePresetCard title="Green / Blue Vivid" desc="High-energy conversion" active={themePreset === "greenBlueVivid"} onClick={() => { setThemePreset("greenBlueVivid"); setColorStyle("greenBlueVivid"); }} />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Color style</span>
              <select value={colorStyle} onChange={(e) => setColorStyle(e.target.value as ProposalColorStyle)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800">
                <option value="greenBlueClassic">Green / Blue Classic</option>
                <option value="greenBlueVivid">Green / Blue Vivid</option>
                <option value="neutralSlate">Neutral Slate</option>
              </select>
            </label>
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Typography preset</span>
              <select value={typographyPreset} onChange={(e) => setTypographyPreset(e.target.value as ProposalTypographyPreset)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800">
                <option value="montserrat">Montserrat (default)</option>
                <option value="inter">Inter</option>
                <option value="system">System UI</option>
              </select>
            </label>
          </div>
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Default AMC term (new proposals)</p>
            <div className="inline-flex rounded-full border border-slate-300 bg-white p-0.5">
              {([1, 5, 10] as const).map((y) => (
                <button key={y} type="button" onClick={() => setAmcYears(y)} className={cn("rounded-full px-3 py-1.5 text-xs font-semibold transition", amcYears === y ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50")}>
                  {y} yr{y === 1 ? "" : "s"}
                </button>
              ))}
            </div>
          </div>
          <p className="rounded-xl border border-indigo-200/70 bg-indigo-50/80 p-3 text-xs font-medium text-indigo-900">
            Typography and color presets are stored now; proposal templates will read them in Phase 2.
          </p>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="space-y-2">
        {sections.map((section) => {
          const Icon = section.icon;
          const isOpen = openSection === section.id;
          return (
            <div key={section.id} className="overflow-hidden rounded-2xl border border-white/60 bg-white/50 dark:border-white/10 dark:bg-white/5">
              <button
                type="button"
                onClick={() => setOpenSection(isOpen ? null : section.id)}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-800">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-slate-900 dark:text-white">{section.title}</span>
                  <span className="block text-[11px] text-slate-600 dark:text-slate-400">{section.description}</span>
                </span>
                <ChevronDown className={cn("h-5 w-5 shrink-0 text-slate-400 transition", isOpen && "rotate-180")} />
              </button>
              <AnimatePresence initial={false}>
                {isOpen ? (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="border-t border-slate-200/70 px-4 pb-4 pt-3 dark:border-white/10">{section.content}</div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <button type="button" onClick={() => saveAll()} className="ss-cta-primary mt-4 w-full sm:w-auto">
        Save company profile settings
      </button>
    </>
  );
}

function LabeledInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (next: string) => void; placeholder: string }) {
  return (
    <FloatingLabelInput label={label} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
  );
}

function BrandSectionRuleRow({ label, value, onChange }: { label: string; value: BrandSectionDisplayPreference; onChange: (mode: BrandSectionDisplayPreference) => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200/80 bg-white/70 px-3 py-2.5">
      <p className="text-xs font-bold text-slate-800">{label}</p>
      <div className="inline-flex flex-wrap justify-end gap-1 rounded-full border border-slate-200 bg-slate-50 p-0.5">
        {(
          [
            { id: "logoOnly" as const, label: "Logo" },
            { id: "logoAndName" as const, label: "Logo + name" },
            { id: "nameOnly" as const, label: "Name only" },
          ] as const
        ).map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cn(
              "rounded-full px-2 py-1 text-[10px] font-bold transition",
              value === opt.id ? "bg-brand-600 text-white" : "text-slate-600 hover:text-slate-900"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ThemePresetCard({ title, desc, active, onClick }: { title: string; desc: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border px-3 py-3 text-left transition",
        active ? "border-brand-500 bg-brand-50" : "border-slate-200 bg-white/80 hover:border-brand-300"
      )}
    >
      <p className="text-sm font-extrabold text-brand-900">{title}</p>
      <p className="mt-1 text-[11px] font-semibold text-slate-600">{desc}</p>
    </button>
  );
}
