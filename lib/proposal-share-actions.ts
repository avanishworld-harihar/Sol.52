"use client";

export type ProposalShareMetrics = {
  customerName: string;
  systemKw: number;
  netCostInr: number;
  annualSavingInr: number;
  paybackLabel: string;
  phone?: string;
};

export type MarkProposalSentResult = {
  ok: boolean;
  proposalStatus?: string;
};

export function publicProposalPath(proposalId: string): string {
  return `/proposal/${proposalId}`;
}

export function absolutePublicProposalUrl(proposalId: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}${publicProposalPath(proposalId)}`;
}

export function buildWhatsAppProposalMessage(metrics: ProposalShareMetrics, url: string): string {
  const name = metrics.customerName.trim() || "Customer";
  return [
    `Namaste ${name} 🌞`,
    "",
    `${metrics.systemKw} kW solar proposal aapke liye taiyaar hai:`,
    `• Net cost: ₹${Math.round(metrics.netCostInr).toLocaleString("en-IN")}`,
    `• Annual saving: ₹${Math.round(metrics.annualSavingInr).toLocaleString("en-IN")}`,
    `• Payback: ${metrics.paybackLabel}`,
    "",
    `Full interactive proposal: ${url}`,
  ].join("\n");
}

export function openWhatsAppWithProposal(metrics: ProposalShareMetrics, proposalId: string): void {
  const url = absolutePublicProposalUrl(proposalId);
  const text = buildWhatsAppProposalMessage(metrics, url);
  const phone = (metrics.phone ?? "").replace(/[^\d]/g, "");
  const wa = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
    : `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(wa, "_blank", "noopener,noreferrer");
}

export async function markProposalSent(proposalId: string): Promise<boolean> {
  const result = await markProposalSentIfDraft(proposalId);
  return result.ok;
}

/** Marks draft → sent; no-op when already sent / viewed / approved. */
export async function markProposalSentIfDraft(proposalId: string): Promise<MarkProposalSentResult> {
  try {
    const res = await fetch(`/api/proposals/${proposalId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proposal_status: "sent" }),
    });
    const json = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      proposal_status?: string;
    };
    return {
      ok: res.ok && json.ok === true,
      proposalStatus: json.proposal_status,
    };
  } catch {
    return { ok: false };
  }
}

export async function copyPublicProposalLink(proposalId: string): Promise<MarkProposalSentResult> {
  try {
    await navigator.clipboard.writeText(absolutePublicProposalUrl(proposalId));
    return markProposalSentIfDraft(proposalId);
  } catch {
    return { ok: false };
  }
}

export async function downloadProposalPpt(proposalId: string, customerName: string): Promise<void> {
  const res = await fetch(`/api/proposals/${proposalId}/ppt`, { cache: "no-store" });
  if (!res.ok) {
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(json.error || "PPT download failed");
  }
  const blob = await res.blob();
  const safe = customerName.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "").trim() || "customer";
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = `${safe}-proposal.pptx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
}

export async function deleteProposalById(proposalId: string): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`/api/proposals/${proposalId}`, { method: "DELETE" });
  const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
  if (!res.ok || !json.ok) {
    return { ok: false, error: json.error || "delete_failed" };
  }
  return { ok: true };
}
