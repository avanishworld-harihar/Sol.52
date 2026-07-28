"use client";

import { displayPhone } from "@/lib/auth/phone";
import { LogIn, LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type SessionData = {
  signedIn: boolean;
  phone?: string;
  organizationName?: string | null;
  orgRole?: string;
};

export function AccountSessionCard() {
  const [data, setData] = useState<SessionData | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const res = await fetch("/api/auth/session", { cache: "no-store" });
      const payload = (await res.json()) as { ok?: boolean; data?: SessionData };
      if (payload.data) setData(payload.data);
      else setData({ signedIn: false });
    } catch {
      setData({ signedIn: false });
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function signOut() {
    setBusy(true);
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
      setData({ signedIn: false });
    } finally {
      setBusy(false);
    }
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card/60 p-4 text-xs font-semibold text-muted-foreground">
        Checking account…
      </div>
    );
  }

  if (!data.signedIn) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
        <div className="flex items-start gap-3">
          <UserRound className="mt-0.5 h-5 w-5 text-brand-700 dark:text-brand-300" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold text-foreground">Account</p>
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              Sign in with OTP to bind this device to your company.
            </p>
            <Link href="/login" className="ss-cta-primary mt-3 inline-flex items-center gap-2 px-3 py-2 text-xs">
              <LogIn className="h-3.5 w-3.5" />
              Sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
      <div className="flex items-start gap-3">
        <UserRound className="mt-0.5 h-5 w-5 text-brand-700 dark:text-brand-300" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-foreground">
            {data.organizationName || "Your company"}
          </p>
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            {data.phone ? displayPhone(data.phone) : "Signed in"}
            {data.orgRole ? ` · ${data.orgRole === "company_admin" ? "Admin" : "Employee"}` : ""}
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void signOut()}
            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-bold text-foreground hover:bg-muted/60"
          >
            <LogOut className="h-3.5 w-3.5" />
            {busy ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </div>
    </div>
  );
}
