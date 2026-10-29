"use client";

import { displayPhone } from "@/lib/auth/phone";
import { FloatingLabelInput, FloatingLabelSelect } from "@/components/ui/floating-label-input";
import { useToast } from "@/components/ui/toast-center";
import { ArrowRightLeft, Inbox, Users, UserPlus, X } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Member = {
  id: string;
  user_id: string;
  role: string;
  work_role?: "office_sales" | "field_staff" | "hybrid";
  phone?: string | null;
  created_at: string;
  lead_count?: number;
  project_count?: number;
};

type Invite = {
  id: string;
  phone_e164: string;
  role: string;
  work_role?: "office_sales" | "field_staff" | "hybrid";
  created_at: string;
  expires_at: string | null;
};

type TeamData = {
  canManage: boolean;
  memberCount: number;
  pendingCount: number;
  maxUsers: number | null;
  teamEnabled: boolean;
  canAddMore: boolean;
  planCode: string | null;
  members: Member[];
  invites: Invite[];
  workSummary?: { unassignedLeads: number; unassignedProjects: number };
};

export function TeamManagementCard() {
  const toast = useToast();
  const [data, setData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"employee" | "company_admin">("employee");
  const [workRole, setWorkRole] = useState<"office_sales" | "field_staff" | "hybrid">("office_sales");
  const [busy, setBusy] = useState(false);
  const [offboardingMemberId, setOffboardingMemberId] = useState<string | null>(null);
  const [handoverTarget, setHandoverTarget] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/team/members", { cache: "no-store" });
      const payload = (await res.json()) as { ok?: boolean; data?: TeamData; error?: string };
      if (!res.ok || !payload.ok) {
        setData(null);
        return;
      }
      setData(payload.data ?? null);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function invite(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/team/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), role, workRole }),
      });
      const payload = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !payload.ok) throw new Error(payload.error ?? "Invite failed");
      toast.success("Invite sent", "Employee can sign in with OTP on that phone.");
      setPhone("");
      setRole("employee");
      setWorkRole("office_sales");
      await load();
    } catch (err) {
      toast.error("Invite failed", err instanceof Error ? err.message : "Could not invite");
    } finally {
      setBusy(false);
    }
  }

  async function cancelInvite(inviteId: string) {
    setBusy(true);
    try {
      const res = await fetch("/api/team/members", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId }),
      });
      const payload = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !payload.ok) throw new Error(payload.error ?? "Cancel failed");
      toast.success("Invite cancelled", "Pending invite removed.");
      await load();
    } catch (err) {
      toast.error("Cancel failed", err instanceof Error ? err.message : "Could not cancel");
    } finally {
      setBusy(false);
    }
  }

  async function removeMember(memberId: string) {
    setBusy(true);
    try {
      const res = await fetch("/api/team/members", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, reassignToUserId: handoverTarget || null }),
      });
      const payload = (await res.json()) as { ok?: boolean; error?: string; leadsMoved?: number; projectsMoved?: number; fieldAssignmentsMoved?: number };
      if (!res.ok || !payload.ok) throw new Error(payload.error ?? "Remove failed");
      toast.success(
        "Handover complete",
        `${payload.leadsMoved ?? 0} leads, ${payload.projectsMoved ?? 0} projects and ${payload.fieldAssignmentsMoved ?? 0} field jobs transferred. Access removed.`
      );
      setOffboardingMemberId(null);
      setHandoverTarget("");
      await load();
    } catch (err) {
      toast.error("Remove failed", err instanceof Error ? err.message : "Could not remove");
    } finally {
      setBusy(false);
    }
  }

  async function changeRole(memberId: string, nextRole: "employee" | "company_admin") {
    setBusy(true);
    try {
      const res = await fetch("/api/team/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, role: nextRole }),
      });
      const payload = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !payload.ok) throw new Error(payload.error ?? "Role update failed");
      toast.success("Role updated", "Access permissions will apply on the member's next sign-in.");
      await load();
    } catch (err) {
      toast.error("Role update failed", err instanceof Error ? err.message : "Could not update role");
    } finally {
      setBusy(false);
    }
  }

  async function changeWorkRole(memberId: string, nextWorkRole: "office_sales" | "field_staff" | "hybrid") {
    setBusy(true);
    try {
      const res = await fetch("/api/team/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, workRole: nextWorkRole }),
      });
      const payload = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !payload.ok) throw new Error(payload.error ?? "Work function update failed");
      toast.success("Work function updated", "Field access applies immediately.");
      await load();
    } catch (err) {
      toast.error("Update failed", err instanceof Error ? err.message : "Could not update work function");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-border/50 p-3 text-xs font-semibold text-muted-foreground">
        Loading team…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-border/50 p-3 text-xs font-semibold text-muted-foreground">
        Sign in as company admin to manage team.
      </div>
    );
  }

  if (!data.canManage) {
    return (
      <div className="space-y-2 text-xs font-medium text-muted-foreground">
        <p>
          Team seats: {data.memberCount}
          {data.pendingCount ? ` (+${data.pendingCount} pending)` : ""} / {data.maxUsers ?? "Unlimited"}
          {data.planCode ? ` · ${data.planCode}` : ""}
        </p>
        <p>Only the company admin can invite or remove members.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <Users className="h-4 w-4" />
        {data.memberCount}
        {data.pendingCount ? ` + ${data.pendingCount} pending` : ""} / {data.maxUsers ?? "Unlimited"} seats
        {!data.teamEnabled ? " · Upgrade to Pro/Business for team invites" : null}
      </div>

      {data.workSummary && (data.workSummary.unassignedLeads > 0 || data.workSummary.unassignedProjects > 0) ? (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs dark:border-amber-800 dark:bg-amber-950/30">
          <Inbox className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" />
          <div>
            <p className="font-extrabold text-amber-900 dark:text-amber-100">Team Inbox</p>
            <p className="mt-0.5 font-medium text-amber-800 dark:text-amber-200">
              {data.workSummary.unassignedLeads} unassigned leads · {data.workSummary.unassignedProjects} unassigned projects
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Link href="/customers?owner=unassigned" className="rounded-lg bg-amber-100 px-2 py-1 text-[11px] font-extrabold text-amber-900 hover:bg-amber-200 dark:bg-amber-900/50 dark:text-amber-100">
                Open leads
              </Link>
              <Link href="/projects?owner=unassigned" className="rounded-lg bg-amber-100 px-2 py-1 text-[11px] font-extrabold text-amber-900 hover:bg-amber-200 dark:bg-amber-900/50 dark:text-amber-100">
                Open projects
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      <form className="space-y-3" onSubmit={invite}>
        <FloatingLabelInput
          label="Employee mobile"
          type="tel"
          inputMode="numeric"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <FloatingLabelSelect
          label="Role"
          value={role}
          onChange={(e) => setRole(e.target.value as "employee" | "company_admin")}
        >
          <option value="employee">Employee (limited screens)</option>
          <option value="company_admin">Company admin</option>
        </FloatingLabelSelect>
        <FloatingLabelSelect
          label="Work function"
          value={workRole}
          onChange={(e) => setWorkRole(e.target.value as "office_sales" | "field_staff" | "hybrid")}
        >
          <option value="office_sales">Office sales</option>
          <option value="field_staff">Field staff</option>
          <option value="hybrid">Hybrid (sales + field)</option>
        </FloatingLabelSelect>
        <button
          type="submit"
          disabled={busy || phone.trim().length < 8}
          className="ss-cta-primary inline-flex w-full items-center justify-center gap-2"
        >
          <UserPlus className="h-4 w-4" />
          {busy ? "Inviting…" : "Send invite"}
        </button>
        {!data.teamEnabled ? (
          <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
            Plan may block team seats (Pro/Business). If invite fails, assign Pro in Admin Billing.
          </p>
        ) : null}
      </form>

      {data.invites.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-extrabold text-foreground">Pending invites</p>
          {data.invites.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-border/60 px-3 py-2 text-xs"
            >
              <div className="min-w-0">
                <p className="font-bold">{displayPhone(inv.phone_e164)}</p>
                <p className="text-muted-foreground">{inv.role === "company_admin" ? "Admin" : "Employee"} · {(inv.work_role ?? "office_sales").replace(/_/g, " ")}</p>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => void cancelInvite(inv.id)}
                className="rounded-lg border border-border p-1.5 hover:bg-muted/60"
                aria-label="Cancel invite"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {data.members.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-extrabold text-foreground">Members</p>
          {data.members.map((m) => (
            <div
              key={m.id}
              className="rounded-xl border border-border/60 px-3 py-2 text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-bold">{m.phone ? displayPhone(m.phone) : m.user_id.slice(0, 8)}</p>
                  <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
                    {m.lead_count ?? 0} leads · {m.project_count ?? 0} projects
                  </p>
                  <select
                    value={m.role === "company_admin" ? "company_admin" : "employee"}
                    disabled={busy}
                    onChange={(event) => void changeRole(m.id, event.target.value as "employee" | "company_admin")}
                    className="mt-1 rounded-md border border-border bg-background px-2 py-1 text-[11px] font-semibold text-muted-foreground"
                    aria-label={`Role for ${m.phone ?? m.user_id}`}
                  >
                    <option value="employee">Employee</option>
                    <option value="company_admin">Company admin</option>
                  </select>
                  <select
                    value={m.work_role ?? "office_sales"}
                    disabled={busy}
                    onChange={(event) => void changeWorkRole(m.id, event.target.value as "office_sales" | "field_staff" | "hybrid")}
                    className="ml-1 mt-1 rounded-md border border-border bg-background px-2 py-1 text-[11px] font-semibold text-muted-foreground"
                    aria-label={`Work function for ${m.phone ?? m.user_id}`}
                  >
                    <option value="office_sales">Office sales</option>
                    <option value="field_staff">Field staff</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setOffboardingMemberId(m.id);
                    setHandoverTarget("");
                  }}
                  className="rounded-lg border border-border px-2 py-1 text-[10px] font-bold hover:bg-muted/60"
                >
                  Remove
                </button>
              </div>
              {offboardingMemberId === m.id ? (
                <div className="mt-3 space-y-2 rounded-lg border border-amber-200 bg-amber-50/80 p-3 dark:border-amber-800 dark:bg-amber-950/30">
                  <div className="flex items-center gap-2 font-extrabold text-amber-900 dark:text-amber-100">
                    <ArrowRightLeft className="h-4 w-4" /> Safe work handover
                  </div>
                  <p className="text-[11px] font-medium text-amber-800 dark:text-amber-200">
                    Their leads, projects and active field jobs will move before access is removed.
                  </p>
                  <select
                    value={handoverTarget}
                    onChange={(event) => setHandoverTarget(event.target.value)}
                    className="h-10 w-full rounded-lg border border-amber-300 bg-background px-2 text-xs font-semibold"
                    aria-label="Handover work to"
                  >
                    <option value="">Team Inbox (assign later)</option>
                    {data.members.filter((candidate) => candidate.id !== m.id).map((candidate) => (
                      <option key={candidate.user_id} value={candidate.user_id}>
                        {candidate.phone ? displayPhone(candidate.phone) : candidate.user_id.slice(0, 8)}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void removeMember(m.id)}
                      className="flex-1 rounded-lg bg-rose-600 px-3 py-2 text-[11px] font-extrabold text-white disabled:opacity-50"
                    >
                      {busy ? "Handing over…" : "Handover & remove"}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setOffboardingMemberId(null)}
                      className="rounded-lg border border-border px-3 py-2 text-[11px] font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
