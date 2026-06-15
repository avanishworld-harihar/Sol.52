"use client";

import { AppShell } from "@/components/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
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
  } | null;
};

type Payload = { ok: boolean; plans: Plan[]; organizations: OrgBilling[] };

async function fetchBilling(url: string): Promise<Payload> {
  const res = await fetch(url, { cache: "no-store" });
  const json = (await res.json()) as Payload & { error?: string };
  if (!res.ok || !json.ok) throw new Error(json.error ?? "Load failed");
  return json;
}

export default function AdminBillingPage() {
  const router = useRouter();
  const { data, error, isLoading, mutate } = useSWR<Payload>("/api/admin/billing", fetchBilling);

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

  return (
    <AppShell title="Billing">
      <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Billing & Subscriptions</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Phase 1 — manual plan assignment. Payment gateway in Phase 2.
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

            <section className="rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.04]">
              <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-bold dark:border-white/10">
                Organizations
              </h2>
              <div className="divide-y divide-slate-100 dark:divide-white/10">
                {(data?.organizations ?? []).map((org) => {
                  const sub = org.subscription;
                  const isTrial = sub?.plan.code === "trial";
                  return (
                    <div key={org.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{org.name}</p>
                        <p className="text-xs text-slate-500">
                          {sub
                            ? `${sub.plan.name} · ${sub.status}${
                                isTrial
                                  ? ` · ${sub.trial_proposals_used}/10 proposals · ends ${
                                      sub.trial_ends_at
                                        ? new Date(sub.trial_ends_at).toLocaleDateString("en-IN")
                                        : "—"
                                    }`
                                  : ""
                              }`
                            : "No subscription"}
                          {org.trial_consumed ? " · trial consumed" : ""}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(["trial", "starter", "pro", "business"] as const).map((code) => (
                          <button
                            key={code}
                            type="button"
                            onClick={() => assignPlan(org.id, code)}
                            className={cn(
                              "rounded-lg border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide",
                              sub?.plan.code === code
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-white/15 dark:text-slate-300"
                            )}
                          >
                            {code}
                          </button>
                        ))}
                        {isTrial ? (
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
                  );
                })}
                {(data?.organizations ?? []).length === 0 ? (
                  <p className="px-4 py-6 text-sm text-slate-500">No organizations found.</p>
                ) : null}
              </div>
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
