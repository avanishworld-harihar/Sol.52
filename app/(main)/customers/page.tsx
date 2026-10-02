"use client";

import Link from "next/link";
import { CustomersLeadList } from "@/components/customers-lead-list";
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
import { sortCustomersByRecency } from "@/lib/customers-map";
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
import { createReminder } from "@/lib/followup-client";
import type { FollowupReminder } from "@/lib/followup-types";
import {
  QUICK_CALLBACK_PRESETS,
  CALLBACK_PRESETS,
  defaultCallbackTitle,
  resolveCallbackDueAt,
  type CallbackPresetId
} from "@/lib/crm-callback-schedule";
import { formatCrmDateTime } from "@/lib/crm-datetime";
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
import type { FormEvent } from "react";
import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR, { useSWRConfig } from "swr";
import { AlarmClock, CalendarCheck2, CalendarClock, Check, ChevronRight, Plus, Search, X } from "lucide-react";

/** Above `#ss-bottom-nav-portal` (9999) so lead sheet footer stays tappable on mobile. */
const LEAD_MODAL_Z = "z-[10060]";

type LeadModal = "none" | "add" | "edit";
type StageFilter = "all" | "leads" | "proposal-sent" | "active-projects";
type FollowupFilter = "all" | "scheduled" | "today" | "overdue" | "unscheduled";

function resolveStageFilter(value: string | null): StageFilter {
  if (value === "leads" || value === "proposal-sent" || value === "active-projects") return value;
  return "all";
}

function resolveFollowupFilter(value: string | null): FollowupFilter {
  if (value === "scheduled" || value === "today" || value === "overdue" || value === "unscheduled") return value;
  return "all";
}

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
  const [scheduleOnCreate, setScheduleOnCreate] = useState(true);
  const [newLeadCallbackPreset, setNewLeadCallbackPreset] = useState<CallbackPresetId>("next_week");
  const [newLeadCallbackDate, setNewLeadCallbackDate] = useState("");
  const [newLeadCallbackTime, setNewLeadCallbackTime] = useState("10:00");
  const [newLeadCallbackNote, setNewLeadCallbackNote] = useState("");
  const [newLeadCallbackTitle, setNewLeadCallbackTitle] = useState("");
  const [newLeadCallbackPriority, setNewLeadCallbackPriority] = useState<FollowupReminder["priority"]>("medium");
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

  const allCustomers = useMemo(() => data ?? [], [data]);

  const [stageFilter, setStageFilter] = useState<StageFilter>(() => resolveStageFilter(searchParams.get("stage")));
  const [followupFilter, setFollowupFilter] = useState<FollowupFilter>(() => resolveFollowupFilter(searchParams.get("callback")));
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("q") ?? "");

  useEffect(() => {
    setStageFilter(resolveStageFilter(searchParams.get("stage")));
    setFollowupFilter(resolveFollowupFilter(searchParams.get("callback")));
    setSearchQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  const updateListUrl = useCallback((nextStage: StageFilter, nextSearch = searchQuery, nextFollowup = followupFilter) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextStage === "all") params.delete("stage");
    else params.set("stage", nextStage);
    if (nextSearch.trim()) params.set("q", nextSearch.trim());
    else params.delete("q");
    if (nextFollowup === "all") params.delete("callback");
    else params.set("callback", nextFollowup);
    const query = params.toString();
    router.replace(query ? `/customers?${query}` : "/customers", { scroll: false });
  }, [followupFilter, router, searchParams, searchQuery]);

  const openCustomer = useCallback((leadId: string) => {
    router.push(`/customers/${encodeURIComponent(leadId)}`);
  }, [router]);

  const clearListFilters = useCallback(() => {
    setSearchQuery("");
    setStageFilter("all");
    setFollowupFilter("all");
    updateListUrl("all", "", "all");
  }, [updateListUrl]);

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
    if (followupFilter !== "all") {
      const now = new Date();
      const todayKey = now.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
      list = list.filter((customer) => {
        if (!customer.next_followup_at) return followupFilter === "unscheduled";
        const due = new Date(customer.next_followup_at);
        if (Number.isNaN(due.getTime())) return followupFilter === "unscheduled";
        const dueKey = due.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
        if (followupFilter === "scheduled") return true;
        if (followupFilter === "today") return dueKey === todayKey;
        if (followupFilter === "overdue") return due.getTime() < now.getTime() && dueKey !== todayKey;
        return false;
      });
    }
    /** Recent proposal / call / edit first — not random created_at order. */
    return sortCustomersByRecency(list);
  }, [allCustomers, followupFilter, stageFilter, searchQuery]);

  const stageCounts = useMemo(
    () => ({
      all: allCustomers.length,
      leads: allCustomers.filter((c) => (c.customer_stage ?? "lead") === "lead").length,
      "proposal-sent": allCustomers.filter((c) => normalizeLeadStatus(c.status) === "proposal-sent").length,
      "active-projects": allCustomers.filter((c) => (c.customer_stage ?? "lead") === "active-project").length
    }),
    [allCustomers]
  );

  const followupCounts = useMemo(() => {
    const now = new Date();
    const todayKey = now.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    return allCustomers.reduce(
      (counts, customer) => {
        if (!customer.next_followup_at) {
          counts.unscheduled += 1;
          return counts;
        }
        const due = new Date(customer.next_followup_at);
        if (Number.isNaN(due.getTime())) {
          counts.unscheduled += 1;
          return counts;
        }
        counts.scheduled += 1;
        const dueKey = due.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
        if (dueKey === todayKey) counts.today += 1;
        if (due.getTime() < now.getTime() && dueKey !== todayKey) counts.overdue += 1;
        return counts;
      },
      { scheduled: 0, today: 0, overdue: 0, unscheduled: 0 }
    );
  }, [allCustomers]);

  const legacyCustomerId = searchParams.get("customer")?.trim() ?? "";

  useEffect(() => {
    if (!legacyCustomerId) return;
    router.replace(`/customers/${encodeURIComponent(legacyCustomerId)}`);
  }, [legacyCustomerId, router]);

  const newLeadCallbackPreview = useMemo(() => {
    if (!scheduleOnCreate) return null;
    try {
      const dueAt = resolveCallbackDueAt(newLeadCallbackPreset, {
        customDateOnly: newLeadCallbackDate,
        customLocal:
          newLeadCallbackDate && newLeadCallbackTime
            ? `${newLeadCallbackDate}T${newLeadCallbackTime}`
            : undefined
      });
      return { dueAt, label: formatCrmDateTime(dueAt) };
    } catch {
      return null;
    }
  }, [newLeadCallbackDate, newLeadCallbackPreset, newLeadCallbackTime, scheduleOnCreate]);
  const newLeadCallbackResolvedTitle =
    newLeadCallbackTitle.trim() || defaultCallbackTitle(newLeadCallbackPreset, newLeadCallbackNote);

  const showListSkeleton = isLoading && data === undefined && !loadError;

  const openAddLead = useCallback(() => {
    setEditLeadId(null);
    setScheduleOnCreate(true);
    setNewLeadCallbackPreset("next_week");
    setNewLeadCallbackDate("");
    setNewLeadCallbackTime("10:00");
    setNewLeadCallbackNote("");
    setNewLeadCallbackTitle("");
    setNewLeadCallbackPriority("medium");
    setLeadModal("add");
  }, []);

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
        const savedStatus = j.data?.status ? normalizeLeadStatus(j.data.status) : next;
        if (savedStatus !== next) {
          throw new Error(`Server kept status as ${savedStatus} (wanted ${next})`);
        }
        /**
         * Trust the PATCH row — do not immediately revalidate the full customers
         * list (that GET runs heavy syncs and can briefly paint a stale status).
         */
        await mutate(
          (current) => {
            const list = current ?? [];
            const nextList = list.map((c) =>
              c.id === leadId
                ? { ...c, ...(j.data ?? {}), status: savedStatus }
                : c
            );
            writeCustomersCache(nextList);
            return nextList;
          },
          { revalidate: false }
        );
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
    setScheduleOnCreate(true);
    setNewLeadCallbackPreset("next_week");
    setNewLeadCallbackDate("");
    setNewLeadCallbackTime("10:00");
    setNewLeadCallbackNote("");
    setNewLeadCallbackTitle("");
    setNewLeadCallbackPriority("medium");
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
      const params = new URLSearchParams(searchParams.toString());
      params.delete("editLead");
      router.replace(params.toString() ? `/customers?${params.toString()}` : "/customers", {
        scroll: false,
      });
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
    if (leadModal === "edit") {
      if (!payload.name.trim() || Number.isNaN(payload.monthly_bill)) {
        setError(t("customers_fillRequired"));
        return;
      }
      /** Keep prior city/discom when selects blank (state/discom mismatch on older rows). */
      if (!payload.city) {
        const prior = data?.find((c) => c.id === editLeadId);
        payload.city = (prior?.city ?? "").trim() || "—";
      }
      if (!payload.discom) {
        const prior = data?.find((c) => c.id === editLeadId);
        payload.discom = (prior?.discom ?? "").trim() || "—";
      }
    } else if (
      !payload.name ||
      !form.state.trim() ||
      !payload.city ||
      !payload.discom ||
      Number.isNaN(payload.monthly_bill)
    ) {
      if (!form.state.trim() || !payload.discom) {
        setShowMoreDetails(true);
      }
      setError(t("customers_fillRequired"));
      return;
    }

    let callbackRequest: {
      dueAt: string;
      title: string;
      notes: string | null;
      priority: FollowupReminder["priority"];
    } | null = null;
    if (leadModal === "add" && scheduleOnCreate) {
      if (
        (newLeadCallbackPreset === "custom_date" || newLeadCallbackPreset === "custom_datetime") &&
        !newLeadCallbackDate
      ) {
        setError("Callback date select karein, ya Schedule callback ko off karein.");
        return;
      }
      try {
        const dueAt = resolveCallbackDueAt(newLeadCallbackPreset, {
          customDateOnly: newLeadCallbackDate,
          customLocal:
            newLeadCallbackDate && newLeadCallbackTime
              ? `${newLeadCallbackDate}T${newLeadCallbackTime}`
              : undefined
        });
        callbackRequest = {
          dueAt,
          title: newLeadCallbackResolvedTitle,
          notes: newLeadCallbackNote.trim() || null,
          priority: newLeadCallbackPriority
        };
      } catch {
        setError("Callback date valid nahi hai. Please dobara select karein.");
        return;
      }
    }

    if (leadModal === "edit" && editLeadId) {
      void (async () => {
        try {
          const areaRaw = form.area.trim().toLowerCase();
          const area =
            areaRaw === "urban" || areaRaw === "rural" ? areaRaw : null;
          const r = await fetch(`/api/customers/${encodeURIComponent(editLeadId)}`, {
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
              area,
              location: form.location.trim() ? form.location.trim() : null,
              connection_type: form.connection_type.trim()
                ? form.connection_type.trim()
                : null,
            }),
          });
          const j = (await r.json()) as { ok?: boolean; data?: CustomerLead; error?: string };
          if (!j.ok) throw new Error(j.error || "Could not update lead");
          if (j.data) {
            mergeLeadIntoListCache(j.data);
          } else {
            mergeLeadIntoListCache({
              ...(data?.find((c) => c.id === editLeadId) as CustomerLead),
              name: payload.name,
              consumer_name: form.consumer_name.trim() || null,
              city: payload.city,
              state: form.state.trim() || null,
              discom: payload.discom,
              monthly_bill: payload.monthly_bill,
              status: payload.status,
              phone: form.phone.trim() || null,
            });
          }
          closeLeadModal();
          toast.success(t("customers_leadUpdated"), t("customers_leadUpdatedSub"));
          /** Revalidate in background — heavy Customers GET must not block save success. */
          void mutate(undefined, { revalidate: true });
          void mutateGlobal(CUSTOMERS_SWR_KEY, undefined, { revalidate: true });
          void mutateGlobal(DASHBOARD_STATS_SWR_KEY, undefined, { revalidate: true });
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
      connection_type: form.connection_type.trim() || undefined,
      next_followup_at: callbackRequest?.dueAt ?? null,
      next_followup_title: callbackRequest?.title ?? null
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
    setScheduleOnCreate(true);
    setNewLeadCallbackPreset("next_week");
    setNewLeadCallbackDate("");
    setNewLeadCallbackTime("10:00");
    setNewLeadCallbackNote("");
    setNewLeadCallbackTitle("");
    setNewLeadCallbackPriority("medium");

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
        let savedRow = serverRow;
        let callbackSaved = false;

        if (callbackRequest) {
          try {
            const reminder = await createReminder(serverRow.id, {
              title: callbackRequest.title,
              due_at: callbackRequest.dueAt,
              priority: callbackRequest.priority,
              followup_type: "call",
              status: "pending",
              notes: callbackRequest.notes,
              snoozed_until: null
            });
            callbackSaved = true;
            savedRow = {
              ...serverRow,
              next_followup_id: reminder.id,
              next_followup_at: reminder.due_at,
              next_followup_title: reminder.title
            };
            void mutateGlobal("/api/followups/widgets", undefined, { revalidate: true });
            void mutateGlobal("/api/followups/widgets?view=all", undefined, { revalidate: true });
            void mutateGlobal("crm-command-center", undefined, { revalidate: true });
          } catch (callbackError) {
            toast.error(
              "Customer saved, callback pending",
              callbackError instanceof Error ? callbackError.message : "Callback could not be scheduled."
            );
          }
        }

        if (result.deduped) {
          /* Same person (channel merge) — refresh existing. */
          await mutate(
            (prev) => {
              const withoutOptimistic = (prev ?? []).filter((c) => c.id !== optimisticId);
              const exists = withoutOptimistic.some((c) => c.id === savedRow.id);
              const next = exists
                ? withoutOptimistic.map((c) => (c.id === savedRow.id ? savedRow : c))
                : [savedRow, ...withoutOptimistic];
              writeCustomersCache(next);
              return next;
            },
            { revalidate: false }
          );
          bumpDashboardLeads(-1);
          toast.info(
            "Lead already in CRM",
            callbackSaved
              ? `${serverRow.name} refreshed · callback ${formatCrmDateTime(callbackRequest!.dueAt)}.`
              : `${serverRow.name} already exists — last touch refreshed.`
          );
        } else {
          await mutate(
            (prev) => {
              const next = [savedRow, ...(prev ?? []).filter((c) => c.id !== optimisticId)];
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
              callbackSaved
                ? `${payload.name} saved · callback ${formatCrmDateTime(callbackRequest!.dueAt)}.`
                : `${payload.name} saved — shares household / WhatsApp with an existing contact.`
            );
          } else {
            toast.success(
              callbackSaved ? "Customer + callback saved" : "Customer saved",
              callbackSaved
                ? `${payload.name} · ${formatCrmDateTime(callbackRequest!.dueAt)}`
                : `${payload.name} has been added to your lead list.`
            );
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
                onClick={openAddLead}
              >
                {t("customers_addLeadCta")}
              </button>
            }
            footer={<WorkflowLifecycleStrip surface="crm" />}
          />
        </WorkspaceStaggerItem>

        <WorkspaceStaggerItem>
          <div className="space-y-3">
            <div className="relative z-10 rounded-2xl border border-slate-200/90 bg-white/90 p-2 shadow-[0_10px_28px_-18px_rgba(15,23,42,0.35)] backdrop-blur-xl dark:border-white/10 dark:bg-[#0c1017]/90 sm:p-3">
              <div className="flex items-center gap-2">
                <div className="relative flex min-w-0 flex-1 items-center">
                  <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" aria-hidden strokeWidth={2.25} />
                  <input
                    type="search"
                    placeholder={t("customers_searchPlaceholder")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onBlur={() => updateListUrl(stageFilter, searchQuery)}
                    onKeyDown={(e) => { if (e.key === "Enter") updateListUrl(stageFilter, searchQuery); }}
                    className={cn(
                      "h-12 w-full rounded-xl border bg-slate-50/70 py-2.5 pl-10 pr-10 text-sm font-medium",
                      "border-slate-200/80 text-slate-800 placeholder:text-slate-400",
                      "focus:border-teal-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/20",
                      "dark:border-white/10 dark:bg-black/15 dark:text-slate-100 dark:placeholder:text-slate-500",
                      "dark:focus:border-teal-500 dark:focus:ring-teal-500/20"
                    )}
                    aria-label={t("customers_searchAria")}
                  />
                  {searchQuery ? (
                    <button type="button" onClick={() => { setSearchQuery(""); updateListUrl(stageFilter, ""); }} aria-label={t("actions_close")} className="absolute right-3 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200/70 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-slate-200">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={openAddLead}
                  className="inline-flex h-12 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-teal-600 px-3 text-xs font-extrabold text-white shadow-sm transition hover:bg-teal-700 active:scale-[0.98] sm:px-4 sm:text-sm"
                >
                  <Plus className="h-4 w-4" aria-hidden />
                  <span className="hidden min-[360px]:inline">{t("customers_addLeadCta")}</span>
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-3 shadow-[0_10px_35px_-24px_rgba(15,23,42,0.32)] backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.035] sm:p-4">
              <div className="flex snap-x gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-4 sm:overflow-visible sm:pb-0" aria-label="Follow-up filters">
                <button type="button" aria-pressed={followupFilter === "scheduled"} onClick={() => { const next = followupFilter === "scheduled" ? "all" : "scheduled"; setFollowupFilter(next); updateListUrl(stageFilter, searchQuery, next); }} className={cn("group min-w-[8.25rem] flex-1 snap-start rounded-xl bg-teal-50 px-2.5 py-2.5 text-left text-teal-800 transition hover:bg-teal-100 sm:min-w-0 dark:bg-teal-950/30 dark:text-teal-200 dark:hover:bg-teal-950/50", followupFilter === "scheduled" && "ring-2 ring-teal-500 ring-offset-1 dark:ring-offset-slate-950")}>
                  <p className="flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wide" title="Customers with a pending follow-up"><CalendarCheck2 className="h-3 w-3" /> Scheduled</p>
                  <p className="mt-0.5 flex items-center justify-between text-lg font-black tabular-nums">{followupCounts.scheduled}<ChevronRight className="h-3.5 w-3.5 opacity-50 transition group-hover:translate-x-0.5" /></p>
                </button>
                <button type="button" aria-pressed={followupFilter === "today"} onClick={() => { const next = followupFilter === "today" ? "all" : "today"; setFollowupFilter(next); updateListUrl(stageFilter, searchQuery, next); }} className={cn("group min-w-[8.25rem] flex-1 snap-start rounded-xl bg-amber-50 px-2.5 py-2.5 text-left text-amber-900 transition hover:bg-amber-100 sm:min-w-0 dark:bg-amber-950/30 dark:text-amber-100 dark:hover:bg-amber-950/50", followupFilter === "today" && "ring-2 ring-amber-500 ring-offset-1 dark:ring-offset-slate-950")}>
                  <p className="flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wide"><AlarmClock className="h-3 w-3" /> Today</p>
                  <p className="mt-0.5 flex items-center justify-between text-lg font-black tabular-nums">{followupCounts.today}<ChevronRight className="h-3.5 w-3.5 opacity-50 transition group-hover:translate-x-0.5" /></p>
                </button>
                <button type="button" aria-pressed={followupFilter === "overdue"} onClick={() => { const next = followupFilter === "overdue" ? "all" : "overdue"; setFollowupFilter(next); updateListUrl(stageFilter, searchQuery, next); }} className={cn("group min-w-[8.25rem] flex-1 snap-start rounded-xl bg-rose-50 px-2.5 py-2.5 text-left text-rose-800 transition hover:bg-rose-100 sm:min-w-0 dark:bg-rose-950/30 dark:text-rose-200 dark:hover:bg-rose-950/50", followupFilter === "overdue" && "ring-2 ring-rose-500 ring-offset-1 dark:ring-offset-slate-950")}>
                  <p className="text-[9px] font-extrabold uppercase tracking-wide">Overdue</p>
                  <p className="mt-0.5 flex items-center justify-between text-lg font-black tabular-nums">{followupCounts.overdue}<ChevronRight className="h-3.5 w-3.5 opacity-50 transition group-hover:translate-x-0.5" /></p>
                </button>
                <button type="button" aria-pressed={followupFilter === "unscheduled"} onClick={() => { const next = followupFilter === "unscheduled" ? "all" : "unscheduled"; setFollowupFilter(next); updateListUrl(stageFilter, searchQuery, next); }} className={cn("group min-w-[8.25rem] flex-1 snap-start rounded-xl bg-slate-100 px-2.5 py-2.5 text-left text-slate-700 transition hover:bg-slate-200 sm:min-w-0 dark:bg-white/[0.07] dark:text-slate-200 dark:hover:bg-white/[0.1]", followupFilter === "unscheduled" && "ring-2 ring-slate-500 ring-offset-1 dark:ring-offset-slate-950")}>
                  <p className="text-[9px] font-extrabold uppercase tracking-wide">No callback</p>
                  <p className="mt-0.5 flex items-center justify-between text-lg font-black tabular-nums">{followupCounts.unscheduled}<Plus className="h-3.5 w-3.5 opacity-50 transition group-hover:scale-110" /></p>
                </button>
              </div>

              <div className="mt-3 flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Customer pipeline</p>
                  <p className="mt-0.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Showing <span className="font-black text-slate-900 dark:text-white">{customers.length}</span> of {allCustomers.length}
                    <span className="hidden lg:inline"> · Click a customer to open details</span>
                  </p>
                </div>
                <Link href="/agenda#priority-queue" className="shrink-0 text-[11px] font-extrabold text-teal-700 hover:underline dark:text-teal-300">
                  Open agenda →
                </Link>
              </div>
              <div className="workspace-filter-rail mt-2.5">
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
                onClick={() => { setStageFilter(opt.key); updateListUrl(opt.key); }}
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
            </div>

            <CustomersLeadList
              customers={customers}
              loading={showListSkeleton}
              onAddLead={openAddLead}
              emptyTitle={allCustomers.length > 0 ? "No matching customers" : undefined}
              emptyDescription={allCustomers.length > 0 ? "Search ya filters change karke customer queue dobara dekhein." : undefined}
              onClearFilters={allCustomers.length > 0 && (Boolean(searchQuery.trim()) || stageFilter !== "all" || followupFilter !== "all") ? clearListFilters : undefined}
              onStatusChange={handleStatusChange}
              onEditLead={(c) => void openEditLeadFresh(c)}
              onDeleteLead={(c) => setDeleteTarget(c)}
              onSelectLead={openCustomer}
            />
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

              {leadModal === "add" ? (
                <section className={cn(
                  "overflow-hidden rounded-2xl border transition-colors",
                  scheduleOnCreate
                    ? "border-teal-200 bg-teal-50/55 dark:border-teal-500/30 dark:bg-teal-950/20"
                    : "border-slate-200 bg-slate-50/70 dark:border-white/10 dark:bg-white/[0.03]"
                )}>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={scheduleOnCreate}
                    onClick={() => setScheduleOnCreate((value) => !value)}
                    className="flex min-h-14 w-full items-center gap-3 px-3.5 py-3 text-left"
                  >
                    <span className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                      scheduleOnCreate
                        ? "bg-teal-600 text-white"
                        : "bg-slate-200 text-slate-500 dark:bg-white/10 dark:text-slate-300"
                    )}>
                      <CalendarClock className="h-[18px] w-[18px]" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-extrabold text-slate-900 dark:text-slate-50">Schedule first callback</span>
                      <span className="mt-0.5 block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        Lead save hote hi agenda me reminder add hoga
                      </span>
                    </span>
                    <span className={cn(
                      "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                      scheduleOnCreate ? "bg-teal-600" : "bg-slate-300 dark:bg-slate-600"
                    )}>
                      <span className={cn(
                        "absolute top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-teal-600 shadow-sm transition-transform",
                        scheduleOnCreate ? "translate-x-5" : "translate-x-0.5"
                      )}>
                        {scheduleOnCreate ? <Check className="h-3 w-3" strokeWidth={3} aria-hidden /> : null}
                      </span>
                    </span>
                  </button>

                  {scheduleOnCreate ? (
                    <div className="border-t border-teal-200/70 px-3.5 pb-3.5 pt-3 dark:border-teal-500/20">
                      <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.13em] text-teal-800/70 dark:text-teal-200/70">When should we call?</p>
                      <div className="grid grid-cols-2 gap-2">
                        {QUICK_CALLBACK_PRESETS.map((presetId) => {
                          const preset = CALLBACK_PRESETS.find((item) => item.id === presetId)!;
                          const isCustomPreset = presetId === "custom_date";
                          const active = isCustomPreset
                            ? newLeadCallbackPreset === "custom_date" || newLeadCallbackPreset === "custom_datetime"
                            : newLeadCallbackPreset === presetId;
                          return (
                            <button
                              key={presetId}
                              type="button"
                              onClick={() => setNewLeadCallbackPreset(isCustomPreset ? "custom_datetime" : presetId)}
                              className={cn(
                                "min-h-11 rounded-xl border px-3 py-2 text-left transition active:scale-[0.98]",
                                active
                                  ? "border-teal-500 bg-white text-teal-900 ring-2 ring-teal-500/15 dark:bg-teal-950/50 dark:text-teal-100"
                                  : "border-slate-200/90 bg-white/70 text-slate-700 hover:border-teal-300 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200"
                              )}
                            >
                              <span className="block text-xs font-extrabold">{isCustomPreset ? "Pick date & time" : preset.label}</span>
                              <span className="mt-0.5 block text-[9px] font-semibold opacity-65">{isCustomPreset ? "Full control" : preset.hint}</span>
                            </button>
                          );
                        })}
                      </div>

                      {newLeadCallbackPreset === "custom_date" || newLeadCallbackPreset === "custom_datetime" ? (
                        <div className="mt-2 grid grid-cols-[1fr_7.5rem] gap-2">
                          <label className="block">
                            <span className="sr-only">Callback date</span>
                            <input
                              type="date"
                              value={newLeadCallbackDate}
                              min={new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })}
                              onChange={(e) => setNewLeadCallbackDate(e.target.value)}
                              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
                            />
                          </label>
                          <label className="block">
                            <span className="sr-only">Callback time</span>
                            <input
                              type="time"
                              value={newLeadCallbackTime}
                              onChange={(e) => setNewLeadCallbackTime(e.target.value)}
                              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
                            />
                          </label>
                        </div>
                      ) : null}

                      <div className="mt-3 space-y-3 rounded-xl border border-teal-200/80 bg-white/75 p-3 dark:border-teal-500/20 dark:bg-white/[0.04]">
                        <FloatingLabelInput
                          label="Reason / note (optional)"
                          labelBackgroundClassName={modalLabelBg}
                          className="h-11 min-h-11 rounded-xl text-sm"
                          maxLength={500}
                          value={newLeadCallbackNote}
                          onChange={(e) => setNewLeadCallbackNote(e.target.value)}
                        />
                        <FloatingLabelInput
                          label="Reminder title (auto if empty)"
                          labelBackgroundClassName={modalLabelBg}
                          className="h-11 min-h-11 rounded-xl text-sm"
                          maxLength={200}
                          value={newLeadCallbackTitle}
                          onChange={(e) => setNewLeadCallbackTitle(e.target.value)}
                        />
                        <label className="block">
                          <span className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-[0.13em] text-slate-500 dark:text-slate-400">
                            Priority
                          </span>
                          <select
                            value={newLeadCallbackPriority}
                            onChange={(e) => setNewLeadCallbackPriority(e.target.value as FollowupReminder["priority"])}
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                          </select>
                        </label>
                        <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                          Saved as: <span className="font-extrabold text-slate-900 dark:text-slate-50">{newLeadCallbackResolvedTitle}</span>
                        </p>
                      </div>

                      {newLeadCallbackPreview ? (
                        <p className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-teal-800 dark:text-teal-200">
                          <Check className="h-3.5 w-3.5" aria-hidden />
                          Agenda: {newLeadCallbackPreview.label}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </section>
              ) : null}

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
                  {leadModal === "edit"
                    ? t("customers_saveLeadChanges")
                    : scheduleOnCreate
                      ? "Save customer + callback"
                      : t("actions_saveCustomer")}
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
