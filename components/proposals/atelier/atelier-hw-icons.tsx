"use client";

/** Inline SVG icons for Atelier Hardware Trust cards — print-safe. */

type IconProps = { className?: string };

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function HwIconPanel({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" {...stroke} />
      <path d="M3.5 10.5h17M3.5 15.5h17M9 4.5v15M15 4.5v15" {...stroke} />
    </svg>
  );
}

export function HwIconInverter({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <rect x="4" y="5" width="16" height="14" rx="2" {...stroke} />
      <path d="M8 12h3l1.5-3L15 15l1.5-3H20" {...stroke} />
      <circle cx="8" cy="8.5" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function HwIconStructure({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path d="M4 18h16M6 18V9l6-4 6 4v9" {...stroke} />
      <path d="M9 18v-5h6v5" {...stroke} />
      <path d="M8 11.5h8" {...stroke} />
    </svg>
  );
}

export function HwIconProtection({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        d="M12 3.5l7 2.5v5.2c0 4.2-2.8 7.2-7 8.8-4.2-1.6-7-4.6-7-8.8V6L12 3.5z"
        {...stroke}
      />
      <path d="M9.5 12.2l1.8 1.8 3.4-3.6" {...stroke} />
    </svg>
  );
}

export function HwIconEarth({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="8" {...stroke} />
      <path d="M4.5 12h15M12 4.5c2.2 2.2 3.2 4.5 3.2 7.5S14.2 17.3 12 19.5C9.8 17.3 8.8 15 8.8 12S9.8 6.7 12 4.5z" {...stroke} />
    </svg>
  );
}

export type HwIconKey = "panel" | "inverter" | "structure" | "protection";

export function HwCardIcon({
  name,
  className,
}: {
  name: HwIconKey;
  className?: string;
}) {
  switch (name) {
    case "panel":
      return <HwIconPanel className={className} />;
    case "inverter":
      return <HwIconInverter className={className} />;
    case "structure":
      return <HwIconStructure className={className} />;
    case "protection":
      return <HwIconProtection className={className} />;
  }
}
