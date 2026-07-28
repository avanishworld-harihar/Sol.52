"use client";

import { displayPhone } from "@/lib/auth/phone";
import { FloatingLabelInput, FloatingLabelSelect } from "@/components/ui/floating-label-input";
import { useToast } from "@/components/ui/toast-center";
import { Users, UserPlus, X } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";

type Member = {
  id: string;
  user_id: string;
  role: string;
  phone?: string | null;
  created_at: string;
};

type Invite = {
  id: string;
  phone_e164: string;
  role: string;
  created_at: string;
  expires_at: string | null;
};

type TeamData = {
  canManage: boolean;
  memberCount: number;
  pendingCount: number;
  maxUsers: number;
  teamEnabled: boolean;
  canAddMore: boolean;
  planCode: string | null;
  members: Member[];
  invites: Invite[];
};

export function TeamManagementCard() {
  const toast = useToast();
  const [data, setData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"employee" | "company_admin">("employee");
  const [busy, setBusy] = useState(false);

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
        body: JSON.stringify({ phone: phone.trim(), role }),
      });
      const payload = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !payload.ok) throw new Error(payload.error ?? "Invite failed");
      toast.success("Invite sent", "Employee can sign in with OTP on that phone.");
      setPhone("");
      setRole("employee");
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
        body: JSON.stringify({ memberId }),
      });
      const payload = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !payload.ok) throw new Error(payload.error ?? "Remove failed");
      toast.success("Member removed", "They no longer have access to this company.");
      await load();
    } catch (err) {
      toast.error("Remove failed", err instanceof Error ? err.message : "Could not remove");
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
          {data.pendingCount ? ` (+${data.pendingCount} pending)` : ""} / {data.maxUsers}
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
        {data.pendingCount ? ` + ${data.pendingCount} pending` : ""} / {data.maxUsers} seats
        {!data.teamEnabled ? " · Upgrade to Pro/Business for team invites" : null}
      </div>

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
                <p className="text-muted-foreground">{inv.role === "company_admin" ? "Admin" : "Employee"}</p>
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
              className="flex items-center justify-between gap-2 rounded-xl border border-border/60 px-3 py-2 text-xs"
            >
              <div className="min-w-0">
                <p className="font-bold">{m.phone ? displayPhone(m.phone) : m.user_id.slice(0, 8)}</p>
                <p className="text-muted-foreground">{m.role === "company_admin" ? "Admin" : "Employee"}</p>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => void removeMember(m.id)}
                className="rounded-lg border border-border px-2 py-1 text-[10px] font-bold hover:bg-muted/60"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
