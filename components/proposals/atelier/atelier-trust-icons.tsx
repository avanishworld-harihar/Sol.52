"use client";

/** Inline SVG icons for Atelier Why Partner trust cards — print-safe. */

type IconProps = { className?: string };

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export type TrustIconKey =
  | "installs"
  | "engineers"
  | "local"
  | "support"
  | "subsidy"
  | "years";

function IconInstalls({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path d="M3.5 18.5h17" {...stroke} />
      <path d="M5 18.5V11l3.5-2.5L12 11l3.5-2.5L19 11v7.5" {...stroke} />
      <rect x="7.2" y="12.2" width="2.4" height="2.2" rx="0.3" {...stroke} />
      <rect x="10.8" y="12.2" width="2.4" height="2.2" rx="0.3" {...stroke} />
      <rect x="14.4" y="12.2" width="2.4" height="2.2" rx="0.3" {...stroke} />
    </svg>
  );
}

function IconEngineers({ className }: IconProps) {
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

function IconLocal({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        d="M12 20.5s-6.5-5.2-6.5-10a6.5 6.5 0 0113 0c0 4.8-6.5 10-6.5 10z"
        {...stroke}
      />
      <circle cx="12" cy="10.2" r="2.2" {...stroke} />
    </svg>
  );
}

function IconSupport({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="8" {...stroke} />
      <path d="M12 7.5v5l3 1.8" {...stroke} />
    </svg>
  );
}

function IconSubsidy({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        d="M7 4.5h8.5L19 8v11.5H7V4.5z"
        {...stroke}
      />
      <path d="M15.5 4.5V8H19" {...stroke} />
      <path d="M9.5 12h5M9.5 15h5" {...stroke} />
      <circle cx="16.5" cy="15.5" r="2.8" {...stroke} />
      <path d="M15.5 15.5h2M16.5 14.5v2" {...stroke} />
    </svg>
  );
}

function IconYears({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="3.2" {...stroke} />
      <path
        d="M12 5.2V3.5M12 20.5v-1.7M5.2 12H3.5M20.5 12h-1.7M7.2 7.2L6 6M18 18l-1.2-1.2M16.8 7.2L18 6M6 18l1.2-1.2"
        {...stroke}
      />
      <path d="M4.5 16.5c2.2 2.8 5 4.2 7.5 4.2s5.3-1.4 7.5-4.2" {...stroke} />
    </svg>
  );
}

export function TrustCardIcon({
  name,
  className,
}: {
  name: TrustIconKey;
  className?: string;
}) {
  switch (name) {
    case "installs":
      return <IconInstalls className={className} />;
    case "engineers":
      return <IconEngineers className={className} />;
    case "local":
      return <IconLocal className={className} />;
    case "support":
      return <IconSupport className={className} />;
    case "subsidy":
      return <IconSubsidy className={className} />;
    case "years":
      return <IconYears className={className} />;
  }
}

export const TRUST_ICON_KEYS: TrustIconKey[] = [
  "installs",
  "engineers",
  "local",
  "support",
  "subsidy",
  "years",
];
