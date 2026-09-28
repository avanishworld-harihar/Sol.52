export const DASHBOARD_SECTION_IDS = [
  "agenda",
  "priorities",
  "attention",
  "insights",
  "projects",
  "quick-actions",
] as const;

const LEGACY_DASHBOARD_SECTION_ORDER: DashboardSectionId[] = [
  "priorities",
  "agenda",
  "attention",
  "insights",
  "projects",
  "quick-actions",
];

export type DashboardSectionId = (typeof DASHBOARD_SECTION_IDS)[number];
export type DashboardDensity = "comfortable" | "compact";

export type DashboardLayoutPreferences = {
  order: DashboardSectionId[];
  hidden: DashboardSectionId[];
  density: DashboardDensity;
};

export const DASHBOARD_LAYOUT_STORAGE_KEY = "sol52.dashboard.layout.v1";

export const DEFAULT_DASHBOARD_LAYOUT: DashboardLayoutPreferences = {
  order: [...DASHBOARD_SECTION_IDS],
  hidden: [],
  density: "comfortable",
};

export const DASHBOARD_SECTION_LABELS: Record<DashboardSectionId, string> = {
  priorities: "Today’s priorities",
  agenda: "Agenda",
  attention: "Needs attention",
  insights: "Operational insights",
  projects: "Project activity",
  "quick-actions": "Quick actions",
};

function isSectionId(value: unknown): value is DashboardSectionId {
  return typeof value === "string" && (DASHBOARD_SECTION_IDS as readonly string[]).includes(value);
}

export function normalizeDashboardLayout(value: unknown): DashboardLayoutPreferences {
  if (!value || typeof value !== "object") return DEFAULT_DASHBOARD_LAYOUT;
  const raw = value as Partial<DashboardLayoutPreferences>;
  const parsedOrder = Array.isArray(raw.order) ? raw.order.filter(isSectionId) : [];
  const savedOrder = parsedOrder.join("|") === LEGACY_DASHBOARD_SECTION_ORDER.join("|")
    ? [...DASHBOARD_SECTION_IDS]
    : parsedOrder;
  const order = [
    ...savedOrder.filter((id, index) => savedOrder.indexOf(id) === index),
    ...DASHBOARD_SECTION_IDS.filter((id) => !savedOrder.includes(id)),
  ];
  const hidden = Array.isArray(raw.hidden)
    ? raw.hidden.filter(isSectionId).filter((id, index, list) => list.indexOf(id) === index)
    : [];
  return {
    order,
    hidden,
    density: raw.density === "compact" ? "compact" : "comfortable",
  };
}

export function readDashboardLayout(): DashboardLayoutPreferences {
  if (typeof window === "undefined") return DEFAULT_DASHBOARD_LAYOUT;
  try {
    const raw = localStorage.getItem(DASHBOARD_LAYOUT_STORAGE_KEY);
    return raw ? normalizeDashboardLayout(JSON.parse(raw)) : DEFAULT_DASHBOARD_LAYOUT;
  } catch {
    return DEFAULT_DASHBOARD_LAYOUT;
  }
}

export function writeDashboardLayout(preferences: DashboardLayoutPreferences): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DASHBOARD_LAYOUT_STORAGE_KEY, JSON.stringify(normalizeDashboardLayout(preferences)));
  } catch {
    /* Storage may be unavailable in private mode. The in-memory preference still works. */
  }
}
