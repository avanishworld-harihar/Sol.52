"use client";

import { CustomersLeadList } from "@/components/customers-lead-list";
import { CustomerWorkspacePane } from "@/components/customer-workspace-pane";
import { WorkflowLifecycleStrip } from "@/components/workflow-lifecycle-strip";
import { FloatingLabelInput, StaticLabelSelect } from "@/components/ui/floating-label-input";
import { HelpHint } from "@/components/ui/help-hint";
import { useToast } from "@/components/ui/toast-center";
import {
  CUSTOMERS_SWR_KEY,
  fetchCustomers,
  getCustomersCacheAgeMs,
  readCustomersCache,
  touchCustomersSavedAt,
  writeCustomersCache
} from "@/lib/customers-client";
import {
  DASHBOARD_STATS_SWR_KEY,
  type DashboardStatsPayload
} from "@/lib/dashboard-stats-client";
import { OfflineDataNotice } from "@/components/offline-data-notice";
import { useInstallerDiscoms } from "@/hooks/use-installer-discoms";
import {
  LEAD_STATUS_I18N_KEY,
  LEAD_STATUS_OPTIONS,
  normalizeLeadStatus,
  type LeadStatusKey
} from "@/lib/lead-status";
import { LEAD_SURVEY_STATUS_OPTIONS } from "@/lib/proposal-survey-gate";
import { removeLeadFollowUp } from "@/lib/lead-followup-storage";
import { WorkspacePage, WorkspacePageHero, WorkspaceStaggerItem } from "@/components/workspace";
import { cn } from "@/lib/utils";
import { INDIAN_STATES_AND_UTS } from "@/lib/indian-states-uts";
import {
  INSTALLER_REGION_EVENT,
  mergeSavedDiscomOption,
  readInstallerRegion,
  resolveDiscomCode,
  writeInstallerRegion
} from "@/lib/installer-region-storage";
import { useLanguage } from "@/lib/language-context";
import { LEAD_CONNECTION_TYPE_OPTIONS } from "@/lib/lead-connection-types";
import type { CustomerLead } from "@/lib/types";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { TABLET_SPLIT_MEDIA_QUERY } from "@/lib/tablet-split-view";
import type { FormEvent } from "react";
import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR, { useSWRConfig } from "swr";
import { Search, X } from "lucide-react";

/** Above `#ss-bottom-nav-portal` (9999) so lead sheet footer stays tappable on mobile. */
const LEAD_MODAL_Z = "z-[10060]";

type LeadModal = "none" | "add" | "edit";
type StageFilter = "all" | "leads" | "proposal-sent" | "active-projects";

function CustomersPageContent() {
  const { t } = useLanguage();
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const online = useOnlineStatus();
  const { mutate: mutateGlobal } = useSWRConfig();
  const openFromQuery = searchParams.get("add") === "1";
  const [leadModal, setLeadModal] = useState<LeadModal>(() => (openFromQuery ? "add" : "none"));

  useEffect(() => {
    setLeadModalPortalReady(true);
  }, []);

  useEffect(() => {
    if (leadModal === "none") return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [leadModal]);
  const [editLeadId, setEditLeadId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CustomerLead | null>(null);
  const [leadModalPortalReady, setLeadModalPortalReady] = useState(false);
  const [error, setError] = useState("");
  /** Add-modal starts as quick capture; edit always shows everything. */
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const detailsOpen = leadModal === "edit" || showMoreDetails;
  const [form, setForm] = useState({
    name: "",
    consumer_name: "",
    city: "",
    state: "",
    discom: "",
    monthly_bill: "",
    status: "new",
    phone: "",
    consumer_id: "",
    survey_status: "",
    area: "",
    location: "",
    connection_type: ""
  });
  const { options: leadDiscomOptions, loading: leadDiscomListLoading } = useInstallerDiscoms(form.state);
  const leadDiscomSelectOptions = useMemo(
    () => mergeSavedDiscomOption(form.discom, leadDiscomOptions),
    [form.discom, leadDiscomOptions]
  );
  const modalFloatingClass =
    "min-h-12 rounded-xl border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 focus:border-teal-500 focus:ring-teal-200/70";
  const modalSelectClass =
    "h-12 rounded-xl border-slate-200 bg-white text-sm font-medium text-slate-800 focus:border-teal-500 focus:ring-teal-200/70 dark:border-white/10 dark:bg-[#0c1017] dark:text-slate-100";
  const modalLabelBg = "bg-white dark:bg-[#161B22]";

  const { data, error: loadError, isLoading, mutate } = useSWR<CustomerLead[]>(CUSTOMERS_SWR_KEY, fetchCustomers, {
    dedupingInterval: 25_000,
    /** After web proposal in another tab, returning here should show `proposal-sent` + green CTA. */
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    keepPreviousData: true,
    onSuccess: (list) => writeCustomersCache(list)
  });

  const allCustomers = data ?? [];

  const [stageFilter, setStageFilter] = useState<StageFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const customers = useMemo(() => {
    let list = allCustomers;
    if (stageFilter === "leads") {
      list = list.filter((c) => (c.customer_stage ?? "lead") === "lead");
    } else if (stageFilter === "proposal-sent") {
      list = list.filter((c) => normalizeLeadStatus(c.status) === "proposal-sent");
    } else if (stageFilter === "active-projects") {
      list = list.filter((c) => (c.customer_stage ?? "lead") === "active-project");
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const qDigits = q.replace(/\D/g, "");
      list = list.filter((c) => {
        const name = c.name.toLowerCase();
        const city = c.city.toLowerCase();
        const location = (c.location ?? "").toLowerCase();
        const consumer = (c.consumer_name ?? "").toLowerCase();
        const phone = (c.phone ?? "").toLowerCase();
        const phoneDigits = (c.phone ?? "").replace(/\D/g, "");
        const household = (c.household_member_names ?? []).join(" ").toLowerCase();
        return (
          name.includes(q) ||
          city.includes(q) ||
          location.includes(q) ||
          consumer.includes(q) ||
          phone.includes(q) ||
          household.includes(q) ||
          (qDigits.length >= 4 && phoneDigits.includes(qDigits))
        );
      });
    }
    return list;
  }, [allCustomers, stageFilter, searchQuery]);

  const stageCounts = useMemo(
    () => ({
      all: allCustomers.length,
      leads: allCustomers.filter((c) => (c.customer_stage ?? "lead") === "lead").length,
      "proposal-sent": allCustomers.filter((c) => normalizeLeadStatus(c.status) === "proposal-sent").length,
      "active-projects": allCustomers.filter((c) => (c.customer_stage ?? "lead") === "active-project").length
    }),
    [allCustomers]
  );

  const leadQs = searchParams.get("lead");
  useEffect(() => {
    if (leadQs && allCustomers.some((c) => c.id === leadQs)) {
      setSelectedLeadId(leadQs);
    }
  }, [leadQs, allCustomers]);

  /** Tablet split: auto-focus first lead when none selected (Mail-style inbox). */
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia(TABLET_SPLIT_MEDIA_QUERY).matches) return;
    if (selectedLeadId || customers.length === 0) return;
    const first = customers[0]!.id;
    setSelectedLeadId(first);
    router.replace(`/customers?lead=${encodeURIComponent(first)}`, { scroll: false });
  }, [customers, selectedLeadId, router]);

  const onWorkspaceSelectLead = useCallback(
    (id: string) => {
      setSelectedLeadId(id);
      router.replace(`/customers?lead=${encodeURIComponent(id)}`, { scroll: false });
    },
    [router]
  );

  const workspaceCustomer = useMemo(() => {
    if (!selectedLeadId) return null;
    if (!customers.some((c) => c.id === selectedLeadId)) return null;
    return allCustomers.find((c) => c.id === selectedLeadId) ?? null;
  }, [allCustomers, customers, selectedLeadId]);

  useEffect(() => {
    if (selectedLeadId == null) return;
    if (customers.length === 0) {
      setSelectedLeadId(null);
      router.replace("/customers", { scroll: false });
      return;
    }
    if (!customers.some((c) => c.id === selectedLeadId)) {
      const next = customers[0]!.id;
      setSelectedLeadId(next);
      router.replace(`/customers?lead=${encodeURIComponent(next)}`, { scroll: false });
    }
  }, [customers, selectedLeadId, router]);

  const showListSkeleton = isLoading && data === undefined && !loadError;

  useLayoutEffect(() => {
    const boot = readCustomersCache();
    if (boot !== undefined) void mutate(boot, { revalidate: true });
  }, [mutate]);

  useEffect(() => {
    setLeadModal(openFromQuery ? "add" : "none");
    if (!openFromQuery) setEditLeadId(null);
  }, [openFromQuery]);

  useEffect(() => {
    const { state, discom } = readInstallerRegion();
    setForm((p) => ({
      ...p,
      state: state || p.state,
      discom: discom || p.discom
    }));
  }, []);

  useEffect(() => {
    const sync = () => {
      const { state, discom } = readInstallerRegion();
      setForm((p) => {
        const ns = state?.trim() ? state.trim() : p.state;
        const nd = discom?.trim() ? discom.trim() : p.discom;
        if (ns === p.state && nd === p.discom) return p;
        return { ...p, state: ns, discom: nd };
      });
    };
    window.addEventListener(INSTALLER_REGION_EVENT, sync);
    return () => window.removeEventListener(INSTALLER_REGION_EVENT, sync);
  }, []);

  useEffect(() => {
    if (leadModal !== "add") return;
    const { state, discom } = readInstallerRegion();
    setForm((p) => ({
      ...p,
      state: state || p.state,
      discom: discom || p.discom
    }));
  }, [leadModal]);

  useEffect(() => {
    if (!form.state.trim()) return;
    if (leadDiscomOptions.length === 0) return;
    setForm((p) => {
      const next = resolveDiscomCode(p.discom.trim(), leadDiscomOptions);
      return next === p.discom ? p : { ...p, discom: next };
    });
  }, [form.state, leadDiscomOptions]);

  useEffect(() => {
    if (leadModal !== "add") return;
    const s = form.state.trim();
    const d = form.discom.trim();
    if (!s || !d) return;
    writeInstallerRegion(s, d);
  }, [leadModal, form.state, form.discom]);

  /**
   * Optimistic pipeline status change. Mutates the SWR cache instantly so the
   * pill animates without waiting for the round trip; on failure we roll back
   * and toast the operator. Server stamps `last_touched_at` so the row also
   * lifts out of any "stale" filter automatically.
   */
  function handleStatusChange(leadId: string, next: LeadStatusKey) {
    let beforeStatus: string | undefined;
    void mutate((current) => {
      const list = current ?? [];
      const row = list.find((c) => c.id === leadId);
      beforeStatus = row?.status;
      if (row?.status === next) return list;
      return list.map((c) => (c.id === leadId ? { ...c, status: next } : c));
    }, { revalidate: false });

    if (beforeStatus === next) return;

    void (async () => {
      try {
        const r = await fetch(`/api/customers/${leadId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: next })
        });
        const j = (await r.json()) as { ok?: boolean; data?: CustomerLead; error?: string };
        if (!j.ok) throw new Error(j.error || "Could not update status");
        if (j.data?.id === leadId) {
          await mutate(
            (current) => {
              const list = current ?? [];
              return list.map((c) => (c.id === leadId ? { ...c, ...j.data! } : c));
            },
            { revalidate: false }
          );
        }
        await mutate();
        await mutateGlobal(DASHBOARD_STATS_SWR_KEY, undefined, { revalidate: true });
        toast.success("Pipeline updated", `Moved to ${LEAD_STATUS_OPTIONS.find((o) => o.value === next)?.label ?? next}.`);
      } catch (e) {
        await mutate((current) => {
          const list = current ?? [];
          return list.map((c) => (c.id === leadId ? { ...c, status: beforeStatus ?? c.status } : c));
        }, { revalidate: false });
        toast.error("Status update failed", e instanceof Error ? e.message : "Please try again.");
      }
    })();
  }

  function bumpDashboardLeads(delta: number) {
    void mutateGlobal(
      DASHBOARD_STATS_SWR_KEY,
      (prev?: DashboardStatsPayload) => {
        const base: DashboardStatsPayload = prev ?? {
          totalLeads: 0,
          proposalsSent: 0,
          orders: 0,
          installedKw: 0,
          revenue: 0,
          pendingPayments: 0,
          recentProjects: []
        };
        return { ...base, totalLeads: Math.max(0, base.totalLeads + delta) };
      },
      { revalidate: false }
    );
  }

  function closeLeadModal() {
    setLeadModal("none");
    setEditLeadId(null);
    setError("");
    setShowMoreDetails(false);
    const r = readInstallerRegion();
    setForm({
      name: "",
      consumer_name: "",
      city: "",
      state: r.state,
      discom: r.discom,
      monthly_bill: "",
      status: "new",
      phone: "",
      consumer_id: "",
      survey_status: "",
      area: "",
      location: "",
      connection_type: ""
    });
  }

  function openEditLead(customer: CustomerLead) {
    if (customer.id.startsWith("optimistic-")) return;
    setError("");
    setEditLeadId(customer.id);
    setLeadModal("edit");
    setForm({
      name: customer.name,
      city: customer.city,
      state: (customer.state ?? "").trim(),
      discom: customer.discom,
      monthly_bill: String(customer.monthly_bill ?? ""),
      status: normalizeLeadStatus(customer.status),
      consumer_name: (customer.consumer_name ?? "").trim(),
      phone: (customer.phone ?? "").trim(),
      consumer_id: (customer.consumer_id ?? "").trim(),
      survey_status: (() => {
        const s = (customer.survey_status ?? "").trim().toLowerCase().replace(/-/g, "_");
        if (s === "not_started" || s === "scheduled" || s === "complete") return s;
        return "";
      })(),
      area: (customer.area ?? "").trim(),
      location: (customer.location ?? "").trim(),
      connection_type: (customer.connection_type ?? "").trim()
    });
  }

  const mergeLeadIntoListCache = useCallback(
    (updated: CustomerLead) => {
      void mutate(
        (prev) => {
          const list = prev ?? [];
          const ix = list.findIndex((c) => c.id === updated.id);
          if (ix >= 0) {
            const next = [...list];
            next[ix] = updated;
            writeCustomersCache(next);
            return next;
          }
          const next = [updated, ...list];
          writeCustomersCache(next);
          return next;
        },
        { revalidate: false }
      );
    },
    [mutate]
  );

  const openEditLeadFresh = useCallback(
    async (customerOrId: CustomerLead | string) => {
      const id = typeof customerOrId === "string" ? customerOrId : customerOrId.id;
      if (id.startsWith("optimistic-")) return;
      try {
        const res = await fetch(`/api/customers/${encodeURIComponent(id)}`, { cache: "no-store" });
        const json = (await res.json()) as { ok?: boolean; data?: CustomerLead };
        if (res.ok && json.ok && json.data) {
          mergeLeadIntoListCache(json.data);
          openEditLead(json.data);
          return;
        }
      } catch {
        /* fall back to list row */
      }
      const fallback =
        typeof customerOrId === "string"
          ? allCustomers.find((c) => c.id === customerOrId)
          : customerOrId;
      if (fallback) openEditLead(fallback);
    },
    [allCustomers, mergeLeadIntoListCache]
  );

  const editLeadQs = searchParams.get("editLead")?.trim() ?? "";

  useEffect(() => {
    if (!editLeadQs) return;
    let cancelled = false;
    void (async () => {
      await openEditLeadFresh(editLeadQs);
      if (cancelled) return;
      setSelectedLeadId(editLeadQs);
      const params = new URLSearchParams(searchParams.toString());
      params.delete("editLead");
      params.set("lead", editLeadQs);
      router.replace(`/customers?${params.toString()}`, { scroll: false });
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editLeadQs]);

  async function confirmDeleteLead() {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    const prev = data ?? [];
    setDeleteTarget(null);
    void mutate(
      (p) => (p ?? []).filter((c) => c.id !== id),
      { revalidate: false }
    );
    try {
      const r = await fetch(`/api/customers/${encodeURIComponent(id)}`, { method: "DELETE" });
      const j = (await r.json()) as { ok?: boolean; error?: string; hint?: string };
      if (!j.ok) {
        const detail = [j.error, j.hint].filter(Boolean).join(" — ");
        throw new Error(detail || "Delete failed");
      }
      removeLeadFollowUp(id);
      await mutate();
      bumpDashboardLeads(-1);
      await mutateGlobal(DASHBOARD_STATS_SWR_KEY, undefined, { revalidate: true });
      toast.success(t("customers_leadDeleted"), t("customers_leadDeletedSub"));
    } catch (e) {
      await mutate(prev, { revalidate: false });
      toast.error(t("customers_leadDeleteFailed"), e instanceof Error ? e.message : "Please try again.");
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const payload = {
      name: form.name.trim(),
      city: form.city.trim(),
      discom: form.discom.trim(),
      monthly_bill: Number(form.monthly_bill),
      status: form.status,
      phone: form.phone.trim() || undefined
    };
    if (
      !payload.name ||
      !form.state.trim() ||
      !payload.city ||
      !payload.discom ||
      Number.isNaN(payload.monthly_bill)
    ) {
      /** A required field lives in the collapsed section — reveal it so the operator can fix it. */
      if (leadModal === "add" && (!form.state.trim() || !payload.discom)) {
        setShowMoreDetails(true);
      }
      setError(t("customers_fillRequired"));
      return;
    }

    if (leadModal === "edit" && editLeadId) {
      void (async () => {
        try {
          const r = await fetch(`/api/customers/${editLeadId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: payload.name,
              consumer_name: form.consumer_name.trim() || null,
              city: payload.city,
              state: form.state.trim() || undefined,
              discom: payload.discom,
              monthly_bill: payload.monthly_bill,
              status: payload.status,
              phone: form.phone.trim() ? form.phone.trim() : null,
              consumer_id: form.consumer_id.trim() ? form.consumer_id.trim() : null,
              survey_status: form.survey_status.trim()
                ? form.survey_status.trim().toLowerCase()
                : null,
              area: form.area.trim() ? form.area.trim() : null,
              location: form.location.trim() ? form.location.trim() : null,
              connection_type: form.connection_type.trim() ? form.connection_type.trim() : null
            })
          });
          const j = (await r.json()) as { ok?: boolean; data?: CustomerLead; error?: string };
          if (!j.ok) throw new Error(j.error || "Could not update lead");
          if (j.data) {
            mergeLeadIntoListCache(j.data);
          }
          await mutate(undefined, { revalidate: true });
          await mutateGlobal(CUSTOMERS_SWR_KEY, undefined, { revalidate: true });
          await mutateGlobal(DASHBOARD_STATS_SWR_KEY, undefined, { revalidate: true });
          closeLeadModal();
          toast.success(t("customers_leadUpdated"), t("customers_leadUpdatedSub"));
        } catch (e) {
          toast.error(t("customers_leadUpdateFailed"), e instanceof Error ? e.message : "Please try again.");
        }
      })();
      return;
    }

    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticRow: CustomerLead = {
      id: optimisticId,
      name: payload.name,
      city: payload.city,
      discom: payload.discom,
      monthly_bill: payload.monthly_bill,
      status: payload.status,
      phone: payload.phone ?? null,
      consumer_id: form.consumer_id.trim() ? form.consumer_id.trim() : null,
      survey_status: form.survey_status.trim() ? form.survey_status.trim().toLowerCase() : null,
      area: form.area.trim() || undefined,
      location: form.location.trim() || undefined,
      connection_type: form.connection_type.trim() || undefined
    };

    void mutate((prev) => [optimisticRow, ...(prev ?? [])], { revalidate: false });
    bumpDashboardLeads(1);
    toast.info("Saving customer", "Lead is visible instantly while SOL.52 syncs in background.");

    {
      const r = readInstallerRegion();
      setForm({
        name: "",
        consumer_name: "",
        city: "",
        state: r.state,
        discom: r.discom,
        monthly_bill: "",
        status: "new",
        phone: "",
        consumer_id: "",
        survey_status: "",
        area: "",
        location: "",
        connection_type: ""
      });
    }
    setLeadModal("none");
    setEditLeadId(null);
    router.push("/");

    void (async () => {
      try {
        const postBody: Record<string, unknown> = { ...payload, state: form.state.trim() || undefined };
        if (form.consumer_name.trim()) postBody.consumer_name = form.consumer_name.trim();
        if (form.consumer_id.trim()) postBody.consumer_id = form.consumer_id.trim();
        if (form.survey_status.trim()) postBody.survey_status = form.survey_status.trim().toLowerCase();
        if (form.area.trim()) postBody.area = form.area.trim();
        if (form.location.trim()) postBody.location = form.location.trim();
        if (form.connection_type.trim()) postBody.connection_type = form.connection_type.trim();
        const response = await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(postBody)
        });
        const result = await response.json() as {
          ok?: boolean;
          deduped?: boolean;
          householdLinked?: boolean;
          error?: string;
          data?: CustomerLead;
        };
        if (!result.ok) throw new Error(result.error || "Could not save customer");

        const serverRow = result.data as CustomerLead;
        if (result.deduped) {
          /* Same person (channel merge) — refresh existing. */
          await mutate(
            (prev) => (prev ?? []).filter((c) => c.id !== optimisticId),
            { revalidate: false }
          );
          bumpDashboardLeads(-1);
          await mutate();
          toast.info(
            "Lead already in CRM",
            `${serverRow.name} already exists — last touch refreshed.`
          );
        } else {
          await mutate(
            (prev) => {
              const next = [serverRow, ...(prev ?? []).filter((c) => c.id !== optimisticId)];
              writeCustomersCache(next);
              touchCustomersSavedAt();
              return next;
            },
            { revalidate: false }
          );
          await mutateGlobal(DASHBOARD_STATS_SWR_KEY, undefined, { revalidate: true });
          if (result.householdLinked) {
            toast.success(
              "Family member added",
              `${payload.name} saved — shares household / WhatsApp with an existing contact.`
            );
          } else {
            toast.success("Customer saved", `${payload.name} has been added to your lead list.`);
          }
        }
      } catch (e) {
        await mutate(
          (prev) => (prev ?? []).filter((c) => c.id !== optimisticId),
          { revalidate: false }
        );
        bumpDashboardLeads(-1);
        await mutateGlobal(DASHBOARD_STATS_SWR_KEY, undefined, { revalidate: true });
        console.error(e);
        toast.error("Could not save customer", e instanceof Error ? e.message : "Please try again.");
      }
    })();
  }

  return (
    <>
      <WorkspacePage tone="customers">
        <OfflineDataNotice
          show={!online && data !== undefined}
          cacheAgeMs={getCustomersCacheAgeMs()}
          label={t("offline_customersStrip")}
        />

        {loadError && data === undefined && (
          <div className="page-lite-item rounded-2xl border border-amber-200/90 bg-amber-50/90 p-4 text-sm font-semibold text-amber-950 backdrop-blur-sm">
            {(loadError as Error).message ?? t("dashboard_errorLoad")} {t("customers_errorConnect")}
          </div>
        )}

        <WorkspaceStaggerItem>
          <WorkspacePageHero
            tone="customers"
            eyebrow={t("customers_sectionLabel")}
            title={t("customers_heading")}
            subtitle={t("customers_sub")}
            subtitleDetail={t("customers_sub_detail")}
            action={
              <button
                type="button"
                className="workspace-cta-primary"
                onClick={() => {
                  setEditLeadId(null);
                  setLeadModal("add");
                }}
              >
                {t("customers_addLeadCta")}
              </button>
            }
            footer={<WorkflowLifecycleStrip surface="crm" />}
          />
        </WorkspaceStaggerItem>

        <WorkspaceStaggerItem
          className={cn(
            "md:max-xl:grid md:max-xl:min-h-0",
            "md:max-xl:h-[min(calc(100dvh-11rem),720px)]",
            "md:max-xl:grid-cols-[minmax(280px,0.42fr)_minmax(0,1fr)]",
            "md:max-xl:gap-0 md:max-xl:overflow-hidden md:max-xl:rounded-2xl md:max-xl:border md:max-xl:border-slate-200/90 md:max-xl:bg-white/80 md:max-xl:shadow-sm",
            "dark:md:max-xl:border-white/10 dark:md:max-xl:bg-[#0c1017]/90"
          )}
        >
          <div className="flex min-h-0 min-w-0 flex-col md:max-xl:overflow-hidden md:max-xl:border-r md:max-xl:border-slate-200/80 dark:md:max-xl:border-white/10">
            <div className="shrink-0 space-y-3 p-0 md:max-xl:px-3 md:max-xl:pt-3">
            <div className="relative flex items-center">
              <Search
                className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400"
                aria-hidden
                strokeWidth={2.25}
              />
              <input
                type="search"
                placeholder={t("customers_searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "w-full rounded-xl border bg-white py-2.5 pl-9 pr-9 text-sm font-medium",
                  "border-slate-200/80 text-slate-800 placeholder:text-slate-400",
                  "focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20",
                  "dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:placeholder:text-slate-500",
                  "dark:focus:border-teal-500 dark:focus:ring-teal-500/20"
                )}
                aria-label={t("customers_searchAria")}
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label={t("actions_close")}
                  className="absolute right-3 rounded-md p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
            <div className="workspace-filter-rail">
          {(
            [
              { key: "all", label: t("customers_filterAll") },
              { key: "leads", label: t("customers_filterLeads") },
              { key: "proposal-sent", label: t("customers_filterProposalSent") },
              { key: "active-projects", label: t("customers_filterActiveProjects") }
            ] as const
          ).map((opt) => {
            const isActive = stageFilter === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setStageFilter(opt.key)}
                className={cn(
                  "workspace-filter-pill",
                  isActive ? "workspace-filter-pill--active" : "workspace-filter-pill--idle"
                )}
                aria-pressed={isActive}
              >
                <span>{opt.label}</span>
                <span
                  className={cn(
                    "inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[10px] tabular-nums",
                    isActive ? "bg-white/20 text-white" : "bg-slate-200/80 text-slate-700"
                  )}
                >
                  {stageCounts[opt.key]}
                </span>
              </button>
            );
          })}
            </div>
            <p className="hidden text-[11px] font-semibold text-slate-500 md:max-xl:block xl:hidden dark:text-slate-400">
              {t("customers_splitHint")}
            </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto md:max-xl:px-3 md:max-xl:pb-3">
            <CustomersLeadList
              customers={customers}
              loading={showListSkeleton}
              onStatusChange={handleStatusChange}
              onEditLead={(c) => void openEditLeadFresh(c)}
              onDeleteLead={(c) => setDeleteTarget(c)}
              selectedLeadId={selectedLeadId}
              onSelectLead={onWorkspaceSelectLead}
            />
            </div>
          </div>

          <div className="hidden min-h-0 p-3 md:max-xl:flex md:max-xl:flex-col md:max-xl:overflow-hidden xl:hidden">
            <CustomerWorkspacePane customer={workspaceCustomer} onStatusChange={handleStatusChange} />
          </div>
        </WorkspaceStaggerItem>
      </WorkspacePage>

      {leadModal !== "none" &&
        leadModalPortalReady &&
        createPortal(
          <div
            className={cn(
              "fixed inset-0 flex items-end justify-center touch-manipulation sm:items-center sm:p-4",
              LEAD_MODAL_Z
            )}
            role="presentation"
          >
            <button
              type="button"
              className="absolute inset-0 cursor-default bg-slate-900/65 backdrop-blur-sm"
              aria-label={t("actions_close")}
              onClick={closeLeadModal}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="lead-modal-title"
              className="relative z-[1] flex h-[min(92dvh,100dvh)] max-h-[min(92dvh,100dvh)] w-full max-w-md min-h-0 flex-col overflow-hidden rounded-t-2xl border border-white/55 bg-[hsl(var(--card))] shadow-[0_30px_70px_-26px_rgba(15,23,42,0.48),0_8px_20px_-10px_rgba(15,23,42,0.24)] sm:h-auto sm:max-h-[min(90vh,920px)] sm:rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100/80 px-4 py-3 dark:border-white/10">
              <h3 id="lead-modal-title" className="text-base font-extrabold text-brand-800 sm:text-lg">
                {leadModal === "edit" ? t("customers_editLeadTitle") : t("customers_addModalTitle")}
              </h3>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600 transition-colors duration-200 hover:bg-slate-200"
                onClick={closeLeadModal}
                aria-label={t("actions_close")}
              >
                ×
              </button>
            </div>
            <form id="lead-modal-form" className="flex min-h-0 flex-1 flex-col" onSubmit={onSubmit}>
              <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-contain px-4 py-3 pb-2 sm:space-y-3">
              {/* ── Essentials — fast capture ─────────────────────────────── */}
              <FloatingLabelInput
                label="Name"
                containerClassName="my-4"
                labelBackgroundClassName={modalLabelBg}
                className={modalFloatingClass}
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
              <p className="-mt-2 mb-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Person you met / WhatsApp with (e.g. Raju). Bill name fills later as consumer.
              </p>
              <FloatingLabelInput
                label={t("customers_placeholderPhone")}
                containerClassName="my-4"
                labelBackgroundClassName={modalLabelBg}
                className={modalFloatingClass}
                inputMode="tel"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              />
              <FloatingLabelInput
                label={t("customers_placeholderCity")}
                containerClassName="my-4"
                labelBackgroundClassName={modalLabelBg}
                className={modalFloatingClass}
                value={form.city}
                onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
              />
              <FloatingLabelInput
                label={t("customers_placeholderBill")}
                containerClassName="my-4"
                labelBackgroundClassName={modalLabelBg}
                className={modalFloatingClass}
                inputMode="numeric"
                value={form.monthly_bill}
                onChange={(e) => setForm((p) => ({ ...p, monthly_bill: e.target.value }))}
              />

              {leadModal === "add" && (
                <button
                  type="button"
                  onClick={() => setShowMoreDetails((v) => !v)}
                  className="flex w-full items-center justify-between rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-teal-400 hover:bg-teal-50/60 dark:border-white/15 dark:bg-white/5 dark:text-slate-200"
                  aria-expanded={showMoreDetails}
                >
                  <span>{showMoreDetails ? "Hide extra details" : "Add more details (optional)"}</span>
                  <span className="text-xs text-slate-400">{showMoreDetails ? "▲" : "▼"}</span>
                </button>
              )}

              {/* ── More details — collapsed by default on add ────────────── */}
              {detailsOpen && (
                <>
                  <HelpHint
                    label={t("customers_regionSyncHint")}
                    detail={t("customers_regionSyncHint_detail")}
                  />
                  {leadModal === "edit" ? (
                    <FloatingLabelInput
                      label="Consumer name (on bill)"
                      containerClassName="my-4"
                      labelBackgroundClassName={modalLabelBg}
                      className={modalFloatingClass}
                      value={form.consumer_name}
                      onChange={(e) => setForm((p) => ({ ...p, consumer_name: e.target.value }))}
                    />
                  ) : null}
                  <StaticLabelSelect
                    label={t("customers_labelState")}
                    containerClassName="my-4"
                    className={modalSelectClass}
                    suppressHydrationWarning
                    value={form.state}
                    onChange={(e) => setForm((p) => ({ ...p, state: e.target.value, discom: "" }))}
                  >
                    <option value="">{t("dashboard_selectState")}</option>
                    {INDIAN_STATES_AND_UTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </StaticLabelSelect>
                  <StaticLabelSelect
                    label={t("customers_labelDiscom")}
                    containerClassName="my-4"
                    className={`${modalSelectClass} disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400`}
                    suppressHydrationWarning
                    value={form.discom}
                    disabled={!form.state.trim()}
                    onChange={(e) => setForm((p) => ({ ...p, discom: e.target.value }))}
                    aria-label={t("customers_labelDiscom")}
                  >
                    {!form.state.trim() ? (
                      <option value="">{t("dashboard_selectDiscom")}</option>
                    ) : leadDiscomListLoading && leadDiscomSelectOptions.length === 0 ? (
                      <option value="">{t("dashboard_loadingDiscoms")}</option>
                    ) : (
                      <>
                        <option value="">{t("dashboard_selectDiscom")}</option>
                        {leadDiscomSelectOptions.map((d) => (
                          <option key={d.id} value={d.code}>
                            {d.name} ({d.code})
                          </option>
                        ))}
                      </>
                    )}
                  </StaticLabelSelect>
                  <StaticLabelSelect
                    label={t("customers_labelConnectionType")}
                    containerClassName="my-4"
                    className={modalSelectClass}
                    suppressHydrationWarning
                    value={form.connection_type}
                    onChange={(e) => setForm((p) => ({ ...p, connection_type: e.target.value }))}
                  >
                    {LEAD_CONNECTION_TYPE_OPTIONS.map((o) => (
                      <option key={o.value || "unset"} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </StaticLabelSelect>
                  <FloatingLabelInput
                    label={t("customers_labelLocation")}
                    containerClassName="my-4"
                    labelBackgroundClassName={modalLabelBg}
                    className={modalFloatingClass}
                    value={form.location}
                    onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                  />
                  <FloatingLabelInput
                    label={t("customers_placeholderConsumerId")}
                    containerClassName="my-4"
                    labelBackgroundClassName={modalLabelBg}
                    className={modalFloatingClass}
                    value={form.consumer_id}
                    onChange={(e) => setForm((p) => ({ ...p, consumer_id: e.target.value }))}
                  />
                  <StaticLabelSelect
                    suppressHydrationWarning
                    label={t("customers_labelSurveyStatus")}
                    containerClassName="my-4"
                    className={modalSelectClass}
                    value={form.survey_status}
                    onChange={(e) => setForm((p) => ({ ...p, survey_status: e.target.value }))}
                  >
                    {LEAD_SURVEY_STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value || "unset"} value={opt.value}>
                        {t(opt.labelKey)}
                      </option>
                    ))}
                  </StaticLabelSelect>
                  <StaticLabelSelect
                    suppressHydrationWarning
                    label={t("customers_tablePipeline")}
                    containerClassName="my-4"
                    className={modalSelectClass}
                    value={form.status}
                    onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                  >
                    {LEAD_STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {t(LEAD_STATUS_I18N_KEY[opt.value])}
                      </option>
                    ))}
                  </StaticLabelSelect>
                </>
              )}
              {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
              </div>
              <div className="sticky bottom-0 z-10 shrink-0 border-t border-slate-100/80 bg-[hsl(var(--card))] px-4 py-3 shadow-[0_-10px_28px_-14px_rgba(15,23,42,0.28)] pb-[max(1rem,env(safe-area-inset-bottom,0px))] dark:border-white/10 sm:pb-3">
                <button
                  className="w-full min-h-12 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-4 py-3.5 text-sm font-extrabold text-white shadow-[0_14px_30px_-16px_rgba(20,184,166,0.9)] transition-all duration-200 hover:brightness-105 active:scale-[0.99]"
                  type="submit"
                >
                  {leadModal === "edit" ? t("customers_saveLeadChanges") : t("actions_saveCustomer")}
                </button>
              </div>
            </form>
            </div>
          </div>,
          document.body
        )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[10060] flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-lead-title"
            className="w-full max-w-sm rounded-2xl border border-white/50 bg-[hsl(var(--card))] p-5 shadow-xl"
          >
            <h3 id="delete-lead-title" className="text-base font-extrabold text-brand-900">
              {t("customers_deleteConfirmTitle")}
            </h3>
            <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">
              {t("customers_deleteConfirmBody", { name: deleteTarget.name })}
            </p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
                onClick={() => setDeleteTarget(null)}
              >
                {t("customers_deleteCancel")}
              </button>
              <button
                type="button"
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-sm transition-colors hover:bg-red-700"
                onClick={() => void confirmDeleteLead()}
              >
                {t("customers_deleteConfirmCta")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function CustomersPage() {
  return (
    <Suspense
      fallback={
        <p className="py-8 text-center text-sm font-semibold text-muted-foreground">Loading…</p>
      }
    >
      <CustomersPageContent />
    </Suspense>
  );
}
