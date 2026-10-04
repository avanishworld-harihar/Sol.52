import type { CustomerLead } from "@/lib/types";

export const CUSTOMERS_SWR_KEY = "/api/customers";

export type CustomerPagePayload = {
  data: CustomerLead[];
  pagination: {
    nextCursor: string | null;
    hasMore: boolean;
    total: number | null;
  };
};

export type CustomerBulkAction =
  | { action: "status"; leadIds: string[]; status: string }
  | {
      action: "callback";
      leadIds: string[];
      dueAt: string;
      title: string;
      notes?: string | null;
      priority?: "low" | "medium" | "high" | "urgent";
    };

export type CustomerBulkResult = {
  succeeded: number;
  failed: number;
  results: Array<{ leadId: string; ok: boolean; error?: string }>;
};

export async function runCustomerBulkAction(payload: CustomerBulkAction): Promise<CustomerBulkResult> {
  const response = await fetch("/api/customers/bulk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = (await response.json()) as {
    ok?: boolean;
    partial?: boolean;
    data?: CustomerBulkResult;
    error?: string;
  };
  if (!response.ok || (!json.ok && !json.partial) || !json.data) {
    throw new Error(json.error || "Bulk action failed.");
  }
  return json.data;
}

const STORAGE_KEY = "ss_v1_customers_list";
const SAVED_AT_KEY = "ss_v1_customers_saved_at";

/** Call after a successful network mutation (e.g. POST lead) so offline age reflects reality. */
export function touchCustomersSavedAt() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SAVED_AT_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export function getCustomersCacheAgeMs(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SAVED_AT_KEY);
    if (!raw) return null;
    const saved = Number(raw);
    if (!Number.isFinite(saved)) return null;
    return Date.now() - saved;
  } catch {
    return null;
  }
}

export function readCustomersCache(): CustomerLead[] | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return undefined;
    return parsed as CustomerLead[];
  } catch {
    return undefined;
  }
}

export function writeCustomersCache(list: CustomerLead[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

/**
 * Loads customers from the API when online; on failure or offline, returns the last list
 * from localStorage (including an empty list if that was the last known state).
 */
export async function fetchCustomers(path: string): Promise<CustomerLead[]> {
  const cached = readCustomersCache();

  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    if (cached !== undefined) return cached;
    throw new Error("No saved customer list yet. Open Customers online once to cache leads.");
  }

  try {
    const response = await fetch(path, { method: "GET" });
    const payload = (await response.json()) as { ok?: boolean; data?: CustomerLead[] };
    if (!response.ok || !payload.ok || !Array.isArray(payload.data)) {
      throw new Error("Bad response");
    }
    writeCustomersCache(payload.data);
    touchCustomersSavedAt();
    return payload.data;
  } catch {
    if (cached !== undefined) return cached;
    throw new Error("No saved customer list yet. Open Customers online once to cache leads.");
  }
}

/** Fetch one lightweight CRM page; SWR Infinite keeps prior pages on screen. */
export async function fetchCustomerPage(path: string): Promise<CustomerPagePayload> {
  try {
    const response = await fetch(path, { method: "GET", cache: "no-store" });
    const payload = (await response.json()) as {
      ok?: boolean;
      data?: CustomerLead[];
      pagination?: CustomerPagePayload["pagination"];
      error?: string;
    };
    if (!response.ok || !payload.ok || !Array.isArray(payload.data) || !payload.pagination) {
      throw new Error(payload.error || "Could not load customers");
    }
    return { data: payload.data, pagination: payload.pagination };
  } catch (error) {
    const cached = readCustomersCache();
    if (!cached) throw error;
    const url = new URL(path, "http://local");
    const offset = Math.max(0, Number(url.searchParams.get("cursor") ?? 0) || 0);
    const limit = Math.max(1, Number(url.searchParams.get("limit") ?? 40) || 40);
    const data = cached.slice(offset, offset + limit);
    const nextOffset = offset + data.length;
    return {
      data,
      pagination: {
        nextCursor: nextOffset < cached.length ? String(nextOffset) : null,
        hasMore: nextOffset < cached.length,
        total: cached.length,
      },
    };
  }
}

/**
 * Same data as `fetchCustomers` but never throws — for Proposal and other screens
 * that must tolerate offline/API errors while sharing the `/api/customers` SWR key
 * with the Customers page (cache shape must stay `CustomerLead[]`).
 */
export async function fetchCustomersLoose(path: string): Promise<CustomerLead[]> {
  try {
    return await fetchCustomers(path);
  } catch {
    return readCustomersCache() ?? [];
  }
}
