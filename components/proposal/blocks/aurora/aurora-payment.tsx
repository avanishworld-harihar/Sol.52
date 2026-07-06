"use client";

import { useEffect, useState } from "react";
import type { ProposalDeckSummary } from "@/lib/proposal-ppt";
import type { ProposalDict, ProposalLang } from "@/lib/proposal-i18n";
import { AuroraEyebrow, AuroraLead, AuroraPageShell, AuroraTitle, fmtInr } from "./aurora-primitives";

type Props = {
  summary: ProposalDeckSummary;
  lang: ProposalLang;
  D: ProposalDict;
  proposalId: string;
};

const STEP_LABELS_EN = ["Booking", "Material delivery", "Installation", "Go live"];
const STEP_LABELS_HI = ["बुकिंग", "सामान डिलीवरी", "इंस्टॉलेशन", "गो-लाइव"];
const STEP_DESC_EN = [
  "We initiate DISCOM and state-subsidy protocols.",
  "Secure arrival of Tier-1 assets at your site.",
  "Engineers complete physical installation and testing.",
  "Net-meter activated. You achieve energy independence.",
];
const STEP_DESC_HI = [
  "DISCOM और राज्य सब्सिडी प्रोटोकॉल शुरू।",
  "Tier-1 सामान आपकी साइट पर पहुँचता है।",
  "इंजीनियर इंस्टॉलेशन और टेस्टिंग पूरी करते हैं।",
  "नेट-मीटर सक्रिय — ऊर्जा स्वतंत्रता शुरू।",
];

export function AuroraPayment({ summary, lang, D, proposalId }: Props) {
  const isHi = lang === "hi";
  const bnk = summary.bankDetails;
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    const payload = summary.upiLink?.trim() || (typeof window !== "undefined" ? `${window.location.origin}/proposal/${proposalId}` : null);
    if (!payload) return;
    let cancelled = false;
    void (async () => {
      try {
        const QR = (await import("qrcode")).default;
        const dataUrl = await QR.toDataURL(payload, {
          errorCorrectionLevel: "M",
          margin: 1,
          width: 400,
          color: { dark: "#FAFBFC", light: "#0B2447" },
        });
        if (!cancelled) setQrDataUrl(dataUrl);
      } catch {
        if (!cancelled) setQrDataUrl(null);
      }
    })();
    return () => { cancelled = true; };
  }, [summary.upiLink, proposalId]);

  const payLabelKeys: Array<keyof ProposalDict> = ["pay.advance", "pay.material", "pay.installation", "pay.commissioning"];
  const stepTitles = isHi ? STEP_LABELS_HI : STEP_LABELS_EN;
  const stepDescs = isHi ? STEP_DESC_HI : STEP_DESC_EN;

  return (
    <AuroraPageShell tone="indigo">
      <AuroraEyebrow className="aurora-eyebrow--emerald">{isHi ? "आगे कैसे बढ़ें" : "How to proceed"}</AuroraEyebrow>
      <AuroraTitle className="aurora-title--light">{isHi ? "एक्ज़ीक्यूशन टाइमलाइन" : "Execution timeline."}</AuroraTitle>
      <AuroraLead className="aurora-lead--light">
        {isHi ? "सरल 4-चरण भुगतान। DISCOM और कागज़ी कार्रवाई हम संभालते हैं।" : "Simple 4-step payment. We handle DISCOM and paperwork."}
      </AuroraLead>

      <div className="aurora-payment-grid">
        <div className="aurora-timeline">
          {summary.paymentMilestones.map((m, i) => (
            <div key={m.step} className="aurora-tl-item">
              <div className="aurora-tl-marker">
                <div className={`aurora-tl-dot ${i === 0 ? "aurora-tl-dot--active" : ""} ${i === 3 ? "aurora-tl-dot--final" : ""}`}>
                  {m.step}
                </div>
              </div>
              <div className="aurora-tl-content">
                <div className="aurora-tl-header">
                  <p className="aurora-tl-title">{stepTitles[i] ?? D[payLabelKeys[i]]}</p>
                  <div className="aurora-tl-amt-wrap">
                    <span className="aurora-tl-amt">{fmtInr(m.amountInr)}</span>
                    <span className="aurora-tl-pct">{m.pct}%</span>
                  </div>
                </div>
                <p className="aurora-tl-desc">{stepDescs[i]}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="aurora-bank-card">
          <p className="aurora-bank-kicker">{isHi ? "सुरक्षित भुगतान" : "Secure routing"}</p>
          <p className="aurora-bank-lbl">{D["bank.accountName"]}</p>
          <p className="aurora-bank-val">{bnk.accountName ?? summary.installer}</p>
          <p className="aurora-bank-lbl">{D["bank.accountNumber"]}</p>
          <p className="aurora-bank-val aurora-bank-val--mono">{bnk.accountNumber ?? "—"}</p>
          <p className="aurora-bank-lbl">{D["bank.ifsc"]}</p>
          <p className="aurora-bank-val aurora-bank-val--mono">{bnk.ifsc ?? "—"}</p>
          {(bnk.upiId || summary.upiLink) ? (
            <div className="aurora-upi-box">
              <p className="aurora-upi-label">{isHi ? "UPI भुगतान" : "Express UPI payment"}</p>
              <p className="aurora-upi-id">{bnk.upiId ?? summary.upiLink}</p>
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="" className="aurora-upi-qr" width={120} height={120} />
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </AuroraPageShell>
  );
}
