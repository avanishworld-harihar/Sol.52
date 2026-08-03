/**
 * Atelier Impact page — simple SVG illustrations (print-safe).
 * Car / trees / roof metaphors so customers grasp CO₂ & ecology at a glance.
 */

type IconProps = { className?: string };

export function ImpactIconCar({ className }: IconProps) {
  return (
    <svg viewBox="0 0 96 96" className={className} aria-hidden>
      <circle cx="48" cy="48" r="44" fill="rgba(249,115,22,0.12)" />
      <ellipse cx="48" cy="78" rx="30" ry="5" fill="rgba(10,15,28,0.08)" />
      <path
        d="M18 58h60l-6-14c-1.5-3.5-4.5-6-8.5-6H32.5c-4 0-7 2.5-8.5 6L18 58z"
        fill="#fff"
        stroke="#0A0F1C"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M28 44h12l4 10H26l2-10zM52 38h12c2.5 0 4.5 1.5 5.5 3.5L74 54H50l2-16z"
        fill="rgba(249,115,22,0.22)"
        stroke="#F97316"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <circle cx="30" cy="62" r="7" fill="#0A0F1C" />
      <circle cx="30" cy="62" r="3.2" fill="#F97316" />
      <circle cx="66" cy="62" r="7" fill="#0A0F1C" />
      <circle cx="66" cy="62" r="3.2" fill="#F97316" />
      <path
        d="M42 34 L48 22 L54 34"
        fill="none"
        stroke="#F97316"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="48" cy="18" r="3" fill="#F97316" />
    </svg>
  );
}

export function ImpactIconTrees({ className }: IconProps) {
  return (
    <svg viewBox="0 0 96 96" className={className} aria-hidden>
      <circle cx="48" cy="48" r="44" fill="rgba(249,115,22,0.12)" />
      <ellipse cx="48" cy="80" rx="28" ry="5" fill="rgba(10,15,28,0.08)" />
      <path d="M28 72 V78" stroke="#1E293B" strokeWidth="2.4" strokeLinecap="round" />
      <path
        d="M28 72 C18 72 14 62 18 54 C12 54 12 42 22 40 C24 30 36 30 38 40 C46 42 46 54 38 54 C42 62 36 72 28 72 Z"
        fill="rgba(249,115,22,0.28)"
        stroke="#F97316"
        strokeWidth="1.1"
      />
      <path d="M52 68 V80" stroke="#1E293B" strokeWidth="3.2" strokeLinecap="round" />
      <path
        d="M52 68 C36 68 28 54 34 40 C22 40 22 22 36 20 C38 6 66 6 68 20 C82 22 82 40 68 40 C74 54 66 68 52 68 Z"
        fill="rgba(249,115,22,0.48)"
        stroke="#F97316"
        strokeWidth="1.5"
      />
      <path d="M72 74 V80" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M72 74 C66 74 64 68 66 62 C62 62 62 54 68 54 C69 48 78 48 79 54 C84 54 84 62 80 62 C82 68 78 74 72 74 Z"
        fill="rgba(249,115,22,0.38)"
        stroke="#F97316"
        strokeWidth="1"
      />
    </svg>
  );
}

export function ImpactIconRoof({ className }: IconProps) {
  return (
    <svg viewBox="0 0 96 96" className={className} aria-hidden>
      <circle cx="48" cy="48" r="44" fill="rgba(249,115,22,0.12)" />
      <circle cx="70" cy="24" r="9" fill="rgba(249,115,22,0.45)" stroke="#F97316" strokeWidth="1.4" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const a = (deg * Math.PI) / 180;
        return (
          <line
            key={deg}
            x1={70 + Math.cos(a) * 12}
            y1={24 + Math.sin(a) * 12}
            x2={70 + Math.cos(a) * 17}
            y2={24 + Math.sin(a) * 17}
            stroke="#F97316"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        );
      })}
      <path
        d="M18 58 L48 38 L78 58 L78 78 L18 78 Z"
        fill="#F8FAFC"
        stroke="#0A0F1C"
        strokeWidth="1.6"
      />
      <path d="M18 58 L48 38 L78 58" fill="none" stroke="#F97316" strokeWidth="2" />
      <rect
        x="28"
        y="48"
        width="16"
        height="11"
        fill="#1E293B"
        stroke="#F97316"
        strokeWidth="1"
        transform="rotate(-18 36 53.5)"
      />
      <rect
        x="48"
        y="46"
        width="16"
        height="11"
        fill="#1E293B"
        stroke="#F97316"
        strokeWidth="1"
        transform="rotate(-18 56 51.5)"
      />
      <rect x="42" y="64" width="12" height="14" fill="none" stroke="#0A0F1C" strokeWidth="1.4" />
      <rect
        x="26"
        y="64"
        width="10"
        height="8"
        fill="rgba(249,115,22,0.2)"
        stroke="#0A0F1C"
        strokeWidth="1"
      />
    </svg>
  );
}

export function ImpactIconLeaf({ className }: IconProps) {
  return (
    <svg viewBox="0 0 96 96" className={className} aria-hidden>
      <circle cx="48" cy="48" r="44" fill="rgba(249,115,22,0.12)" />
      <path
        d="M28 64 C28 40 48 22 72 24 C68 52 52 68 28 64 Z"
        fill="rgba(249,115,22,0.35)"
        stroke="#F97316"
        strokeWidth="1.6"
      />
      <path
        d="M36 58 C48 48 58 38 68 30"
        fill="none"
        stroke="#0A0F1C"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M42 52 C48 50 54 44 58 40 M46 58 C52 54 56 48 60 44"
        fill="none"
        stroke="#F97316"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}
