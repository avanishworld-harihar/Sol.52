"use client";

import { Button } from "@/components/ui/button";
import { Type } from "lucide-react";

export type DesignStudioMapLabel = {
  id: string;
  lng: number;
  lat: number;
  text: string;
};

export function DesignStudioLabelsInspector({
  labels,
  placing,
  onTogglePlacing,
  onRemove,
  draftText,
  onDraftTextChange,
  mobileViewOnly,
}: {
  labels: DesignStudioMapLabel[];
  placing: boolean;
  onTogglePlacing: () => void;
  onRemove: (id: string) => void;
  draftText: string;
  onDraftTextChange: (value: string) => void;
  mobileViewOnly?: boolean;
}) {
  if (mobileViewOnly) {
    return (
      <p className="text-[11px] text-slate-500">
        Map labels are viewable on the map. Add or edit on tablet or computer.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <Type className="h-4 w-4 text-slate-500" aria-hidden />
        <p className="text-xs font-extrabold text-slate-900 dark:text-white">Map labels</p>
      </div>
      <p className="text-[10px] leading-relaxed text-slate-500">
        Short pins on the map (e.g. Tank A, North wing). Not a full text editor — max 40
        characters.
      </p>
      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300">
        Label text
        <input
          value={draftText}
          maxLength={40}
          onChange={(e) => onDraftTextChange(e.target.value)}
          placeholder="e.g. Water tank"
          className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs dark:border-white/10 dark:bg-slate-950"
        />
      </label>
      <Button
        type="button"
        size="sm"
        variant={placing ? "default" : "outline"}
        className="w-full"
        onClick={onTogglePlacing}
      >
        {placing ? "Click map to place… (tap again to cancel)" : "Place label on map"}
      </Button>
      <div className="space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
          Placed ({labels.length})
        </p>
        {labels.length === 0 ? (
          <p className="text-[11px] text-slate-500">No labels yet.</p>
        ) : (
          labels.map((label) => (
            <div
              key={label.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-2.5 py-2 dark:border-white/10"
            >
              <span className="min-w-0 truncate text-[11px] font-semibold text-slate-800 dark:text-slate-100">
                {label.text}
              </span>
              <button
                type="button"
                className="shrink-0 text-[10px] font-bold text-red-600 hover:underline"
                onClick={() => onRemove(label.id)}
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
