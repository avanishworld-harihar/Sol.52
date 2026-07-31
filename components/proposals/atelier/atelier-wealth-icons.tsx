"use client";

/** Inline SVG icons for Atelier Wealth journey steps — print-safe. */

type IconProps = { className?: string };

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function WealthIconPay({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <rect x="3.5" y="6.5" width="17" height="11" rx="2" {...stroke} />
      <path d="M3.5 10.5h17" {...stroke} />
      <circle cx="16.5" cy="14.5" r="1.4" {...stroke} />
    </svg>
  );
}

export function WealthIconPaid({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="8" {...stroke} />
      <path d="M8.5 12.2l2.2 2.2 4.8-4.8" {...stroke} />
    </svg>
  );
}

export function WealthIconGrow({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path d="M5 18.5h14" {...stroke} />
      <path d="M7.5 18.5V13h3v5.5M11.5 18.5V9h3v9.5M15.5 18.5V6.5h3v12" {...stroke} />
    </svg>
  );
}
