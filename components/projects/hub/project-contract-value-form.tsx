"use client";

import { Button } from "@/components/ui/button";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { useToast } from "@/components/ui/toast-center";
import { revalidateProjectHubCaches } from "@/lib/project-hub-cache";
import { patchProject, type ProjectListItem } from "@/lib/project-api-client";
import { formatInrCompact } from "@/lib/proposal-hub-insights";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

function parseInrInput(raw: string): number | null {
  const trimmed = raw.trim().replace(/,/g, "");
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n);
}

export function ProjectContractValueForm({ project }: { project: ProjectListItem }) {
  const toast = useToast();
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const stored = project.stored_contract_amount_inr;
  const suggested = project.proposal_suggested_contract_inr;

  useEffect(() => {
    setDraft(stored != null ? String(stored) : "");
    setError("");
  }, [stored, project.id]);

  async function saveContract(amount: number) {
    setBusy(true);
    setError("");
    try {
      const res = await patchProject(project.id, { contract_amount_inr: amount });
      if (!res.ok) throw new Error(res.error ?? "save_failed");
      await revalidateProjectHubCaches(project.id);
      toast.success("Contract value saved", formatInrCompact(amount));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not save";
      setError(msg);
      toast.error("Could not save contract value", msg);
    } finally {
      setBusy(false);
    }
  }

  function handleSaveManual() {
    const amount = parseInrInput(draft);
    if (amount == null) {
      setError("Enter a valid contract amount (₹0 or more)");
      return;
    }
    void saveContract(amount);
  }

  function handleUseProposal() {
    if (suggested == null) return;
    setDraft(String(suggested));
    void saveContract(suggested);
  }

  return (
    <div className="space-y-3 border-t border-slate-100 pt-3 dark:border-white/5">
      <FloatingLabelInput
        id={`project-contract-${project.id}`}
        label="Contract value (INR)"
        type="text"
        inputMode="decimal"
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          if (error) setError("");
        }}
        disabled={busy}
        className="h-11 rounded-xl border-slate-200 bg-white px-4 text-sm font-semibold tabular-nums text-slate-800 focus:border-teal-500 focus:ring-teal-200/70 dark:border-white/10 dark:bg-[#0c1017] dark:text-slate-100"
      />

      {error ? (
        <p className="text-xs font-semibold text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button
          type="button"
          size="sm"
          disabled={busy}
          onClick={handleSaveManual}
          className="gap-1.5"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : null}
          Save contract
        </Button>
        {suggested != null ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={handleUseProposal}
            className={cn("gap-1.5")}
          >
            Use proposal value ({formatInrCompact(suggested)})
          </Button>
        ) : null}
      </div>
    </div>
  );
}
