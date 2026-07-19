import type { RoofPolygon, SiteObstruction } from "@/lib/site-layout";
import type { RoofMetrics } from "./geometry";

export type SiteLayoutEditorState = {
  roof: RoofPolygon | null;
  metrics: RoofMetrics | null;
  obstructions: SiteObstruction[];
  selectedObstructionId: string | null;
  dirty: boolean;
};

export type SiteLayoutAction =
  | { type: "LOAD_LAYOUT"; roof: RoofPolygon | null; metrics: RoofMetrics | null; obstructions: SiteObstruction[] }
  | { type: "COMMIT_POLYGON"; roof: RoofPolygon; metrics: RoofMetrics }
  | { type: "DELETE_POLYGON" }
  | { type: "PLACE_OBSTRUCTION"; obstruction: SiteObstruction }
  | { type: "UPDATE_OBSTRUCTION"; obstruction: SiteObstruction }
  | { type: "DELETE_OBSTRUCTION"; id: string }
  | { type: "SELECT_OBSTRUCTION"; id: string | null }
  | { type: "MARK_SAVED" };

export const EMPTY_SITE_LAYOUT_STATE: SiteLayoutEditorState = {
  roof: null,
  metrics: null,
  obstructions: [],
  selectedObstructionId: null,
  dirty: false,
};

export function siteLayoutReducer(
  state: SiteLayoutEditorState,
  action: SiteLayoutAction
): SiteLayoutEditorState {
  switch (action.type) {
    case "LOAD_LAYOUT":
      return {
        roof: action.roof,
        metrics: action.metrics,
        obstructions: action.obstructions,
        selectedObstructionId: null,
        dirty: false,
      };
    case "COMMIT_POLYGON":
      return { ...state, roof: action.roof, metrics: action.metrics, dirty: true };
    case "DELETE_POLYGON":
      return { ...state, roof: null, metrics: null, dirty: true };
    case "PLACE_OBSTRUCTION":
      return {
        ...state,
        obstructions: [...state.obstructions, action.obstruction],
        selectedObstructionId: action.obstruction.id,
        dirty: true,
      };
    case "UPDATE_OBSTRUCTION":
      return {
        ...state,
        obstructions: state.obstructions.map((item) =>
          item.id === action.obstruction.id ? action.obstruction : item
        ),
        dirty: true,
      };
    case "DELETE_OBSTRUCTION":
      return {
        ...state,
        obstructions: state.obstructions.filter((item) => item.id !== action.id),
        selectedObstructionId:
          state.selectedObstructionId === action.id ? null : state.selectedObstructionId,
        dirty: true,
      };
    case "SELECT_OBSTRUCTION":
      return { ...state, selectedObstructionId: action.id };
    case "MARK_SAVED":
      return { ...state, dirty: false };
    default:
      return state;
  }
}
