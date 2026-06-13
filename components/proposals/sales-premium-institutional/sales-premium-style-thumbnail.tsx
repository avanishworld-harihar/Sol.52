"use client";

import { cn } from "@/lib/utils";
import type { SalesPremiumStyleId } from "@/lib/sales-premium-styles";

type Props = {
  styleId: SalesPremiumStyleId;
  className?: string;
};

/** Mini page mockup for Gamma-style template thumbnails. */
export function SalesPremiumStyleThumbnail({ styleId, className }: Props) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-slate-200/90 bg-white shadow-sm dark:border-white/15 dark:bg-slate-900",
        className
      )}
      aria-hidden
    >
      {styleId === "institutional" ? <InstitutionalThumb /> : null}
      {styleId === "journey" ? <JourneyThumb /> : null}
      {styleId === "savings_focus" ? <SavingsFocusThumb /> : null}
    </div>
  );
}

function InstitutionalThumb() {
  return (
    <div className="flex h-full flex-col p-[8%] text-left">
      <div className="text-[5px] font-bold tracking-[0.2em] text-slate-800">
        HARIHAR <span className="font-light text-slate-400">SOLAR</span>
      </div>
      <div className="mt-[10%] text-[3px] font-semibold uppercase tracking-wider text-blue-600">
        Energy masterplan
      </div>
      <div className="mt-[4%] text-[7px] font-semibold leading-tight text-slate-900">Customer Name</div>
      <div className="mt-[6%] h-[1px] w-[18%] bg-blue-600" />
      <div className="mt-[6%] space-y-[3px]">
        <div className="h-[2px] w-[70%] rounded-full bg-slate-200" />
        <div className="h-[2px] w-[55%] rounded-full bg-slate-100" />
      </div>
      <div className="mt-auto flex justify-between pt-[8%] text-[2.5px] text-slate-400">
        <span>Location</span>
        <span>3 kW</span>
      </div>
    </div>
  );
}

function JourneyThumb() {
  return (
    <div className="flex h-full flex-col">
      <div className="h-[28%] bg-gradient-to-br from-teal-500 via-emerald-500 to-sky-600" />
      <div className="flex flex-1 flex-col gap-[6%] p-[8%]">
        <div className="h-[8%] rounded-sm bg-slate-100" />
        <div className="flex gap-[4%]">
          <div className="h-[14%] flex-1 rounded-sm bg-amber-100" />
          <div className="h-[14%] flex-1 rounded-sm bg-emerald-100" />
        </div>
        <div className="h-[10%] rounded-sm bg-slate-50" />
        <div className="mt-auto grid grid-cols-3 gap-[3%]">
          <div className="h-[12%] rounded-sm bg-slate-100" />
          <div className="h-[12%] rounded-sm bg-slate-100" />
          <div className="h-[12%] rounded-sm bg-slate-100" />
        </div>
      </div>
    </div>
  );
}

function SavingsFocusThumb() {
  return (
    <div className="flex h-full flex-col p-[8%]">
      <div className="rounded-md bg-slate-900 px-[6%] py-[10%] text-center">
        <div className="text-[3px] uppercase tracking-wider text-slate-400">Annual saving</div>
        <div className="mt-[4%] text-[8px] font-bold text-emerald-400">₹97k</div>
      </div>
      <div className="mt-[8%] flex gap-[4%]">
        {[40, 65, 50].map((h, i) => (
          <div key={i} className="flex flex-1 flex-col justify-end">
            <div
              className={cn("rounded-t-sm", i === 1 ? "bg-red-200" : "bg-slate-200")}
              style={{ height: `${h * 0.22}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-[8%] space-y-[4%]">
        <div className="h-[6%] rounded-sm bg-blue-50" />
        <div className="h-[6%] rounded-sm bg-slate-100" />
      </div>
    </div>
  );
}
