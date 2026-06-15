"use client";

import { AppShell } from "@/components/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Gift, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Fragment, useState } from "react";
import useSWR from "swr";

type Plan = {
  code: string;
  name: string;
  price_inr_monthly: number;
  max_proposals_per_month: number | null;
  max_users: number;
};

type OrgBilling = {
  id: string;
  name: string;
  slug: string;
  trial_consumed: boolean;
  subscription: {
    plan: { code: string; name: string };
    status: string;
    trial_ends_at: string | null;
    trial_proposals_used: number;
    is_complimentary?: boolean;
    expires_at?: string | null;
    granted_by?: string | null;
    granted_reason?: string | null;
  } | null;
  billing: {
    planName: string;
    planCode: string | null;
    status: string | null;
    proposalsUsed: number;
    proposalsDisplay: string;
    trialEndDate: string | null;
    isComplimentary: boolean;
    expiresAt: string | null;
    grantedBy: string | null;
    grantedReason: string | null;
  };
};

type Payload = { ok: boolean; plans: Plan[]; organizations: OrgBilling[] };

type ComplimentaryPlan = "starter" | "pro" | "business";
type DurationPreset = "14" | "30" | "60" | "custom";

async function fetchBilling(url: string): Promise<Payload> {
  const res = await fetch(url, { cache: "no-store" });
  const json = (await res.json()) as Payload & { error?: string };
  if (!res.ok || !json.ok) throw new Error(json.error ?? "Load failed");
  return json;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminBillingPage() {
  const router = useRouter();
  const { data, error, isLoading, mutate } = useSWR<Payload>("/api/admin/billing", fetchBilling);
  const [grantOrgId, setGrantOrgId] = useState<string | null>(null);
  const [grantPlan, setGrantPlan] = useState<ComplimentaryPlan>("pro");
  const [grantDuration, setGrantDuration] = useState<DurationPreset>("30");
  const [grantCustomDate, setGrantCustomDate] = useState("");
  const [grantReason, setGrantReason] = useState("");
  const [grantBusy, setGrantBusy] = useState(false);

  async function assignPlan(orgId: string, planCode: string) {
    const res = await fetch("/api/admin/billing", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId: orgId, action: "assign_plan", planCode }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert((j as { error?: string }).error ?? "Failed");
      return;
    }
    void mutate();
  }

  async function startTrial(orgId: string) {
    const res = await fetch("/api/admin/billing", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId: orgId, action: "start_trial", trialDays: 14 }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert((j as { error?: string }).error ?? "Failed");
      return;
    }
    void mutate();
  }

  async function endTrial(orgId: string) {
    const res = await fetch("/api/admin/billing", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId: orgId, action: "end_trial" }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert((j as { error?: string }).error ?? "Failed");
      return;
    }
    void mutate();
  }

  async function revokeComplimentary(orgId: string) {
    if (!confirm("Revoke complimentary access? Org will move to cancelled Starter state.")) return;
    const res = await fetch("/api/admin/billing", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId: orgId, action: "revoke_complimentary" }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert((j as { error?: string }).error ?? "Failed");
      return;
    }
    void mutate();
  }

  async function submitComplimentaryGrant(orgId: string) {
    const reason = grantReason.trim();
    if (reason.length < 3) {
      alert("Enter a grant reason (min 3 characters).");
      return;
    }

    const body: Record<string, unknown> = {
      organizationId: orgId,
      action: "grant_complimentary",
      planCode: grantPlan,
      grantedReason: reason,
    };

    if (grantDuration === "custom") {
      if (!grantCustomDate) {
        alert("Pick a custom expiry date.");
        return;
      }
      body.expiresAt = new Date(`${grantCustomDate}T23:59:59`).toISOString();
    } else {
      body.durationDays = Number(grantDuration);
    }

    setGrantBusy(true);
    try {
      const res = await fetch("/api/admin/billing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert((j as { error?: string }).error ?? "Failed");
        return;
      }
      setGrantOrgId(null);
      setGrantReason("");
      setGrantCustomDate("");
      void mutate();
    } finally {
      setGrantBusy(false);
    }
  }

  return (
    <AppShell title="Billing">
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Billing & Complimentary Access</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Assign plans and grant complimentary access. Payments in Phase 2.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/admin/tariff-reports")}
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            ← Admin home
          </button>
        </div>

        {isLoading ? (
          <Skeleton className="h-40 w-full rounded-xl" />
        ) : error ? (
          <p className="text-sm text-red-600">{error.message}</p>
        ) : (
          <>
            <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Plans</h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {(data?.plans ?? []).map((p) => (
                  <div key={p.code} className="rounded-lg border border-slate-100 p-3 text-xs dark:border-white/10">
                    <p className="font-bold text-slate-900 dark:text-slate-100">{p.name}</p>
                    <p className="mt-1 text-slate-600 dark:text-slate-400">
                      {p.price_inr_monthly > 0
                        ? `₹${p.price_inr_monthly.toLocaleString("en-IN")}/mo`
                        : "Free trial"}
                    </p>
                    <p className="mt-1 text-slate-500">
                      {p.max_proposals_per_month
                        ? `${p.max_proposals_per_month} proposals/mo`
                        : "Unlimited proposals"}
                      {" · "}
                      {p.max_users} user{p.max_users === 1 ? "" : "s"}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.04]">
              <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-bold dark:border-white/10">
                Organizations
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                  <thead className="border-b border-slate-100 bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:border-white/10 dark:bg-white/[0.03]">
                    <tr>
                      <th className="px-4 py-2.5">Organization</th>
                      <th className="px-4 py-2.5">Current Plan</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5">Proposals</th>
                      <th className="px-4 py-2.5">Trial End</th>
                      <th className="px-4 py-2.5">Complimentary</th>
                      <th className="px-4 py-2.5">Expires</th>
                      <th className="px-4 py-2.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                    {(data?.organizations ?? []).map((org) => {
                      const sub = org.subscription;
                      const snap = org.billing;
                      const isTrial = snap.planCode === "trial";
                      const isGrantOpen = grantOrgId === org.id;

                      return (
                        <Fragment key={org.id}>
                          <tr className="align-top">
                            <td className="px-4 py-3">
                              <p className="font-semibold text-slate-900 dark:text-slate-100">{org.name}</p>
                              <p className="text-[10px] text-slate-500">{org.slug}</p>
                              {org.trial_consumed ? (
                                <p className="mt-0.5 text-[10px] text-amber-600">trial consumed</p>
                              ) : null}
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                              {snap.planName}
                              {snap.isComplimentary ? (
                                <span className="ml-1 rounded bg-violet-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-violet-700">
                                  Free
                                </span>
                              ) : null}
                            </td>
                            <td className="px-4 py-3 capitalize text-slate-600 dark:text-slate-300">
                              {snap.isComplimentary ? "complimentary" : snap.status ?? "—"}
                            </td>
                            <td className="px-4 py-3 font-mono tabular-nums text-slate-800 dark:text-slate-200">
                              {snap.proposalsDisplay}
                            </td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                              {isTrial ? formatDate(snap.trialEndDate) : "—"}
                            </td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                              {snap.isComplimentary ? (
                                <div className="max-w-[10rem] space-y-0.5">
                                  <p className="text-[10px] text-slate-500">by {snap.grantedBy ?? "—"}</p>
                                  {snap.grantedReason ? (
                                    <p className="line-clamp-2 text-[10px] italic text-slate-500">{snap.grantedReason}</p>
                                  ) : null}
                                </div>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                              {snap.isComplimentary ? formatDate(snap.expiresAt) : "—"}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex min-w-[12rem] flex-col gap-2">
                                <div className="flex flex-wrap gap-1.5">
                                  {(["trial", "starter", "pro", "business"] as const).map((code) => (
                                    <button
                                      key={code}
                                      type="button"
                                      onClick={() => assignPlan(org.id, code)}
                                      className={cn(
                                        "rounded-lg border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide",
                                        sub?.plan.code === code && !snap.isComplimentary
                                          ? "border-blue-500 bg-blue-50 text-blue-700"
                                          : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-white/15 dark:text-slate-300"
                                      )}
                                    >
                                      {code}
                                    </button>
                                  ))}
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setGrantOrgId(isGrantOpen ? null : org.id);
                                      setGrantReason("");
                                    }}
                                    className="inline-flex items-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-2 py-1 text-[10px] font-semibold text-violet-700"
                                  >
                                    <Gift className="h-3 w-3" aria-hidden />
                                    Complimentary
                                  </button>
                                  {snap.isComplimentary ? (
                                    <button
                                      type="button"
                                      onClick={() => revokeComplimentary(org.id)}
                                      className="rounded-lg border border-red-200 px-2 py-1 text-[10px] font-semibold text-red-600"
                                    >
                                      Revoke
                                    </button>
                                  ) : isTrial ? (
                                    <button
                                      type="button"
                                      onClick={() => endTrial(org.id)}
                                      className="rounded-lg border border-red-200 px-2 py-1 text-[10px] font-semibold text-red-600"
                                    >
                                      End trial
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => startTrial(org.id)}
                                      className="rounded-lg border border-emerald-200 px-2 py-1 text-[10px] font-semibold text-emerald-700"
                                    >
                                      Start trial
                                    </button>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                          {isGrantOpen ? (
                            <tr key={`${org.id}-grant`} className="bg-violet-50/50 dark:bg-violet-950/20">
                              <td colSpan={8} className="px-4 py-4">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                      Grant complimentary access — {org.name}
                                    </p>
                                    <p className="mt-0.5 text-[11px] text-slate-500">
                                      Paid plan access until expiry — then Starter (cancelled).
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setGrantOrgId(null)}
                                    className="rounded p-1 text-slate-400 hover:bg-white/80"
                                    aria-label="Close"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                  <label className="block text-[10px] font-bold uppercase text-slate-500">
                                    Plan
                                    <select
                                      value={grantPlan}
                                      onChange={(e) => setGrantPlan(e.target.value as ComplimentaryPlan)}
                                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm dark:border-white/15 dark:bg-[#12161c]"
                                    >
                                      <option value="starter">Starter</option>
                                      <option value="pro">Pro</option>
                                      <option value="business">Business</option>
                                    </select>
                                  </label>
                                  <label className="block text-[10px] font-bold uppercase text-slate-500">
                                    Duration
                                    <select
                                      value={grantDuration}
                                      onChange={(e) => setGrantDuration(e.target.value as DurationPreset)}
                                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm dark:border-white/15 dark:bg-[#12161c]"
                                    >
                                      <option value="14">14 days</option>
                                      <option value="30">30 days</option>
                                      <option value="60">60 days</option>
                                      <option value="custom">Custom date</option>
                                    </select>
                                  </label>
                                  {grantDuration === "custom" ? (
                                    <label className="block text-[10px] font-bold uppercase text-slate-500">
                                      Expiry date
                                      <input
                                        type="date"
                                        value={grantCustomDate}
                                        onChange={(e) => setGrantCustomDate(e.target.value)}
                                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm dark:border-white/15 dark:bg-[#12161c]"
                                      />
                                    </label>
                                  ) : null}
                                  <label className="block text-[10px] font-bold uppercase text-slate-500 sm:col-span-2">
                                    Reason (required)
                                    <input
                                      type="text"
                                      value={grantReason}
                                      onChange={(e) => setGrantReason(e.target.value)}
                                      placeholder="e.g. Partner pilot, launch promo"
                                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm dark:border-white/15 dark:bg-[#12161c]"
                                    />
                                  </label>
                                </div>
                                <button
                                  type="button"
                                  disabled={grantBusy}
                                  onClick={() => void submitComplimentaryGrant(org.id)}
                                  className="mt-3 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
                                >
                                  {grantBusy ? "Granting…" : "Grant complimentary access"}
                                </button>
                              </td>
                            </tr>
                          ) : null}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {(data?.organizations ?? []).length === 0 ? (
                <p className="px-4 py-6 text-sm text-slate-500">No organizations found.</p>
              ) : null}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
