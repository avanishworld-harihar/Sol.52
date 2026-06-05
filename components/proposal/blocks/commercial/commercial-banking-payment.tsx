"use client";

/**
 * Bank details + payment schedule for commercial proposal closing.
 */

import { useEffect, useState } from "react";
import { Banknote, IndianRupee, QrCode } from "lucide-react";
import type { CommercialCtx } from "@/components/proposal/commercial-proposal-view";
import { buildCommercialPaymentMilestones, fmtInr, GlassPanel, SectionReveal } from "./commercial-shared";

type Props = { ctx: CommercialCtx };

export function CommercialBankingPayment({ ctx }: Props) {
  const { summary, installer, lang, proposalId } = ctx;
  const isHi = lang === "hi";

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrPayload, setQrPayload] = useState<string | null>(null);

  useEffect(() => {
    if (summary.upiLink) {
      setQrPayload(summary.upiLink);
      return;
    }
    if (typeof window !== "undefined") {
      setQrPayload(`${window.location.origin}/proposal/${proposalId}`);
    }
  }, [summary.upiLink, proposalId]);

  useEffect(() => {
    if (!qrPayload) {
      setQrDataUrl(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const QR = (await import("qrcode")).default;
        const dataUrl = await QR.toDataURL(qrPayload, {
          errorCorrectionLevel: "M",
          margin: 1,
          width: 600,
          color: { dark: "#0B132B", light: "#FFFFFF" },
        });
        if (!cancelled) setQrDataUrl(dataUrl);
      } catch {
        if (!cancelled) setQrDataUrl(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [qrPayload]);

  const bnk = summary.bankDetails ?? {};
  const bankRows = [
    { l: isHi ? "खाता नाम" : "Account name", v: bnk.accountName ?? installer.name ?? "—" },
    { l: isHi ? "खाता संख्या" : "Account number", v: bnk.accountNumber ?? "—" },
    { l: isHi ? "IFSC" : "IFSC", v: bnk.ifsc ?? "—" },
    { l: isHi ? "शाखा" : "Branch", v: bnk.branch ?? "—" },
    { l: isHi ? "UPI ID" : "UPI ID", v: bnk.upiId ?? "—" },
  ];

  const milestones = buildCommercialPaymentMilestones(summary, isHi);
  const uploadedQr = bnk.paymentQrCodeUrl?.trim();
  const qrCaption = uploadedQr
    ? isHi
      ? "भुगतान QR कोड"
      : "Payment QR Code"
    : summary.upiLink
      ? isHi
        ? "UPI से भुगतान के लिए स्कैन करें"
        : "Scan to pay via UPI"
      : isHi
        ? "प्रस्ताव देखने के लिए स्कैन करें"
        : "Scan to view proposal";

  const hasBankInfo = bankRows.some((r) => r.v && r.v !== "—");

  return (
    <SectionReveal className="mb-8">
      <div className="mb-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
          {isHi ? "भुगतान एवं बैंक विवरण" : "Payment & Banking Details"}
        </p>
        <h3 className="mt-1 text-xl font-bold text-slate-900">
          {isHi ? "भुगतान कैसे करें" : "How to Pay"}
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          {isHi
            ? "नीचे माइलस्टोन अनुसूची और बैंक/HDFC/UPI विवरण दिए गए हैं।"
            : "Milestone schedule and bank / UPI details for transferring project payments."}
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Payment schedule */}
        <GlassPanel glow>
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3">
            <IndianRupee className="h-4 w-4 text-sky-500" />
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
              {isHi ? "भुगतान अनुसूची" : "Payment Schedule"}
            </p>
          </div>
          <div className="p-5">
            <div className="mb-4 flex items-baseline justify-between rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
              <span className="text-xs text-slate-500">
                {isHi ? "कुल देय राशि" : "Total payable"}
              </span>
              <span className="text-lg font-bold tabular-nums text-slate-900">
                {fmtInr(summary.netCost)}
              </span>
            </div>
            <div className="space-y-2">
              {milestones.map((m, i) => (
                <div
                  key={i}
                  className="commercial-print-keep-together flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-4 py-3"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-[11px] font-bold text-sky-700">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800">{m.label}</p>
                      <p className="text-[10px] text-slate-400">{m.pct}%</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold tabular-nums text-slate-900">{fmtInr(m.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </GlassPanel>

        {/* Bank + QR */}
        <div className="flex flex-col gap-5">
          <GlassPanel>
            <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3">
              <Banknote className="h-4 w-4 text-slate-700" />
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
                {isHi ? "बैंक विवरण" : "Bank Details"}
              </p>
            </div>
            <div className="divide-y divide-slate-100 px-5 py-1">
              {bankRows.map((r) => (
                <div key={r.l} className="flex items-center justify-between gap-4 py-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{r.l}</span>
                  <span className="text-right text-sm font-bold text-slate-900">{r.v}</span>
                </div>
              ))}
            </div>
            {!hasBankInfo ? (
              <p className="border-t border-slate-100 px-5 py-3 text-[11px] text-slate-400">
                {isHi
                  ? "बैंक विवरण More → Brand settings में जोड़ें।"
                  : "Add bank details in More → Brand settings."}
              </p>
            ) : null}
          </GlassPanel>

          <GlassPanel>
            <div className="flex flex-col items-center px-5 py-5">
              <div className="mb-2 flex items-center gap-2">
                <QrCode className="h-4 w-4 text-slate-600" />
                <p className="text-sm font-bold text-slate-900">{qrCaption}</p>
              </div>
              <div className="flex h-48 w-48 items-center justify-center rounded-2xl border border-slate-200 bg-white p-2">
                {uploadedQr ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={uploadedQr} alt="Payment QR" className="h-full w-full object-contain" />
                ) : qrDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qrDataUrl} alt="QR Code" className="h-full w-full object-contain" />
                ) : (
                  <div className="h-full w-full animate-pulse rounded-xl bg-slate-100" />
                )}
              </div>
              {summary.upiLink && bnk.upiId ? (
                <p className="mt-3 text-xs font-medium text-slate-600">{bnk.upiId}</p>
              ) : null}
            </div>
          </GlassPanel>
        </div>
      </div>
    </SectionReveal>
  );
}