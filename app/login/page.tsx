"use client";

import { AppShell } from "@/components/app-shell";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

type Step = "phone" | "otp";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/customers";

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [devHint, setDevHint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendOtp(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setDevHint(null);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const payload = (await res.json()) as {
        ok?: boolean;
        error?: string;
        data?: { devCode?: string; message?: string };
      };
      if (!res.ok || !payload.ok) throw new Error(payload.error ?? "Could not send OTP");
      if (payload.data?.devCode) {
        setDevHint(`Dev OTP: ${payload.data.devCode}`);
        setCode(payload.data.devCode);
      } else if (payload.data?.message) {
        setDevHint(payload.data.message);
      }
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send OTP");
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim(),
          code: code.trim(),
          companyName: companyName.trim() || null,
        }),
      });
      const payload = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !payload.ok) throw new Error(payload.error ?? "Login failed");
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell title="Sign in">
      <div className="mx-auto w-full max-w-md ss-page-backdrop">
        <div className="ss-card p-5">
          <h2 className="ss-section-headline text-lg">Sol.52 login</h2>
          <p className="ss-section-subline text-sm">
            Enter your mobile number. We will send a one-time code. No password.
          </p>

          {error ? (
            <div className="mt-3 rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
              {error}
            </div>
          ) : null}
          {devHint ? (
            <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs font-semibold text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
              {devHint}
            </div>
          ) : null}

          {step === "phone" ? (
            <form className="mt-4 space-y-3" onSubmit={sendOtp}>
              <FloatingLabelInput
                label="Mobile number"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoFocus
                required
              />
              <FloatingLabelInput
                label="Company name (new accounts only)"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
              <button type="submit" disabled={busy || phone.trim().length < 8} className="ss-cta-primary w-full">
                {busy ? "Sending…" : "Send OTP"}
              </button>
            </form>
          ) : (
            <form className="mt-4 space-y-3" onSubmit={verifyOtp}>
              <p className="text-xs font-semibold text-muted-foreground">Code sent to {phone}</p>
              <FloatingLabelInput
                label="6-digit OTP"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoFocus
                required
              />
              <button type="submit" disabled={busy || code.trim().length < 4} className="ss-cta-primary w-full">
                {busy ? "Verifying…" : "Verify & continue"}
              </button>
              <button
                type="button"
                className="w-full text-xs font-bold text-brand-700 underline dark:text-brand-300"
                disabled={busy}
                onClick={() => {
                  setStep("phone");
                  setCode("");
                  setError(null);
                  setDevHint(null);
                }}
              >
                Change number
              </button>
            </form>
          )}

          <p className="mt-4 text-[11px] font-medium text-muted-foreground">
            Platform super-admin? Use{" "}
            <a href="/admin/login" className="font-bold text-brand-700 underline dark:text-brand-300">
              Admin login
            </a>
            .
          </p>
        </div>
      </div>
    </AppShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AppShell title="Sign in">
          <p className="p-4 text-sm font-semibold text-muted-foreground">Loading…</p>
        </AppShell>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
