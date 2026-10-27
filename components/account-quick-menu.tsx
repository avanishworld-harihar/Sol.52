"use client";

import { displayPhone } from "@/lib/auth/phone";
import { useAppSession } from "@/hooks/use-app-session";
import { CircleUserRound, LogIn, LogOut, MapPinned, Settings2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function AccountQuickMenu() {
  const router = useRouter();
  const { loading, session } = useAppSession();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  async function signOut() {
    setBusy(true);
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
      setOpen(false);
      router.replace("/login");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white/75 text-brand-800 shadow-sm transition hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-brand-200"
        aria-label="Account menu"
        aria-expanded={open}
      >
        <CircleUserRound className="h-4.5 w-4.5" />
      </button>

      {open ? (
        <div className="absolute right-0 top-11 z-[160] w-64 rounded-2xl border border-border bg-card p-3 text-left shadow-2xl">
          {loading ? (
            <p className="px-2 py-3 text-xs font-semibold text-muted-foreground">Checking account…</p>
          ) : session?.signedIn ? (
            <>
              <p className="truncate px-2 text-sm font-extrabold text-foreground">
                {session.organizationName || "Your company"}
              </p>
              <p className="mt-1 px-2 text-xs font-medium text-muted-foreground">
                {session.phone ? displayPhone(session.phone) : "Signed in"} · {session.gates.orgRole === "company_admin" ? "Admin" : "Employee"}
                {session.workRole ? ` · ${session.workRole.replace(/_/g, " ")}` : ""}
              </p>
              <p className="mt-2 rounded-lg bg-emerald-50 px-2 py-1.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
                Securely signed in for up to 30 days on this device.
              </p>
              <div className="mt-3 grid gap-1">
                <Link
                  href="/field-work"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-2 py-2 text-xs font-bold hover:bg-muted"
                >
                  <MapPinned className="h-4 w-4" /> Field Work
                </Link>
                <Link
                  href="/more#account"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-2 py-2 text-xs font-bold hover:bg-muted"
                >
                  <Settings2 className="h-4 w-4" /> Account & team
                </Link>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void signOut()}
                  className="flex items-center gap-2 rounded-lg px-2 py-2 text-left text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50 dark:text-rose-300 dark:hover:bg-rose-950/30"
                >
                  <LogOut className="h-4 w-4" /> {busy ? "Signing out…" : "Sign out"}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="px-2 text-sm font-extrabold">Sign in to Sol.52</p>
              <p className="mt-1 px-2 text-xs text-muted-foreground">One OTP keeps this device signed in for 30 days.</p>
              <Link href="/login" className="ss-cta-primary mt-3 flex items-center justify-center gap-2 px-3 py-2 text-xs">
                <LogIn className="h-4 w-4" /> Sign in
              </Link>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
