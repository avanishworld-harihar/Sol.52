"use client";

/**
 * Quantum system-architecture illustrations (Glass3D / cyan).
 * Schematic equipment icons — not live SLD.
 */

import styles from "./Quantum.module.css";

export function IconPv() {
  return (
    <svg viewBox="0 0 80 56" className={styles.engArchIcon} aria-hidden>
      <defs>
        <linearGradient id="qArchPvGlass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1a4a5c" />
          <stop offset="100%" stopColor="#061018" />
        </linearGradient>
      </defs>
      <rect x="6" y="8" width="30" height="24" rx="2" fill="url(#qArchPvGlass)" stroke="#06B6D4" strokeWidth="1.2" />
      <path d="M13.5 8v24M21 8v24M28.5 8v24M6 16h30M6 24h30" stroke="rgba(103,232,249,0.35)" strokeWidth="0.7" />
      <rect x="44" y="8" width="30" height="24" rx="2" fill="url(#qArchPvGlass)" stroke="#06B6D4" strokeWidth="1.2" />
      <path d="M51.5 8v24M59 8v24M66.5 8v24M44 16h30M44 24h30" stroke="rgba(103,232,249,0.35)" strokeWidth="0.7" />
      <rect x="10" y="36" width="60" height="4" rx="1" fill="#334155" />
      <rect x="18" y="42" width="44" height="3" rx="1" fill="#1e293b" />
    </svg>
  );
}

export function IconDcdb() {
  return (
    <svg viewBox="0 0 72 56" className={styles.engArchIcon} aria-hidden>
      <rect x="12" y="6" width="48" height="44" rx="3.5" fill="#0c1622" stroke="#06B6D4" strokeWidth="1.3" />
      <rect x="12" y="6" width="48" height="10" rx="3.5" fill="#122636" />
      <text x="36" y="13.5" textAnchor="middle" fill="#67e8f9" fontSize="6.5" fontWeight="700" letterSpacing="0.6">
        DCDB
      </text>
      <rect x="18" y="22" width="16" height="12" rx="1.5" fill="#152030" stroke="#06B6D4" strokeWidth="1" />
      <line x1="21" y1="26" x2="31" y2="26" stroke="#06B6D4" strokeWidth="1" />
      <line x1="21" y1="30" x2="31" y2="30" stroke="#06B6D4" strokeWidth="1" />
      <rect x="38" y="22" width="16" height="12" rx="1.5" fill="#152030" stroke="#475569" strokeWidth="1" />
      <circle cx="46" cy="28" r="3.5" fill="none" stroke="#22d3ee" strokeWidth="1.2" />
      <text x="26" y="44" textAnchor="middle" fill="#94a3b8" fontSize="5">
        Fuse
      </text>
      <text x="46" y="44" textAnchor="middle" fill="#94a3b8" fontSize="5">
        SPD
      </text>
    </svg>
  );
}

export function IconInv() {
  return (
    <svg viewBox="0 0 72 56" className={styles.engArchIcon} aria-hidden>
      <rect x="8" y="8" width="56" height="40" rx="3.5" fill="#0a1420" stroke="#06B6D4" strokeWidth="1.3" />
      <rect x="14" y="14" width="32" height="16" rx="2" fill="#040a10" stroke="#334155" strokeWidth="0.9" />
      <text x="30" y="25" textAnchor="middle" fill="#67e8f9" fontSize="7" fontFamily="ui-monospace,monospace" fontWeight="700">
        INV
      </text>
      <rect x="50" y="14" width="5" height="24" rx="0.8" fill="#334155" />
      <rect x="56" y="16" width="4" height="20" rx="0.8" fill="#1e293b" />
      <circle cx="18" cy="40" r="2.6" fill="#22c55e" />
      <circle cx="28" cy="40" r="2.6" fill="#06B6D4" />
      <rect x="36" y="36" width="14" height="6" rx="1.2" fill="#334155" />
    </svg>
  );
}

export function IconAcdb() {
  return (
    <svg viewBox="0 0 72 56" className={styles.engArchIcon} aria-hidden>
      <rect x="12" y="6" width="48" height="44" rx="3.5" fill="#0c1622" stroke="#06B6D4" strokeWidth="1.3" />
      <rect x="12" y="6" width="48" height="10" rx="3.5" fill="#122636" />
      <text x="36" y="13.5" textAnchor="middle" fill="#67e8f9" fontSize="6.5" fontWeight="700" letterSpacing="0.6">
        ACDB
      </text>
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${18 + i * 13}, 22)`}>
          <rect width="10" height="16" rx="1.2" fill="#152030" stroke="#475569" strokeWidth="0.9" />
          <rect x="2.5" y="3" width="5" height="7" rx="0.6" fill="#06B6D4" />
          <circle cx="5" cy="13.5" r="1.4" fill="#22d3ee" />
        </g>
      ))}
      <text x="36" y="46" textAnchor="middle" fill="#94a3b8" fontSize="4.8">
        MCB · SPD
      </text>
    </svg>
  );
}

export function IconMeter() {
  return (
    <svg viewBox="0 0 72 56" className={styles.engArchIcon} aria-hidden>
      <rect x="16" y="6" width="40" height="44" rx="3.5" fill="#0c1622" stroke="#06B6D4" strokeWidth="1.3" />
      <circle cx="36" cy="24" r="13" fill="#0a1420" stroke="#06B6D4" strokeWidth="1.3" />
      <circle cx="36" cy="24" r="2.2" fill="#e2e8f0" />
      <line x1="36" y1="24" x2="36" y2="13" stroke="#e2e8f0" strokeWidth="1.4" />
      <line x1="36" y1="24" x2="45" y2="29" stroke="#06B6D4" strokeWidth="1.2" />
      <path d="M24 34 Q36 40 48 34" fill="none" stroke="#22c55e" strokeWidth="1.1" />
      <text x="36" y="46" textAnchor="middle" fill="#94a3b8" fontSize="5.5" fontWeight="600">
        NET
      </text>
    </svg>
  );
}
