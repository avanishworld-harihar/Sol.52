"use client";

import { ResidentialBrandCatalogPanel } from "@/components/residential/residential-brand-catalog-panel";
import { Button } from "@/components/ui/button";
import { FloatingLabelNumericInput } from "@/components/ui/floating-label-input";
import { useToast } from "@/components/ui/toast-center";
import {
  formatPanelLabel,
  PANEL_CATALOG,
  type PanelCatalogEntry,
} from "@/lib/commercial-panel-catalog";
import { ensureBrandCatalog } from "@/lib/residential-brand-catalog";
import { loadInstallerRateCard, saveInstallerRateCard } from "@/lib/installer-rate-card-client";
import { defaultResidentialConfigForBuilder } from "@/lib/residential-proposal-config";
import type { ResidentialProposalConfig } from "@/lib/residential-requirements-schema";
import { cn } from "@/lib/utils";
import { IndianRupee, Loader2, Save, Sparkles } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

function commercialRateMapFromCard(
  entries: { id: string; ratePerWpInr: number }[] | undefined
): Map<string, number> {
  const map = new Map<string, number>();
  for (const e of PANEL_CATALOG) {
    map.set(e.id, e.ratePerWpInr);
  }
  for (const o of entries ?? []) {
    map.set(o.id, o.ratePerWpInr);
  }
  return map;
}

export function InstallerRateCardWorkspace() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<ResidentialProposalConfig>(() =>
    defaultResidentialConfigForBuilder(5, "requirement")
  );
  const [commercialRates, setCommercialRates] = useState<Map<string, number>>(() =>
    commercialRateMapFromCard(undefined)
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const card = await loadInstallerRateCard(true);
      setConfig(
        ensureBrandCatalog({
          ...defaultResidentialConfigForBuilder(5, "requirement"),
          brandCatalog: card.residentialCatalog,
        })
      );
      setCommercialRates(commercialRateMapFromCard(card.commercialPanelRates));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const commercialRows = useMemo(() => PANEL_CATALOG, []);

  async function handleSave() {
    setSaving(true);
    try {
      const normalized = ensureBrandCatalog(config);
      await saveInstallerRateCard({
        residentialCatalog: normalized.brandCatalog,
        commercialPanelRates: commercialRows.map((e) => ({
          id: e.id,
          ratePerWpInr: commercialRates.get(e.id) ?? e.ratePerWpInr,
        })),
      });
      toast.push({
        tone: "success",
        title: "Rate card saved",
        description:
          "Smart catalog rates apply to residential and commercial proposals. Existing customer quotes keep their saved snapshot.",
      });
    } catch (e) {
      toast.push({
        tone: "error",
        title: "Save failed",
        description: e instanceof Error ? e.message : "Could not save rate card.",
      });
    } finally {
      setSaving(false);
    }
  }

  function patchCommercialRate(entry: PanelCatalogEntry, rate: number | undefined) {
    setCommercialRates((prev) => {
      const next = new Map(prev);
      next.set(entry.id, rate !== undefined ? Math.max(0, rate) : entry.ratePerWpInr);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center gap-2 text-sm font-medium text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading rate card…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-r from-indigo-50/90 to-sky-50/70 px-4 py-3.5 dark:border-indigo-800/40 dark:from-indigo-950/30 dark:to-sky-950/20">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">
          One place for all customer rates
        </p>
        <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
          One Smart catalog — <strong>plant ₹ per kW</strong> for both{" "}
          <strong>Residential</strong> and <strong>Commercial</strong>. Enter DCR and Non-DCR prices
          manually for each kW row — no automatic 30% discount.
        </p>
        <p className="mt-2 text-[11px] text-slate-500">
          <Link href="/proposal" className="font-bold text-indigo-700 underline dark:text-indigo-300">
            New proposal
          </Link>{" "}
          → pricing studio &quot;Save&quot; also syncs residential edits back here.
        </p>
      </div>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Smart catalog — plant ₹ by kW (Residential + Commercial)
          </h2>
        </div>
        <ResidentialBrandCatalogPanel config={config} onChange={setConfig} />
      </section>

      <details className="rounded-2xl border border-slate-200/90 bg-slate-50/50 dark:border-white/10 dark:bg-white/[0.02]">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-bold text-slate-800 dark:text-slate-200 [&::-webkit-details-marker]:hidden">
          <span className="inline-flex items-center gap-2">
            <IndianRupee className="h-4 w-4 text-emerald-600" />
            Advanced — panel-only ₹/Wp (optional BOM detail)
          </span>
        </summary>
        <div className="border-t border-slate-200/80 px-4 pb-4 pt-3 dark:border-white/10">
          <p className="mb-3 text-xs text-slate-600 dark:text-slate-400">
            Commercial proposals now use the Smart catalog above for turnkey plant price. These module
            rates are only for optional engineering BOM line items — you can skip them for simple quotes.
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-200/90 dark:border-white/10">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:border-white/10 dark:bg-white/[0.03]">
                <th className="px-3 py-2">Module</th>
                <th className="px-3 py-2">₹ / Wp</th>
              </tr>
            </thead>
            <tbody>
              {commercialRows.map((entry) => (
                <tr key={entry.id} className="border-b border-slate-100 dark:border-white/5">
                  <td className="px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {formatPanelLabel(entry)}
                  </td>
                  <td className="px-2 py-1.5">
                    <FloatingLabelNumericInput
                      label="₹/Wp"
                      live
                      value={commercialRates.get(entry.id) ?? entry.ratePerWpInr}
                      onValueChange={(n) => patchCommercialRate(entry, n)}
                      className="h-9 max-w-[8rem] rounded-lg text-xs font-bold"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      </details>

      <div className="sticky bottom-[5.5rem] z-10 flex justify-end lg:bottom-4">
        <Button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className={cn(
            "gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-bold text-white shadow-lg",
            "hover:bg-slate-800 disabled:opacity-60"
          )}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save rate card
        </Button>
      </div>
    </div>
  );
}
