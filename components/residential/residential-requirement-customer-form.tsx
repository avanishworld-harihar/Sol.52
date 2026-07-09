"use client";

import { FloatingLabelNumericInput, FloatingLabelSelect } from "@/components/ui/floating-label-input";
import { INDIAN_STATES_AND_UTS } from "@/lib/indian-states-uts";
import {
  isPmSuryaGharSubsidyEligible,
  LEAD_CONNECTION_TYPE_OPTIONS,
} from "@/lib/lead-connection-types";
import { useInstallerDiscoms } from "@/hooks/use-installer-discoms";
import { mergeSavedDiscomOption, resolveDiscomCode } from "@/lib/installer-region-storage";
import { ConnectionPhaseChips } from "@/components/residential/connection-phase-chips";
import type { ConnectionPhase } from "@/lib/connection-phase-pricing";
import { cn } from "@/lib/utils";
import { MapPin, Phone, User, Zap } from "lucide-react";
import { useEffect, useMemo } from "react";

export type ResidentialRequirementCustomerFields = {
  contactName: string;
  state: string;
  discom: string;
  connectionType: string;
  location: string;
  city: string;
  phone: string;
  monthlyKwh: string;
  monthlyBillInr: string;
};

type Props = {
  fields: ResidentialRequirementCustomerFields;
  onContactName: (v: string) => void;
  onState: (v: string) => void;
  onDiscom: (v: string) => void;
  onConnectionType: (v: string) => void;
  onLocation: (v: string) => void;
  onCity: (v: string) => void;
  onPhone: (v: string) => void;
  onMonthlyKwh: (v: string) => void;
  onMonthlyBillInr: (v: string) => void;
  /** When bill → kWh estimate needs state + DISCOM */
  canEstimateBillToKwh?: boolean;
  /** Estimated kWh from bill amount (computed externally from tariff engine) */
  estimatedKwhFromBill?: number;
  /** Recommended plant size from monthly consumption (kW) */
  suggestedSolarKw?: number;
  connectionPhase?: ConnectionPhase;
  onConnectionPhase?: (phase: ConnectionPhase) => void;
  className?: string;
};

function Field({
  icon: Icon,
  placeholder,
  value,
  onChange,
  required,
  inputMode,
}: {
  icon: React.ElementType;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 focus-within:border-emerald-400 dark:border-white/15 dark:bg-white/5">
      <Icon className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" aria-hidden />
      <input
        type="text"
        inputMode={inputMode}
        placeholder={placeholder}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none dark:text-slate-100"
      />
    </div>
  );
}

export function ResidentialRequirementCustomerForm({
  fields,
  onContactName,
  onState,
  onDiscom,
  onConnectionType,
  onLocation,
  onCity,
  onPhone,
  onMonthlyKwh,
  onMonthlyBillInr,
  canEstimateBillToKwh = true,
  estimatedKwhFromBill,
  suggestedSolarKw,
  connectionPhase,
  onConnectionPhase,
  className,
}: Props) {
  const { options: discomOptions, loading: discomLoading } = useInstallerDiscoms(fields.state);
  const discomSelectOptions = useMemo(
    () => mergeSavedDiscomOption(fields.discom, discomOptions),
    [fields.discom, discomOptions]
  );

  useEffect(() => {
    if (!fields.state.trim() || discomOptions.length === 0) return;
    const next = resolveDiscomCode(fields.discom.trim(), discomOptions);
    if (next !== fields.discom) onDiscom(next);
  }, [fields.state, fields.discom, discomOptions, onDiscom]);

  const selectFieldClass =
    "rounded-xl border-slate-200 bg-white text-sm font-medium dark:border-white/15 dark:bg-white/5 focus:border-emerald-500 focus:ring-emerald-200/70 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/30";
  const selectLabelBg = "bg-white dark:bg-[#161B22]";

  return (
    <div
      className={cn(
        "space-y-2.5 overflow-visible rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/60 to-white p-4 dark:border-emerald-900/40 dark:from-emerald-950/25 dark:to-transparent",
        className
      )}
    >
      <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
        Customer details
      </p>
      <Field
        icon={User}
        placeholder="Customer name *"
        value={fields.contactName}
        onChange={onContactName}
        required
      />
      <div className="grid grid-cols-1 gap-2.5 overflow-visible xl:grid-cols-2 xl:gap-3">
        <FloatingLabelSelect
          label="State / UT"
          required
          suppressHydrationWarning
          labelBackgroundClassName={selectLabelBg}
          value={fields.state}
          onChange={(e) => {
            onState(e.target.value);
            onDiscom("");
          }}
          className={selectFieldClass}
        >
          <option value="">Select state</option>
          {INDIAN_STATES_AND_UTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </FloatingLabelSelect>
        <FloatingLabelSelect
          label="DISCOM"
          required
          suppressHydrationWarning
          labelBackgroundClassName={selectLabelBg}
          value={fields.discom}
          disabled={!fields.state.trim()}
          onChange={(e) => onDiscom(e.target.value)}
          className={cn(selectFieldClass, "disabled:opacity-60")}
        >
          {!fields.state.trim() ? (
            <option value="">Select state first</option>
          ) : discomLoading && discomSelectOptions.length === 0 ? (
            <option value="">Loading DISCOMs…</option>
          ) : (
            <>
              <option value="">Select DISCOM</option>
              {discomSelectOptions.map((d) => (
                <option key={d.id} value={d.code}>
                  {d.name} ({d.code})
                </option>
              ))}
            </>
          )}
        </FloatingLabelSelect>
      </div>
      <div className="grid grid-cols-1 gap-2.5 overflow-visible">
        <FloatingLabelSelect
          label="Connection type (optional)"
          suppressHydrationWarning
          labelBackgroundClassName={selectLabelBg}
          value={fields.connectionType}
          onChange={(e) => onConnectionType(e.target.value)}
          className={selectFieldClass}
        >
          {LEAD_CONNECTION_TYPE_OPTIONS.map((o) => (
            <option key={o.value || "unset"} value={o.value}>
              {o.label}
            </option>
          ))}
        </FloatingLabelSelect>
      </div>
      <div className="grid grid-cols-1 gap-2.5 overflow-visible sm:grid-cols-2 sm:gap-3">
        <Field
          icon={MapPin}
          placeholder="Location (colony, sector, landmark)"
          value={fields.location}
          onChange={onLocation}
        />
        <Field icon={MapPin} placeholder="City *" value={fields.city} onChange={onCity} required />
      </div>
      <Field icon={Phone} placeholder="Phone (optional)" value={fields.phone} onChange={onPhone} inputMode="tel" />
      {onConnectionPhase ? (
        <ConnectionPhaseChips
          value={connectionPhase}
          onChange={onConnectionPhase}
          theme="residential"
          className="rounded-xl border border-slate-200/90 bg-white/80 px-3 py-2.5 dark:border-white/10 dark:bg-white/[0.03]"
        />
      ) : null}
      <div className="rounded-xl border border-slate-200/90 bg-white/80 p-3 dark:border-white/10 dark:bg-white/[0.03]">
        <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
          <Zap className="h-3.5 w-3.5 text-amber-500" aria-hidden />
          Electricity usage (for savings &amp; payback)
        </p>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
          <FloatingLabelNumericInput
            label="Monthly units (kWh)"
            live
            integer
            value={fields.monthlyKwh.trim() ? parseFloat(fields.monthlyKwh) : undefined}
            onValueChange={(n) => onMonthlyKwh(n != null && n > 0 ? String(Math.round(n)) : "")}
            className="h-11 w-full min-w-0 rounded-xl text-sm font-semibold"
            containerClassName="min-w-0"
            labelBackgroundClassName="bg-white/80 dark:bg-white/[0.03]"
          />
          <FloatingLabelNumericInput
            label="Monthly bill (₹)"
            live
            integer
            value={fields.monthlyBillInr.trim() ? parseFloat(fields.monthlyBillInr) : undefined}
            onValueChange={(n) => onMonthlyBillInr(n != null && n > 0 ? String(Math.round(n)) : "")}
            className="h-11 w-full min-w-0 rounded-xl text-sm font-semibold"
            containerClassName="min-w-0"
            labelBackgroundClassName="bg-white/80 dark:bg-white/[0.03]"
          />
        </div>
        <p className="mt-2 flex items-start gap-1.5 text-[10px] leading-snug text-slate-500 dark:text-slate-400">
          <Zap className="mt-0.5 h-3 w-3 shrink-0 opacity-60" aria-hidden />
          <span>
            Prefer <strong className="font-semibold text-slate-700 dark:text-slate-300">units (kWh)</strong> — check
            last 3 bills and enter average. Units vary month to month; average gives best sizing.{" "}
            Bill ₹ also works but accuracy depends on connection type (domestic vs commercial) and DISCOM slab.
          </span>
        </p>
        {estimatedKwhFromBill != null ? (
          <p className="mt-1.5 flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/80 px-2 py-1.5 text-[10px] font-medium text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-300">
            <Zap className="h-3 w-3 shrink-0" aria-hidden />
            ₹{parseInt(fields.monthlyBillInr).toLocaleString("en-IN")} ≈{" "}
            <strong>{estimatedKwhFromBill} kWh/month</strong> (estimated from your DISCOM tariff)
          </p>
        ) : null}
        {suggestedSolarKw != null && suggestedSolarKw > 0 ? (
          <p className="mt-1.5 flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50/90 px-2 py-1.5 text-[10px] font-semibold text-sky-900 dark:border-sky-800/40 dark:bg-sky-950/30 dark:text-sky-200">
            <Zap className="h-3 w-3 shrink-0 text-sky-600" aria-hidden />
            Recommended solar size: <strong>{suggestedSolarKw.toFixed(1)} kW</strong>
            <span className="font-normal text-sky-800/80 dark:text-sky-300/80">
              — applied below in Panel &amp; Solar Plant Sizing
            </span>
          </p>
        ) : null}
        {!canEstimateBillToKwh && fields.monthlyBillInr.trim() && !fields.monthlyKwh.trim() ? (
          <p className="mt-1.5 text-[10px] font-medium text-amber-800 dark:text-amber-200">
            Select state &amp; DISCOM above to convert bill ₹ → estimated kWh.
          </p>
        ) : null}
      </div>
      {!isPmSuryaGharSubsidyEligible(fields.connectionType) && fields.connectionType.trim() ? (
        <p className="rounded-lg border border-amber-200/80 bg-amber-50/80 px-2.5 py-2 text-[11px] font-medium text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
          Commercial / industrial / HT connections are not eligible for PM Surya Ghar subsidy. Pricing will show subsidy as
          ineligible.
        </p>
      ) : null}
    </div>
  );
}
