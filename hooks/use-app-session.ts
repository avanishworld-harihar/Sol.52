"use client";

import { useCallback, useEffect, useState } from "react";

export type AppSessionGates = {
  canManageTeam: boolean;
  canManageBilling: boolean;
  canEditRateCard: boolean;
  canSeeAllCustomers: boolean;
  orgRole: "company_admin" | "employee" | null;
};

export type AppSessionState = {
  signedIn: boolean;
  phone?: string;
  organizationName?: string | null;
  orgRole?: string;
  gates: AppSessionGates;
};

const defaultGates: AppSessionGates = {
  canManageTeam: false,
  canManageBilling: false,
  canEditRateCard: false,
  canSeeAllCustomers: true,
  orgRole: null,
};

export function useAppSession(): {
  loading: boolean;
  session: AppSessionState | null;
  reload: () => Promise<void>;
} {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<AppSessionState | null>(null);

  const reload = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session", { cache: "no-store" });
      const payload = (await res.json()) as {
        ok?: boolean;
        data?: AppSessionState & { gates?: AppSessionGates };
      };
      if (payload.data) {
        setSession({
          ...payload.data,
          gates: payload.data.gates ?? defaultGates,
        });
      } else {
        setSession({ signedIn: false, gates: defaultGates });
      }
    } catch {
      setSession({ signedIn: false, gates: defaultGates });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { loading, session, reload };
}
