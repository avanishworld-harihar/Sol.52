"use client";

import { useState, type FocusEvent } from "react";
import { cn } from "@/lib/utils";

type Props = {
  /** Committed numeric value (undefined = not set) */
  value?: number;
  /** Shown when value is unset and field is empty */
  fallback?: number;
  onValueChange: (next: number | undefined) => void;
  /** Whole numbers only (no decimal point) */
  integer?: boolean;
  /** When true, commits parsed value on every keystroke (for derived columns that must update immediately). */
  live?: boolean;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  list?: string;
  onFocus?: (e: FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
  "aria-label"?: string;
};

const DECIMAL_RE = /^[0-9]*\.?[0-9]*$/;
const INTEGER_RE = /^[0-9]*$/;

/**
 * Text-based numeric field — avoids browser `type="number"` quirks and
 * controlled-input fallbacks that block deleting digits (e.g. last "1" in 60).
 */
function parseDraftValue(raw: string, integer: boolean): number | undefined {
  if (raw === "" || raw === ".") return undefined;
  const n = integer ? parseInt(raw, 10) : parseFloat(raw);
  return Number.isFinite(n) ? n : undefined;
}

export function NumericTextInput({
  value,
  fallback,
  onValueChange,
  integer = false,
  live = false,
  className,
  placeholder,
  disabled,
  id,
  list,
  onFocus,
  onBlur,
  "aria-label": ariaLabel,
}: Props) {
  const [draft, setDraft] = useState<string | null>(null);

  const committed =
    value !== undefined && value !== null && Number.isFinite(value) ? String(value) : "";
  const display =
    draft !== null ? draft : committed !== "" ? committed : "";

  const placeholderText =
    placeholder ?? (fallback !== undefined && display === "" ? String(fallback) : undefined);

  return (
    <input
      id={id}
      type="text"
      inputMode={integer ? "numeric" : "decimal"}
      disabled={disabled}
      aria-label={ariaLabel}
      list={list}
      placeholder={placeholderText}
      value={display}
      onChange={(e) => {
        const raw = e.target.value;
        const re = integer ? INTEGER_RE : DECIMAL_RE;
        if (raw !== "" && !re.test(raw)) return;
        setDraft(raw);
        if (live) onValueChange(parseDraftValue(raw, integer));
      }}
      onFocus={onFocus}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
      onBlur={(e) => {
        const raw = draft ?? display;
        setDraft(null);
        onValueChange(parseDraftValue(raw, integer));
        onBlur?.(e);
      }}
      className={cn(className)}
    />
  );
}
