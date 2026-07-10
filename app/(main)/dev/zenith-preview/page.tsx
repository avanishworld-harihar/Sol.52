"use client";

/**
 * Local Zenith layout preview — no Supabase / no DB migration required.
 * Open: /dev/zenith-preview
 */

import { useState } from "react";
import { ZenithProposalRenderer } from "@/components/proposals/zenith/zenith-renderer";
import {
  MOCK_ZENITH_EMPTY_SECTIONS,
  MOCK_ZENITH_PROPOSAL_DATA,
} from "@/components/proposals/zenith/mock-proposal-data";

export default function ZenithPreviewPage() {
  const [empty, setEmpty] = useState(false);
  const data = empty ? MOCK_ZENITH_EMPTY_SECTIONS : MOCK_ZENITH_PROPOSAL_DATA;

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", padding: "2rem 1rem" }}>
      <div
        style={{
          maxWidth: "210mm",
          margin: "0 auto 1rem",
          display: "flex",
          gap: "0.75rem",
          alignItems: "center",
        }}
      >
        <button
          type="button"
          onClick={() => setEmpty(false)}
          style={{
            padding: "0.5rem 0.9rem",
            borderRadius: 6,
            border: "1px solid #cbd5e1",
            background: empty ? "#fff" : "#2563eb",
            color: empty ? "#0f172a" : "#fff",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Full mock
        </button>
        <button
          type="button"
          onClick={() => setEmpty(true)}
          style={{
            padding: "0.5rem 0.9rem",
            borderRadius: 6,
            border: "1px solid #cbd5e1",
            background: empty ? "#2563eb" : "#fff",
            color: empty ? "#fff" : "#0f172a",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Empty bill / BOM / impact
        </button>
        <span style={{ fontSize: 12, color: "#64748b" }}>
          presetId mock: <code>zenith</code> / <code>residential_zenith</code>
        </span>
      </div>
      <ZenithProposalRenderer data={data} />
    </div>
  );
}
