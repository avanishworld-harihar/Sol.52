"use client";

import { NumericTextInput } from "@/components/ui/numeric-text-input";
import { cn } from "@/lib/utils";
import { useId, useState, type InputHTMLAttributes, type SelectHTMLAttributes } from "react";

type FloatingShellProps = {
  label: string;
  id?: string;
  required?: boolean;
  className?: string;
  containerClassName?: string;
  labelBackgroundClassName?: string;
};

type FloatingInputProps = FloatingShellProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "className" | "children">;

type FloatingSelectProps = FloatingShellProps &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, "id" | "className">;

const DEFAULT_LABEL_BG = "bg-white dark:bg-[#161B22]";

function hasNonEmptyValue(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  return String(value).trim().length > 0;
}

function FloatingLabel({
  htmlFor,
  label,
  active,
  labelBackgroundClassName,
}: {
  htmlFor: string;
  label: string;
  active: boolean;
  labelBackgroundClassName?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        "pointer-events-none absolute z-[1] max-w-[calc(100%-1.25rem)] truncate leading-none transition-all duration-200",
        active
          ? "left-2.5 top-0 -translate-y-1/2 text-[11px] font-semibold text-teal-600 dark:text-teal-300"
          : "left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500 dark:text-[#94A3B8]",
        active && cn("px-1", labelBackgroundClassName ?? DEFAULT_LABEL_BG)
      )}
    >
      {label}
    </label>
  );
}

const floatingFieldClass =
  "ss-input w-full min-h-12 pt-6 pb-2.5 placeholder:text-transparent focus:border-teal-500 focus:ring-teal-200/70 dark:focus:border-teal-400 dark:focus:ring-teal-400/30";

export function FloatingLabelInput({
  label,
  id,
  className,
  containerClassName,
  labelBackgroundClassName,
  required,
  value,
  defaultValue,
  onFocus,
  onBlur,
  onChange,
  type,
  autoComplete,
  ...props
}: FloatingInputProps) {
  const generatedId = useId();
  const fieldId = id ?? `fld-${generatedId}`;
  const [focused, setFocused] = useState(false);
  const [localValue, setLocalValue] = useState<string>(String(defaultValue ?? ""));
  const controlled = value !== undefined;
  const currentValue = controlled ? value : localValue;
  const floated = focused || hasNonEmptyValue(currentValue);

  const resolvedType = type === "number" ? "text" : type;
  const resolvedAutoComplete =
    autoComplete ?? (type === "number" || props.inputMode === "numeric" || props.inputMode === "decimal" ? "off" : undefined);

  return (
    <div className={cn("relative w-full min-w-0 overflow-visible", containerClassName)}>
      <FloatingLabel
        htmlFor={fieldId}
        label={`${label}${required ? " *" : ""}`}
        active={floated}
        labelBackgroundClassName={labelBackgroundClassName}
      />
      <input
        id={fieldId}
        type={resolvedType}
        autoComplete={resolvedAutoComplete}
        value={value}
        defaultValue={defaultValue}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        onChange={(e) => {
          if (!controlled) setLocalValue(e.target.value);
          onChange?.(e);
        }}
        className={cn(floatingFieldClass, className)}
        {...props}
        placeholder=" "
      />
    </div>
  );
}

type FloatingNumericProps = {
  label: string;
  id?: string;
  required?: boolean;
  className?: string;
  containerClassName?: string;
  labelBackgroundClassName?: string;
  value?: number;
  fallback?: number;
  onValueChange: (next: number | undefined) => void;
  integer?: boolean;
  /** Commit on each keystroke — use when sibling fields derive from this value. */
  live?: boolean;
  list?: string;
};

/** Floating label + draft-friendly numeric input (commits on blur). */
export function FloatingLabelNumericInput({
  label,
  id,
  className,
  containerClassName,
  labelBackgroundClassName,
  required,
  value,
  fallback,
  onValueChange,
  integer,
  live,
  list,
}: FloatingNumericProps) {
  const generatedId = useId();
  const fieldId = id ?? `fld-${generatedId}`;
  const [focused, setFocused] = useState(false);
  const hasValue = value !== undefined && value !== null && Number.isFinite(value);
  const floated = focused || hasValue;

  return (
    <div className={cn("relative w-full min-w-0 overflow-visible", containerClassName)}>
      <FloatingLabel
        htmlFor={fieldId}
        label={`${label}${required ? " *" : ""}`}
        active={floated}
        labelBackgroundClassName={labelBackgroundClassName}
      />
      <NumericTextInput
        id={fieldId}
        list={list}
        integer={integer}
        live={live}
        value={value}
        fallback={fallback}
        onValueChange={onValueChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder=" "
        className={cn(floatingFieldClass, className)}
      />
    </div>
  );
}

export function FloatingLabelSelect({
  label,
  id,
  className,
  containerClassName,
  labelBackgroundClassName,
  required,
  value,
  defaultValue,
  onFocus,
  onBlur,
  onChange,
  children,
  ...props
}: FloatingSelectProps) {
  const generatedId = useId();
  const fieldId = id ?? `fld-${generatedId}`;
  const [focused, setFocused] = useState(false);
  const [localValue, setLocalValue] = useState<string>(String(defaultValue ?? ""));
  const controlled = value !== undefined;
  const floated = true;

  return (
    <div className={cn("relative w-full min-w-0 overflow-visible", containerClassName)}>
      <FloatingLabel
        htmlFor={fieldId}
        label={`${label}${required ? " *" : ""}`}
        active={floated}
        labelBackgroundClassName={labelBackgroundClassName}
      />
      <select
        id={fieldId}
        value={value}
        defaultValue={defaultValue}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        onChange={(e) => {
          if (!controlled) setLocalValue(e.target.value);
          onChange?.(e);
        }}
        className={cn("ss-select", floatingFieldClass, className)}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
