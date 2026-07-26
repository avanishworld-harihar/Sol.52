/** Pixelmator-style Design Studio inspector modes (right panel context). */

export const DESIGN_STUDIO_INSPECTOR_MODES = [
  "locate",
  "roof",
  "panels",
  "shadow",
  "eng",
  "layers",
  "labels",
] as const;

export type DesignStudioInspectorMode = (typeof DESIGN_STUDIO_INSPECTOR_MODES)[number];

export const DESIGN_STUDIO_INSPECTOR_MODE_LABELS: Record<DesignStudioInspectorMode, string> = {
  locate: "Locate",
  roof: "Roof",
  panels: "Panels",
  shadow: "Shadow",
  eng: "Eng",
  layers: "Layers",
  labels: "Labels",
};

/** Left-tool → preferred inspector mode. */
export function inspectorModeForStudioTool(
  tool: "select" | "place_panel" | "move_group" | null,
  opts?: { drawingRoof?: boolean; pendingObstruction?: boolean; placingLabel?: boolean }
): DesignStudioInspectorMode | null {
  if (opts?.placingLabel) return "labels";
  if (opts?.drawingRoof) return "roof";
  if (opts?.pendingObstruction) return "roof";
  if (tool === "place_panel" || tool === "move_group") return "panels";
  return null;
}
