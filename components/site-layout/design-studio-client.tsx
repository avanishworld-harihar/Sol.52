"use client";

import {
  ArrowLeft,
  Cloud,
  Compass,
  Crosshair,
  Focus,
  Grid2X2,
  ImagePlus,
  LocateFixed,
  Lock,
  Magnet,
  Map as MapIcon,
  MapPin,
  Minus,
  MousePointer2,
  Plus,
  Redo2,
  Copy,
  RotateCcw,
  RotateCw,
  Save,
  Search,
  Square,
  SquareStack,
  Trash2,
  TriangleRight,
  Undo2,
  Unlock,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-center";
import {
  extractGpsFromImageFile,
  parseLatLngText,
  parseSeparateLatLng,
} from "@/lib/site-layout-gps";
import { loadGoogleMaps } from "@/lib/google-maps-loader";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { multiPolygon, point, polygon } from "@turf/helpers";
import {
  DEFAULT_PANEL_MODULE,
  PANEL_MODULE_CATALOG,
  mergePanelModuleCatalog,
  panelModuleBrands,
  panelModuleLabel,
  panelModulesForBrand,
  parseCapacityKwText,
  readCustomPanelModules,
  resolvePanelSpecFromProject,
} from "@/lib/panel-module-catalog";
import { recommendedTiltFromLatitude } from "@/lib/proposal-site-geo";
import {
  adviseRoofAzimuth,
  estimateDesignAnnualYield,
  moduleLengthForOrientationM,
  recommendedRowPitchM,
} from "@/lib/design-studio-engineering";
import type {
  PanelMountingType,
  PanelOrientation,
  PanelSpec,
  PlacedPanel,
  ProjectPanelLayout,
} from "@/lib/panel-layout";
import {
  calculateRoofMetrics,
  normalizeRoofGeometry,
  normalizeRoofPolygon,
  polygonsToRoofGeometry,
  roofGeometryToPolygons,
} from "./core/geometry";
import {
  autoPackPanels,
  computePanelCoverageMetrics,
  createManualPanelAt,
  effectiveObstructionRadiusFt,
  estimateMaxDcCapacity,
  footprintCentroid,
  MIN_OBSTRUCTION_RADIUS_FT,
  rotatePlacedPanels,
  snapPanelMove,
  snapNewPanelFootprint,
  translateFootprint,
  type PanelPackMode,
} from "./core/panel-placement";
import {
  EMPTY_SITE_LAYOUT_STATE,
  siteLayoutReducer,
} from "./core/state";
import {
  clearSiteLayoutDraft,
  readSiteLayoutDraft,
  writeSiteLayoutDraft,
} from "@/lib/site-layout-draft";
import type {
  ProjectSiteLayout,
  RoofGeometry,
  RoofPolygon,
  SiteObstruction,
} from "@/lib/site-layout";

type ApiEnvelope<T> = { ok: boolean; data?: T; error?: string };

type ProjectSummary = {
  id: string;
  official_name: string | null;
  lead_name: string | null;
  site_lat: number | null;
  site_lng: number | null;
  roof_type: string | null;
  capacity_kw: string | null;
  panel_brand: string | null;
};

type SurveySummary = {
  id: string;
  gps_lat: number | null;
  gps_lng: number | null;
  roof_type: string | null;
  proposed_capacity_kw: number | null;
};

type DesignSummary = {
  panel_watt: number | null;
  system_kw: number | null;
  panel_brand?: string | null;
};

type ObstructionType = SiteObstruction["type"];
type StudioTool = "select" | "place_panel" | "move_group";
/** null = no mode tool selected (idle). */
type StudioToolOrIdle = StudioTool | null;

const DEFAULT_CENTER: [number, number] = [78.9629, 20.5937];
/**
 * Google satellite for India often stops sharpening ~20–21 even if maxZoom is higher.
 * Optical CSS magnify starts at MAP_OPTICAL_FROM so rooftops can go much closer.
 */
const MAP_MAX_ZOOM = 22;
const MAP_OPTICAL_FROM = 19.5;
/** Roof always under panels (paint + hit-test). */
const ROOF_Z_INDEX = 0;
const PANEL_Z_INDEX = 6;
const PANEL_Z_INDEX_SELECTED = 8;
/** Optical magnify past useful satellite zoom — dense MP / India rooftops. */
const MAP_EXTRA_SCALE_MAX = 8;
const MAP_EXTRA_SCALE_STEP = 0.5;
const PANEL_HISTORY_LIMIT = 40;

const OBSTRUCTION_LABELS: Record<ObstructionType, string> = {
  water_tank: "Water tank",
  tree: "Tree",
  chimney: "Chimney",
  parapet: "Parapet",
  other: "Other",
};

/** Sensible default footprint radius so shading circles appear immediately. */
const DEFAULT_OBSTRUCTION_RADIUS_FT: Record<ObstructionType, number> = {
  water_tank: 4,
  tree: 10,
  chimney: 2,
  parapet: 1.5,
  other: 2,
};

const FT_TO_M = 0.3048;
/** Click within this many screen pixels of the first corner closes the polygon. */
const SNAP_CLOSE_PX = 14;

/** Interior cell lines for a rectangular panel ring (4 corners). */
function panelCellLinePaths(
  ring: Array<{ lat: number; lng: number }>,
  cellCols = 4,
  cellRows = 6
): Array<Array<{ lat: number; lng: number }>> {
  if (ring.length < 4) return [];
  const a = ring[0]!;
  const b = ring[1]!;
  const c = ring[2]!;
  const d = ring[3]!;
  const lerp = (
    p: { lat: number; lng: number },
    q: { lat: number; lng: number },
    t: number
  ) => ({
    lat: p.lat + (q.lat - p.lat) * t,
    lng: p.lng + (q.lng - p.lng) * t,
  });
  const lines: Array<Array<{ lat: number; lng: number }>> = [];
  for (let i = 1; i < cellCols; i += 1) {
    const t = i / cellCols;
    lines.push([lerp(a, b, t), lerp(d, c, t)]);
  }
  for (let i = 1; i < cellRows; i += 1) {
    const t = i / cellRows;
    lines.push([lerp(a, d, t), lerp(b, c, t)]);
  }
  return lines;
}

const ROOF_TYPES = [
  { value: "", label: "Select roof type" },
  { value: "rcc", label: "Flat RCC" },
  { value: "terrace", label: "Sloped RCC / terrace" },
  { value: "metal", label: "Metal shed" },
  { value: "tin", label: "Tin shed" },
  { value: "asbestos", label: "Asbestos" },
  { value: "ground", label: "Ground mount" },
  { value: "other", label: "Other" },
];

function newObstruction(
  type: ObstructionType,
  lng: number,
  lat: number
): SiteObstruction {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `obs-${Date.now()}`,
    type,
    lng,
    lat,
    height_ft: 0,
    radius_ft: DEFAULT_OBSTRUCTION_RADIUS_FT[type],
    label: null,
  };
}

export function DesignStudioClient({ projectId }: { projectId: string }) {
  const toast = useToast();
  const mapRef = useRef<google.maps.Map | null>(null);
  const roofPolygonRef = useRef<google.maps.Polygon | null>(null);
  const roofPolygonsRef = useRef<google.maps.Polygon[]>([]);
  const draftPolygonRef = useRef<google.maps.Polygon | null>(null);
  const draftLineRef = useRef<google.maps.Polyline | null>(null);
  const draftMarkersRef = useRef<google.maps.Marker[]>([]);
  /** Small custom corner handles — replaces huge Google editable vertices. */
  const roofEditMarkersRef = useRef<google.maps.Marker[]>([]);
  const refreshRoofEditMarkersRef = useRef<() => void>(() => {});
  const markersRef = useRef<google.maps.Marker[]>([]);
  const circlesRef = useRef<google.maps.Circle[]>([]);
  const panelPolygonsRef = useRef<google.maps.Polygon[]>([]);
  const panelCellLinesRef = useRef<google.maps.Polyline[]>([]);
  const panelListenersRef = useRef<google.maps.MapsEventListener[]>([]);
  /** Latest finish handler for map gestures (snap/double-click/right-click). */
  const finishDrawingRef = useRef<(() => void) | null>(null);
  /** Latest corner-delete handler for draft corner markers. */
  const draftCornerDeleteRef = useRef<((index: number) => void) | null>(null);
  const mapListenersRef = useRef<google.maps.MapsEventListener[]>([]);
  const roofListenersRef = useRef<google.maps.MapsEventListener[]>([]);
  const drawingPointsRef = useRef<google.maps.LatLngLiteral[]>([]);
  const drawingRedoRef = useRef<google.maps.LatLngLiteral[]>([]);
  const addObstructionRef = useRef<ObstructionType | null>(null);
  const initialRoofRef = useRef<RoofGeometry | null>(null);
  const initialCenterRef = useRef<[number, number]>(DEFAULT_CENTER);
  const currentRoofRef = useRef<RoofGeometry | null>(null);
  const undoStackRef = useRef<Array<RoofGeometry | null>>([]);
  const redoStackRef = useRef<Array<RoofGeometry | null>>([]);
  const panelUndoStackRef = useRef<PlacedPanel[][]>([]);
  const panelRedoStackRef = useRef<PlacedPanel[][]>([]);
  const placedPanelsRef = useRef<PlacedPanel[]>([]);
  const draggingPanelIdRef = useRef<string | null>(null);
  const groupDragStartRef = useRef<{
    primaryId: string;
    startCentroid: { lng: number; lat: number };
    footprints: Record<string, PlacedPanel["footprint_geojson"]>;
  } | null>(null);
  const selectedPanelIdsRef = useRef<string[]>([]);
  const snapEnabledRef = useRef(true);
  const panelSpecRef = useRef(DEFAULT_PANEL_MODULE);
  const panelOrientationRef = useRef<Exclude<PanelOrientation, "east_west">>("portrait");
  const studioToolRef = useRef<StudioToolOrIdle>("select");
  const placePanelRef = useRef<((latLng: google.maps.LatLng) => void) | null>(null);
  const undoStudioRef = useRef<(() => void) | null>(null);
  const redoStudioRef = useRef<(() => void) | null>(null);
  const deleteSelectedPanelRef = useRef<(() => void) | null>(null);
  const clearStudioToolRef = useRef<(() => void) | null>(null);
  const setActiveStudioToolRef = useRef<((tool: StudioTool) => void) | null>(null);
  const activeRoofIndexRef = useRef(0);
  const drawingModeRef = useRef<"add" | "replace">("add");
  const applyingHistoryRef = useRef(false);
  const roofLockedRef = useRef(true);
  /** Shared click handler so clicks on the roof polygon also place obstructions / add points. */
  const studioClickRef = useRef<((latLng: google.maps.LatLng) => void) | null>(null);
  /** Projection helper for optical-magnify click remapping (CSS scale breaks Maps hit-test). */
  const projectionOverlayRef = useRef<google.maps.OverlayView | null>(null);
  const mapViewportElRef = useRef<HTMLElement | null>(null);
  const opticalPointerRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    moved: boolean;
    panelDrag: {
      primaryId: string;
      startLatLng: { lat: number; lng: number };
      footprints: Record<string, PlacedPanel["footprint_geojson"]>;
      ids: string[];
    } | null;
  } | null>(null);
  /** Set when the map panel mounts — avoids init racing the loading spinner unmount. */
  const [mapContainerEl, setMapContainerEl] = useState<HTMLDivElement | null>(null);

  const [state, dispatch] = useReducer(siteLayoutReducer, EMPTY_SITE_LAYOUT_STATE);
  const [project, setProject] = useState<ProjectSummary | null>(null);
  const [survey, setSurvey] = useState<SurveySummary | null>(null);
  const [currentLayout, setCurrentLayout] = useState<ProjectSiteLayout | null>(null);
  const [roofType, setRoofType] = useState("");
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [searchText, setSearchText] = useState("");
  const [searching, setSearching] = useState(false);
  const [pendingObstruction, setPendingObstruction] = useState<ObstructionType | null>(null);
  const [latInput, setLatInput] = useState("");
  const [lngInput, setLngInput] = useState("");
  const [gpsPaste, setGpsPaste] = useState("");
  const [gpsBusy, setGpsBusy] = useState(false);
  const [drawingRoof, setDrawingRoof] = useState(false);
  const [drawingPointCount, setDrawingPointCount] = useState(0);
  const [drawingMetrics, setDrawingMetrics] = useState<ReturnType<typeof calculateRoofMetrics> | null>(null);
  const [roofLocked, setRoofLocked] = useState(true);
  const [activeRoofIndex, setActiveRoofIndex] = useState(0);
  const [historyVersion, setHistoryVersion] = useState(0);
  const [studioTool, setStudioTool] = useState<StudioToolOrIdle>("select");
  const [mapTypeId, setMapTypeId] = useState<"hybrid" | "satellite" | "roadmap">("hybrid");
  const [mapHeading, setMapHeading] = useState(0);
  const [panelSpec, setPanelSpec] = useState<PanelSpec>(DEFAULT_PANEL_MODULE);
  const [panelOrientation, setPanelOrientation] = useState<Exclude<PanelOrientation, "east_west">>("portrait");
  const [panelSetbackFt, setPanelSetbackFt] = useState(1.5);
  const [panelTiltDeg, setPanelTiltDeg] = useState(() =>
    recommendedTiltFromLatitude(DEFAULT_CENTER[1])
  );
  /** When false, tilt follows site latitude as the map center moves. */
  const [tiltManual, setTiltManual] = useState(false);
  const [mountingType, setMountingType] = useState<PanelMountingType>("flush");
  const [placedPanels, setPlacedPanels] = useState<PlacedPanel[]>([]);
  const [selectedPanelIds, setSelectedPanelIds] = useState<string[]>([]);
  const [snapEnabled, setSnapEnabled] = useState(true);
  /** Optical zoom beyond Google tile max (1 = off). */
  const [mapExtraScale, setMapExtraScale] = useState(1);
  const mapExtraScaleRef = useRef(1);
  const zoomByRef = useRef<(delta: number) => void>(() => {});
  const [mapViewportEl, setMapViewportEl] = useState<HTMLElement | null>(null);
  const [moduleCatalog, setModuleCatalog] = useState<PanelSpec[]>(PANEL_MODULE_CATALOG);
  const [panelMetrics, setPanelMetrics] = useState({
    remainingAreaSqft: 0,
    coveragePct: 0,
  });
  const [panelDirty, setPanelDirty] = useState(false);
  const [packing, setPacking] = useState(false);
  const [currentPanelLayout, setCurrentPanelLayout] = useState<ProjectPanelLayout | null>(null);
  const [packMode, setPackMode] = useState<PanelPackMode>("target_kw");
  const [targetKw, setTargetKw] = useState<number>(5);
  const [maxCapacity, setMaxCapacity] = useState({ maxPanelCount: 0, maxDcCapacityKw: 0 });
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const googleMapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "";

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [projectRes, surveyRes, layoutRes, panelRes, designsRes, catalogRes] =
          await Promise.all([
            fetch(`/api/projects/${projectId}`, { cache: "no-store" }),
            fetch(`/api/projects/${projectId}/survey`, { cache: "no-store" }),
            fetch(`/api/projects/${projectId}/site-layout`, { cache: "no-store" }),
            fetch(`/api/projects/${projectId}/panel-layout`, { cache: "no-store" }),
            fetch(`/api/projects/${projectId}/designs`, { cache: "no-store" }),
            fetch("/api/design-panel-catalog", { cache: "no-store" }),
          ]);
        const projectJson = (await projectRes.json()) as ApiEnvelope<ProjectSummary>;
        const surveyJson = (await surveyRes.json()) as ApiEnvelope<SurveySummary | null>;
        const layoutJson = (await layoutRes.json()) as ApiEnvelope<ProjectSiteLayout | null>;
        const panelJson = (await panelRes.json()) as ApiEnvelope<ProjectPanelLayout | null>;
        const designsJson = (await designsRes.json()) as ApiEnvelope<DesignSummary[]>;
        const catalogJson = (await catalogRes.json()) as ApiEnvelope<{
          orgModules?: PanelSpec[];
        }>;
        if (cancelled) return;
        if (!projectJson.ok || !projectJson.data) {
          throw new Error(projectJson.error || "Project could not be loaded.");
        }

        const loadedCatalog = mergePanelModuleCatalog(
          catalogJson.ok && Array.isArray(catalogJson.data?.orgModules)
            ? catalogJson.data.orgModules
            : [],
          readCustomPanelModules()
        );
        setModuleCatalog(loadedCatalog);

        setProject(projectJson.data);
        const surveyData = surveyJson.ok ? surveyJson.data ?? null : null;
        setSurvey(surveyData);
        setRoofType(surveyData?.roof_type || projectJson.data.roof_type || "");

        const latestDesign =
          designsJson.ok && Array.isArray(designsJson.data) ? designsJson.data[0] ?? null : null;

        const seededTarget =
          parseCapacityKwText(projectJson.data.capacity_kw) ??
          (surveyData?.proposed_capacity_kw != null && surveyData.proposed_capacity_kw > 0
            ? surveyData.proposed_capacity_kw
            : null) ??
          (latestDesign?.system_kw != null && latestDesign.system_kw > 0
            ? latestDesign.system_kw
            : null) ??
          5;
        setTargetKw(seededTarget);
        setPackMode("target_kw");

        const layout = layoutJson.ok ? layoutJson.data ?? null : null;
        setCurrentLayout(layout);
        let roof = layout ? normalizeRoofGeometry(layout.roof_geojson) : null;
        let obstructions = Array.isArray(layout?.obstructions_geojson)
          ? layout.obstructions_geojson
          : [];

        const draft = await readSiteLayoutDraft(projectId);
        if (!layout && draft?.roof) {
          roof = draft.roof;
          obstructions = draft.obstructions;
          setRoofType(draft.roof_type || surveyData?.roof_type || projectJson.data.roof_type || "");
        }

        obstructions = obstructions.map((item) => ({
          ...item,
          radius_ft: effectiveObstructionRadiusFt(item),
        }));

        const savedPanel = panelJson.ok ? panelJson.data ?? null : null;
        setCurrentPanelLayout(savedPanel);
        if (savedPanel) {
          setPanelSpec(savedPanel.panel_spec);
          setPanelOrientation(
            savedPanel.orientation === "landscape" ? "landscape" : "portrait"
          );
          setPanelSetbackFt(savedPanel.setback_ft);
          setMountingType(savedPanel.mounting_type ?? "flush");
          setPlacedPanels(savedPanel.panels_geojson);
          setPanelMetrics({
            remainingAreaSqft: savedPanel.remaining_area_sqft,
            coveragePct: savedPanel.coverage_pct,
          });
          setPanelDirty(false);
          const placedKw =
            (savedPanel.panels_geojson.length * savedPanel.panel_spec.wattage) / 1000;
          if (placedKw > 0) setTargetKw(Number(placedKw.toFixed(2)));
        } else if (draft?.panels?.length) {
          if (draft.panel_spec) setPanelSpec(draft.panel_spec);
          if (draft.panel_orientation === "landscape" || draft.panel_orientation === "portrait") {
            setPanelOrientation(draft.panel_orientation);
          }
          if (typeof draft.panel_setback_ft === "number") setPanelSetbackFt(draft.panel_setback_ft);
          if (
            draft.mounting_type === "flush" ||
            draft.mounting_type === "elevated" ||
            draft.mounting_type === "ground_mount"
          ) {
            setMountingType(draft.mounting_type);
          }
          setPlacedPanels(draft.panels);
          setPanelMetrics({
            remainingAreaSqft: draft.panel_remaining_area_sqft ?? 0,
            coveragePct: draft.panel_coverage_pct ?? 0,
          });
          setPanelDirty(true);
        } else {
          setPanelSpec(
            resolvePanelSpecFromProject({
              panelWatt: latestDesign?.panel_watt,
              panelBrand: projectJson.data.panel_brand ?? latestDesign?.panel_brand,
              catalog: loadedCatalog,
            })
          );
        }

        const nextCenter: [number, number] = [
          layout?.center_lng ??
            draft?.center_lng ??
            surveyData?.gps_lng ??
            projectJson.data.site_lng ??
            DEFAULT_CENTER[0],
          layout?.center_lat ??
            draft?.center_lat ??
            surveyData?.gps_lat ??
            projectJson.data.site_lat ??
            DEFAULT_CENTER[1],
        ];
        setCenter(nextCenter);
        initialCenterRef.current = nextCenter;

        const suggestedTilt = recommendedTiltFromLatitude(nextCenter[1]);
        if (savedPanel && savedPanel.tilt_deg > 0) {
          setPanelTiltDeg(savedPanel.tilt_deg);
          setTiltManual(true);
        } else if (
          !savedPanel &&
          typeof draft?.panel_tilt_deg === "number" &&
          draft.panel_tilt_deg > 0
        ) {
          setPanelTiltDeg(draft.panel_tilt_deg);
          setTiltManual(true);
        } else {
          setPanelTiltDeg(suggestedTilt);
          setTiltManual(false);
        }

        initialRoofRef.current = roof;
        currentRoofRef.current = roof;
        activeRoofIndexRef.current = 0;
        setActiveRoofIndex(0);
        undoStackRef.current = [];
        redoStackRef.current = [];
        setHistoryVersion((value) => value + 1);
        dispatch({
          type: "LOAD_LAYOUT",
          roof,
          metrics: roof ? calculateRoofMetrics(roof) : null,
          obstructions,
        });
        if (!layoutJson.ok && layoutJson.error) setLoadError(layoutJson.error);
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Design Studio could not load.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  useEffect(() => {
    if (tiltManual) return;
    setPanelTiltDeg(recommendedTiltFromLatitude(center[1]));
  }, [center, tiltManual]);

  const removeRoofListeners = useCallback(() => {
    roofListenersRef.current.forEach((listener) => listener.remove());
    roofListenersRef.current = [];
  }, []);

  const clearDraftOverlay = useCallback(() => {
    draftPolygonRef.current?.setMap(null);
    draftPolygonRef.current = null;
    draftLineRef.current?.setMap(null);
    draftLineRef.current = null;
    draftMarkersRef.current.forEach((marker) => marker.setMap(null));
    draftMarkersRef.current = [];
  }, []);

  const clearRoofEditMarkers = useCallback(() => {
    roofEditMarkersRef.current.forEach((marker) => marker.setMap(null));
    roofEditMarkersRef.current = [];
  }, []);

  /** Compact draggable corners (native Polygon editable handles are oversized). */
  const refreshRoofEditMarkers = useCallback(() => {
    clearRoofEditMarkers();
    const map = mapRef.current;
    if (!map || !window.google?.maps) return;
    if (roofLockedRef.current) return;

    const sectionIndex = activeRoofIndexRef.current;
    const polygon = roofPolygonsRef.current[sectionIndex];
    if (!polygon) return;

    const path = polygon.getPath();
    for (let i = 0; i < path.getLength(); i++) {
      const vertexIndex = i;
      const marker = new google.maps.Marker({
        map,
        position: path.getAt(i),
        draggable: true,
        zIndex: PANEL_Z_INDEX + 2,
        cursor: "grab",
        title: "Drag corner · right-click to remove",
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 2.5,
          fillColor: "#ffffff",
          fillOpacity: 0.9,
          strokeColor: "#0f766e",
          strokeOpacity: 0.95,
          strokeWeight: 1.5,
        },
      });
      marker.addListener("drag", () => {
        const pos = marker.getPosition();
        if (pos) path.setAt(vertexIndex, pos);
      });
      marker.addListener("dragend", () => {
        window.setTimeout(() => refreshRoofEditMarkersRef.current(), 0);
      });
      const removeCorner = () => {
        if (path.getLength() <= 3) return;
        path.removeAt(vertexIndex);
        window.setTimeout(() => refreshRoofEditMarkersRef.current(), 0);
      };
      marker.addListener("rightclick", removeCorner);
      marker.addListener("contextmenu", removeCorner);
      roofEditMarkersRef.current.push(marker);
    }
  }, [clearRoofEditMarkers]);

  refreshRoofEditMarkersRef.current = refreshRoofEditMarkers;

  const renderDraftOverlay = useCallback(() => {
    const map = mapRef.current;
    if (!map || !window.google?.maps) return;
    const points = drawingPointsRef.current;
    if (points.length === 0) {
      clearDraftOverlay();
      return;
    }

    if (draftPolygonRef.current) {
      draftPolygonRef.current.setPath(points);
    } else {
      draftPolygonRef.current = new google.maps.Polygon({
        map,
        paths: points,
        clickable: false,
        strokeOpacity: 0,
        fillColor: "#f97316",
        fillOpacity: 0.18,
        zIndex: 2,
      });
    }

    const dashSymbol: google.maps.Symbol = {
      path: "M 0,-1 0,1",
      strokeOpacity: 0.75,
      strokeColor: "#f43f5e",
      strokeWeight: 1.25,
      scale: 2.2,
    };
    const linePath = points.length >= 3 ? [...points, points[0]] : points;
    if (draftLineRef.current) {
      draftLineRef.current.setPath(linePath);
      draftLineRef.current.setOptions({
        icons: [{ icon: dashSymbol, offset: "0", repeat: "8px" }],
      });
    } else {
      draftLineRef.current = new google.maps.Polyline({
        map,
        path: linePath,
        clickable: false,
        strokeOpacity: 0,
        icons: [{ icon: dashSymbol, offset: "0", repeat: "8px" }],
        zIndex: 3,
      });
    }

    draftMarkersRef.current.forEach((marker) => marker.setMap(null));
    draftMarkersRef.current = points.map((point, index) => {
      const marker = new google.maps.Marker({
        map,
        position: point,
        zIndex: 4,
        title:
          index === 0 && points.length >= 3
            ? "Click here to close the roof · right-click to remove"
            : "Right-click to remove this corner",
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: index === 0 ? 2.6 : 2,
          fillColor: index === 0 ? "#f43f5e" : "#ffffff",
          fillOpacity: index === 0 ? 0.85 : 0.75,
          strokeColor: "#f43f5e",
          strokeOpacity: 0.9,
          strokeWeight: 1.25,
        },
      });
      marker.addListener("click", () => {
        // Clicking the first corner closes the polygon; other corners just forward the click.
        if (index === 0 && drawingPointsRef.current.length >= 3) {
          finishDrawingRef.current?.();
        }
      });
      marker.addListener("contextmenu", () => {
        draftCornerDeleteRef.current?.(index);
      });
      return marker;
    });
  }, [clearDraftOverlay]);

  const commitRoof = useCallback((roof: RoofGeometry | null, recordHistory = true) => {
    const previous = currentRoofRef.current;
    if (JSON.stringify(previous) === JSON.stringify(roof)) return;

    if (recordHistory && !applyingHistoryRef.current) {
      undoStackRef.current.push(previous ? structuredClone(previous) : null);
      if (undoStackRef.current.length > 50) undoStackRef.current.shift();
      redoStackRef.current = [];
    }

    currentRoofRef.current = roof ? structuredClone(roof) : null;
    if (roof) {
      dispatch({ type: "COMMIT_POLYGON", roof, metrics: calculateRoofMetrics(roof) });
    } else {
      dispatch({ type: "DELETE_POLYGON" });
    }
    setHistoryVersion((value) => value + 1);
  }, []);

  const selectRoofSection = useCallback((index: number) => {
    const polygons = roofPolygonsRef.current;
    if (index < 0 || index >= polygons.length) return;
    activeRoofIndexRef.current = index;
    setActiveRoofIndex(index);
    roofPolygonRef.current = polygons[index];
    polygons.forEach((polygon, polygonIndex) => {
      const selected = polygonIndex === index;
      const locked = roofLockedRef.current;
      polygon.setOptions({
        clickable: !locked,
        // Native editable handles are oversized — use custom corner markers.
        editable: false,
        strokeColor: selected ? "#0f766e" : "#0369a1",
        strokeWeight: selected ? 2.5 : 2,
        fillColor: selected ? "#14b8a6" : "#38bdf8",
        fillOpacity: selected ? 0.18 : 0.1,
        zIndex: ROOF_Z_INDEX,
      });
    });
    refreshRoofEditMarkers();
  }, [refreshRoofEditMarkers]);

  const syncRoofPolygon = useCallback(
    (polygon: google.maps.Polygon, sectionIndex: number) => {
      const points = polygon
        .getPath()
        .getArray()
        .map((point) => [point.lng(), point.lat()]);
      if (points.length < 3) return;
      points.push([...points[0]]);
      const section = normalizeRoofPolygon({ type: "Polygon", coordinates: [points] });
      if (!section || !currentRoofRef.current) return;
      const sections = roofGeometryToPolygons(currentRoofRef.current);
      if (!sections[sectionIndex]) return;
      sections[sectionIndex] = section;
      commitRoof(polygonsToRoofGeometry(sections));
    },
    [commitRoof]
  );

  const attachRoofListeners = useCallback(
    (polygon: google.maps.Polygon, sectionIndex: number) => {
      const path = polygon.getPath();
      roofListenersRef.current.push(
        google.maps.event.addListener(path, "set_at", () => syncRoofPolygon(polygon, sectionIndex)),
        google.maps.event.addListener(path, "insert_at", () => syncRoofPolygon(polygon, sectionIndex)),
        google.maps.event.addListener(path, "remove_at", () => syncRoofPolygon(polygon, sectionIndex)),
        google.maps.event.addListener(polygon, "click", (event: google.maps.PolyMouseEvent) => {
          selectRoofSection(sectionIndex);
          if (event.latLng) studioClickRef.current?.(event.latLng);
        }),
        google.maps.event.addListener(polygon, "contextmenu", (event: google.maps.PolyMouseEvent) => {
          selectRoofSection(sectionIndex);
          if (event.vertex == null) return;
          const path = polygon.getPath();
          if (path.getLength() <= 3) return;
          path.removeAt(event.vertex);
        })
      );
    },
    [selectRoofSection, syncRoofPolygon]
  );

  const renderRoofGeometry = useCallback(
    (roof: RoofGeometry | null) => {
      const map = mapRef.current;
      if (!map || !window.google?.maps) return;
      removeRoofListeners();
      clearRoofEditMarkers();
      roofPolygonsRef.current.forEach((polygon) => polygon.setMap(null));
      roofPolygonsRef.current = [];
      roofPolygonRef.current = null;
      if (!roof) return;

      const sections = roofGeometryToPolygons(roof);
      const selectedIndex = Math.min(activeRoofIndexRef.current, sections.length - 1);
      activeRoofIndexRef.current = selectedIndex;
      setActiveRoofIndex(selectedIndex);
      roofPolygonsRef.current = sections.map((section, index) => {
        const selected = index === selectedIndex;
        const path = section.coordinates[0]
          .slice(0, -1)
          .map(([lng, lat]) => ({ lat, lng }));
        const locked = roofLockedRef.current;
        const polygon = new google.maps.Polygon({
          map,
          paths: path,
          clickable: !locked,
          editable: false,
          draggable: false,
          strokeColor: selected ? "#0f766e" : "#0369a1",
          strokeOpacity: 1,
          strokeWeight: selected ? 2.5 : 2,
          fillColor: selected ? "#14b8a6" : "#38bdf8",
          fillOpacity: selected ? 0.18 : 0.1,
          zIndex: ROOF_Z_INDEX,
        });
        attachRoofListeners(polygon, index);
        return polygon;
      });
      roofPolygonRef.current = roofPolygonsRef.current[selectedIndex] ?? null;
      refreshRoofEditMarkers();
    },
    [attachRoofListeners, clearRoofEditMarkers, refreshRoofEditMarkers, removeRoofListeners]
  );

  useEffect(() => {
    if (!mapContainerEl || !googleMapsKey || mapRef.current) return;

    let cancelled = false;
    void loadGoogleMaps(googleMapsKey)
      .then((maps) => {
        if (cancelled) return;
        const initialCenter = {
          lat: initialCenterRef.current[1],
          lng: initialCenterRef.current[0],
        };
        const map = new maps.Map(mapContainerEl, {
          center: initialCenter,
          zoom: initialCenterRef.current[0] === DEFAULT_CENTER[0] ? 5 : 21,
          mapTypeId: maps.MapTypeId.HYBRID,
          tilt: 0,
          heading: 0,
          minZoom: 3,
          maxZoom: MAP_MAX_ZOOM,
          isFractionalZoomEnabled: true,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          scaleControl: true,
          rotateControl: true,
          rotateControlOptions: {
            position: maps.ControlPosition.RIGHT_TOP,
          },
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: maps.MapTypeControlStyle.DROPDOWN_MENU,
            position: maps.ControlPosition.TOP_CENTER,
            mapTypeIds: [
              maps.MapTypeId.ROADMAP,
              maps.MapTypeId.HYBRID,
              maps.MapTypeId.SATELLITE,
              maps.MapTypeId.TERRAIN,
            ],
          },
          gestureHandling: "greedy",
          scrollwheel: true,
          clickableIcons: false,
        });
        mapRef.current = map;
        // Keep API max high even when satellite imagery tiles stop earlier (pixelated but usable).
        map.setOptions({ maxZoom: MAP_MAX_ZOOM, minZoom: 3, isFractionalZoomEnabled: true });
        map.addListener("maptypeid_changed", () => {
          map.setOptions({ maxZoom: MAP_MAX_ZOOM, minZoom: 3, isFractionalZoomEnabled: true });
        });

        studioClickRef.current = (latLng: google.maps.LatLng) => {
          const type = addObstructionRef.current;
          if (type) {
            dispatch({
              type: "PLACE_OBSTRUCTION",
              obstruction: newObstruction(type, latLng.lng(), latLng.lat()),
            });
            addObstructionRef.current = null;
            setPendingObstruction(null);
            return;
          }
          if (studioToolRef.current === "place_panel") {
            placePanelRef.current?.(latLng);
            return;
          }
          const isDrawing = map.get("sol52DrawingRoof") === true;
          if (!isDrawing) {
            // Select / Move: click empty map (outside panels) clears selection.
            const tool = studioToolRef.current;
            if (
              (tool === "select" || tool === "move_group" || tool == null) &&
              selectedPanelIdsRef.current.length > 0
            ) {
              setSelectedPanelIds([]);
            }
            return;
          }
          const points = drawingPointsRef.current;
          if (points.length >= 3) {
            const first = points[0];
            const zoom = map.getZoom() ?? 20;
            const metersPerPixel =
              (156543.03392 * Math.cos((first.lat * Math.PI) / 180)) / 2 ** zoom;
            const dx =
              (latLng.lng() - first.lng) * 111_320 * Math.cos((first.lat * Math.PI) / 180);
            const dy = (latLng.lat() - first.lat) * 110_540;
            if (Math.hypot(dx, dy) <= metersPerPixel * SNAP_CLOSE_PX) {
              finishDrawingRef.current?.();
              return;
            }
          }
          drawingPointsRef.current = [
            ...drawingPointsRef.current,
            { lat: latLng.lat(), lng: latLng.lng() },
          ];
          drawingRedoRef.current = [];
          setDrawingPointCount(drawingPointsRef.current.length);
          const closedPoints = drawingPointsRef.current.map((point) => [point.lng, point.lat]);
          if (closedPoints.length >= 3) {
            closedPoints.push([...closedPoints[0]]);
            const draftRoof = normalizeRoofPolygon({
              type: "Polygon",
              coordinates: [closedPoints],
            });
            setDrawingMetrics(draftRoof ? calculateRoofMetrics(draftRoof) : null);
          } else {
            setDrawingMetrics(null);
          }
          renderDraftOverlay();
        };

        if (initialRoofRef.current) {
          const sections = roofGeometryToPolygons(initialRoofRef.current);
          renderRoofGeometry(initialRoofRef.current);
          const bounds = new maps.LatLngBounds();
          sections.forEach((section) => {
            section.coordinates[0]
              .slice(0, -1)
              .forEach(([lng, lat]) => bounds.extend({ lat, lng }));
          });
          map.fitBounds(bounds, 70);
        }

        mapListenersRef.current.push(
          map.addListener("click", (event: google.maps.MapMouseEvent) => {
            if (event.latLng) studioClickRef.current?.(event.latLng);
          }),
          map.addListener("dblclick", () => {
            if (map.get("sol52DrawingRoof") === true && drawingPointsRef.current.length >= 3) {
              finishDrawingRef.current?.();
            }
          }),
          map.addListener("contextmenu", () => {
            if (map.get("sol52DrawingRoof") === true && drawingPointsRef.current.length >= 3) {
              finishDrawingRef.current?.();
            }
          }),
          map.addListener("idle", () => {
            const next = map.getCenter();
            if (next) setCenter([next.lng(), next.lat()]);
            const heading = map.getHeading();
            if (typeof heading === "number") setMapHeading(heading);
            const typeId = map.getMapTypeId();
            if (typeId === "roadmap" || typeId === "hybrid" || typeId === "satellite") {
              setMapTypeId(typeId);
            }
          })
        );

        // OverlayView needs a real pane node or getProjection() stays null.
        const projectionOverlay = new maps.OverlayView();
        let projectionHost: HTMLDivElement | null = null;
        projectionOverlay.onAdd = function onAdd() {
          projectionHost = document.createElement("div");
          projectionHost.style.cssText = "position:absolute;width:0;height:0;left:0;top:0;";
          this.getPanes()?.overlayMouseTarget.appendChild(projectionHost);
        };
        projectionOverlay.draw = () => {};
        projectionOverlay.onRemove = () => {
          projectionHost?.remove();
          projectionHost = null;
        };
        projectionOverlay.setMap(map);
        projectionOverlayRef.current = projectionOverlay;

        setMapReady(true);
        setLoadError("");
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Google Maps failed to load. Check API key, billing, and enabled APIs."
          );
        }
      });

    return () => {
      cancelled = true;
      if (projectionOverlayRef.current) {
        projectionOverlayRef.current.setMap(null);
        projectionOverlayRef.current = null;
      }
      mapListenersRef.current.forEach((listener) => listener.remove());
      mapListenersRef.current = [];
      removeRoofListeners();
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
      circlesRef.current.forEach((circle) => circle.setMap(null));
      circlesRef.current = [];
      panelListenersRef.current.forEach((listener) => listener.remove());
      panelListenersRef.current = [];
      panelPolygonsRef.current.forEach((polygon) => polygon.setMap(null));
      panelPolygonsRef.current = [];
      panelCellLinesRef.current.forEach((line) => line.setMap(null));
      panelCellLinesRef.current = [];
      roofPolygonsRef.current.forEach((polygon) => polygon.setMap(null));
      roofPolygonsRef.current = [];
      roofPolygonRef.current = null;
      clearDraftOverlay();
      studioClickRef.current = null;
      mapRef.current = null;
      setMapReady(false);
    };
  }, [googleMapsKey, mapContainerEl, removeRoofListeners, renderRoofGeometry, renderDraftOverlay, clearDraftOverlay]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !window.google?.maps) return;
    markersRef.current.forEach((marker) => marker.setMap(null));
    circlesRef.current.forEach((circle) => circle.setMap(null));
    circlesRef.current = [];
    markersRef.current = state.obstructions.map((obstruction) => {
      const radiusFt = effectiveObstructionRadiusFt(obstruction);
      if (radiusFt > 0) {
        circlesRef.current.push(
          new google.maps.Circle({
            map: mapRef.current!,
            center: { lat: obstruction.lat, lng: obstruction.lng },
            radius: radiusFt * FT_TO_M,
            clickable: false,
            strokeColor: "#d97706",
            strokeOpacity: 0.9,
            strokeWeight: 1,
            fillColor: "#f59e0b",
            fillOpacity: 0.16,
            zIndex: 5,
          })
        );
      }
      const isSelected = obstruction.id === state.selectedObstructionId;
      const marker = new google.maps.Marker({
        map: mapRef.current!,
        position: { lat: obstruction.lat, lng: obstruction.lng },
        title: `${OBSTRUCTION_LABELS[obstruction.type]} · ${obstruction.height_ft} ft · drag to move`,
        draggable: true,
        cursor: "move",
        zIndex: isSelected ? 20 : 10,
        label: {
          text: obstruction.type === "tree" ? "TR" : obstruction.type === "water_tank" ? "WT" : "OB",
          color: "#ffffff",
          fontSize: "10px",
          fontWeight: "700",
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: isSelected ? "#b45309" : "#d97706",
          fillOpacity: 1,
          strokeColor: isSelected ? "#fbbf24" : "#ffffff",
          strokeWeight: isSelected ? 2 : 1,
          scale: 13,
        },
      });
      marker.addListener("click", () => {
        dispatch({ type: "SELECT_OBSTRUCTION", id: obstruction.id });
      });
      marker.addListener("dragstart", () => {
        dispatch({ type: "SELECT_OBSTRUCTION", id: obstruction.id });
      });
      marker.addListener("dragend", (event: google.maps.MapMouseEvent) => {
        if (!event.latLng) return;
        dispatch({
          type: "UPDATE_OBSTRUCTION",
          obstruction: { ...obstruction, lat: event.latLng.lat(), lng: event.latLng.lng() },
        });
      });
      return marker;
    });
  }, [mapReady, state.obstructions, state.selectedObstructionId]);

  useEffect(() => {
    placedPanelsRef.current = placedPanels;
  }, [placedPanels]);

  useEffect(() => {
    selectedPanelIdsRef.current = selectedPanelIds;
  }, [selectedPanelIds]);

  useEffect(() => {
    snapEnabledRef.current = snapEnabled;
  }, [snapEnabled]);

  useEffect(() => {
    panelSpecRef.current = panelSpec;
  }, [panelSpec]);

  useEffect(() => {
    panelOrientationRef.current = panelOrientation;
  }, [panelOrientation]);

  useEffect(() => {
    studioToolRef.current = studioTool;
  }, [studioTool]);

  const pushPanelHistory = useCallback((snapshot: PlacedPanel[]) => {
    panelUndoStackRef.current.push(structuredClone(snapshot));
    if (panelUndoStackRef.current.length > PANEL_HISTORY_LIMIT) {
      panelUndoStackRef.current.shift();
    }
    panelRedoStackRef.current = [];
    setHistoryVersion((value) => value + 1);
  }, []);

  const applyPanelSnapshot = useCallback(
    (panels: PlacedPanel[]) => {
      setPlacedPanels(panels);
      setSelectedPanelIds([]);
      setPanelDirty(true);
      if (state.roof) {
        setPanelMetrics(computePanelCoverageMetrics(state.roof, panels));
      } else {
        setPanelMetrics({ remainingAreaSqft: 0, coveragePct: 0 });
      }
    },
    [state.roof]
  );

  const undoPanels = useCallback(() => {
    const previous = panelUndoStackRef.current.pop();
    if (previous === undefined) return;
    panelRedoStackRef.current.push(structuredClone(placedPanelsRef.current));
    applyPanelSnapshot(previous);
    setHistoryVersion((value) => value + 1);
  }, [applyPanelSnapshot]);

  const redoPanels = useCallback(() => {
    const next = panelRedoStackRef.current.pop();
    if (next === undefined) return;
    panelUndoStackRef.current.push(structuredClone(placedPanelsRef.current));
    applyPanelSnapshot(next);
    setHistoryVersion((value) => value + 1);
  }, [applyPanelSnapshot]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !window.google?.maps) return;
    if (draggingPanelIdRef.current) return;
    panelListenersRef.current.forEach((listener) => listener.remove());
    panelListenersRef.current = [];
    panelPolygonsRef.current.forEach((polygon) => polygon.setMap(null));
    panelCellLinesRef.current.forEach((line) => line.setMap(null));
    panelCellLinesRef.current = [];
    const selectedSet = new Set(selectedPanelIds);
    panelPolygonsRef.current = placedPanels.map((panel, panelIndex) => {
      const selected = selectedSet.has(panel.id);
      const path = panel.footprint_geojson.coordinates[0]
        .slice(0, -1)
        .map(([lng, lat]) => ({ lat, lng }));
      const toolNow = studioToolRef.current;
      const canDrag =
        selected &&
        !panel.is_locked &&
        toolNow !== "place_panel" &&
        (toolNow === "select" || toolNow === "move_group" || toolNow == null);

      // Realistic PV look: dark glass face + thin aluminium frame.
      const fillColor = selected ? "#1e3a8a" : panel.is_locked ? "#1c1917" : "#0b1220";
      const strokeColor = selected ? "#93c5fd" : panel.is_locked ? "#fbbf24" : "#cbd5e1";
      const polygon = new google.maps.Polygon({
        map: mapRef.current!,
        paths: path,
        clickable: true,
        editable: false,
        draggable: canDrag,
        strokeColor,
        strokeOpacity: 0.95,
        strokeWeight: selected ? 2 : 1.25,
        fillColor,
        fillOpacity: selected ? 0.82 : 0.78,
        zIndex: selected ? PANEL_Z_INDEX_SELECTED : PANEL_Z_INDEX,
      });

      for (const linePath of panelCellLinePaths(path)) {
        panelCellLinesRef.current.push(
          new google.maps.Polyline({
            map: mapRef.current!,
            path: linePath,
            clickable: false,
            strokeColor: selected ? "#60a5fa" : "#334155",
            strokeOpacity: selected ? 0.55 : 0.4,
            strokeWeight: 0.7,
            zIndex: selected ? PANEL_Z_INDEX_SELECTED + 1 : PANEL_Z_INDEX + 1,
          })
        );
      }

      const pathFromFootprint = (footprint: PlacedPanel["footprint_geojson"]) =>
        footprint.coordinates[0].slice(0, -1).map(([lng, lat]) => ({ lat, lng }));

      panelListenersRef.current.push(
        google.maps.event.addListener(polygon, "click", (event: google.maps.MapMouseEvent) => {
          const shift = !!(event.domEvent as MouseEvent | undefined)?.shiftKey;
          const tool = studioToolRef.current;
          // Select / Move: click panel → select it. Shift+click toggles multi-select.
          if (shift) {
            setSelectedPanelIds((current) =>
              current.includes(panel.id)
                ? current.filter((id) => id !== panel.id)
                : [...current, panel.id]
            );
          } else {
            setSelectedPanelIds([panel.id]);
          }
          if (tool === "place_panel") {
            setStudioTool(null);
            studioToolRef.current = null;
          }
          // Keep map click from clearing this selection.
          event.stop?.();
          event.domEvent?.stopPropagation?.();
          event.domEvent?.preventDefault?.();
        }),
        google.maps.event.addListener(polygon, "dragstart", () => {
          // Cell lines stay put while the polygon drags — clear until dragend rebuild.
          panelCellLinesRef.current.forEach((line) => line.setMap(null));
          panelCellLinesRef.current = [];
          draggingPanelIdRef.current = panel.id;
          const ids =
            selectedPanelIdsRef.current.includes(panel.id) && selectedPanelIdsRef.current.length > 0
              ? selectedPanelIdsRef.current
              : [panel.id];
          if (!selectedPanelIdsRef.current.includes(panel.id)) {
            setSelectedPanelIds(ids);
          }
          const footprints: Record<string, PlacedPanel["footprint_geojson"]> = {};
          for (const item of placedPanelsRef.current) {
            if (ids.includes(item.id)) {
              footprints[item.id] = structuredClone(item.footprint_geojson);
            }
          }
          const startCentroid = footprintCentroid(panel.footprint_geojson);
          if (!startCentroid) {
            draggingPanelIdRef.current = null;
            return;
          }
          groupDragStartRef.current = {
            primaryId: panel.id,
            startCentroid,
            footprints,
          };
        }),
        google.maps.event.addListener(polygon, "drag", () => {
          const drag = groupDragStartRef.current;
          if (!drag || drag.primaryId !== panel.id) return;
          const ringPath = polygon.getPath();
          if (ringPath.getLength() < 3) return;
          let sumLng = 0;
          let sumLat = 0;
          for (let i = 0; i < ringPath.getLength(); i += 1) {
            const pt = ringPath.getAt(i);
            sumLng += pt.lng();
            sumLat += pt.lat();
          }
          const n = ringPath.getLength();
          const dLng = sumLng / n - drag.startCentroid.lng;
          const dLat = sumLat / n - drag.startCentroid.lat;
          placedPanelsRef.current.forEach((item, index) => {
            if (item.id === panel.id) return;
            if (!drag.footprints[item.id]) return;
            const poly = panelPolygonsRef.current[index];
            if (!poly) return;
            const translated = translateFootprint(drag.footprints[item.id]!, dLng, dLat);
            poly.setPaths(pathFromFootprint(translated));
          });
        }),
        google.maps.event.addListener(polygon, "dragend", () => {
          const drag = groupDragStartRef.current;
          const ringPath = polygon.getPath();
          const ring: number[][] = [];
          for (let i = 0; i < ringPath.getLength(); i += 1) {
            const point = ringPath.getAt(i);
            ring.push([point.lng(), point.lat()]);
          }
          if (ring.length >= 3 && drag) {
            ring.push([...ring[0]!]);
            const movedFootprint = { type: "Polygon" as const, coordinates: [ring] };
            const movingIds = Object.keys(drag.footprints);
            const primaryOriginal = placedPanelsRef.current.find((item) => item.id === panel.id);
            if (primaryOriginal) {
              let dLng: number;
              let dLat: number;
              if (snapEnabledRef.current) {
                const anchors = placedPanelsRef.current.filter(
                  (item) => !movingIds.includes(item.id)
                );
                const snapped = snapPanelMove({
                  moved: primaryOriginal,
                  movedFootprint,
                  anchors,
                  panelSpec: panelSpecRef.current,
                  orientation: panelOrientationRef.current,
                  panelGapMm: 20,
                });
                dLng = snapped.dLng;
                dLat = snapped.dLat;
              } else {
                const end = footprintCentroid(movedFootprint);
                dLng = end ? end.lng - drag.startCentroid.lng : 0;
                dLat = end ? end.lat - drag.startCentroid.lat : 0;
              }
              pushPanelHistory(placedPanelsRef.current);
              setPlacedPanels((current) =>
                current.map((item) => {
                  if (!movingIds.includes(item.id) || item.is_locked) return item;
                  const base = drag.footprints[item.id] ?? item.footprint_geojson;
                  return {
                    ...item,
                    footprint_geojson: translateFootprint(base, dLng, dLat),
                    is_manually_placed: true,
                  };
                })
              );
              setPanelDirty(true);
            }
          }
          groupDragStartRef.current = null;
          draggingPanelIdRef.current = null;
        })
      );
      return polygon;
    });
  }, [mapReady, placedPanels, pushPanelHistory, selectedPanelIds, studioTool]);

  useEffect(() => {
    if (!state.dirty && !panelDirty) return;
    const timer = window.setTimeout(() => {
      void writeSiteLayoutDraft(projectId, {
        roof: state.roof,
        obstructions: state.obstructions,
        center_lat: center[1],
        center_lng: center[0],
        roof_type: roofType || null,
        updated_at: new Date().toISOString(),
        panel_spec: panelSpec,
        panel_orientation: panelOrientation,
        panel_setback_ft: panelSetbackFt,
        panel_tilt_deg: panelTiltDeg,
        mounting_type: mountingType,
        panels: placedPanels,
        panel_remaining_area_sqft: panelMetrics.remainingAreaSqft,
        panel_coverage_pct: panelMetrics.coveragePct,
      });
    }, 600);
    return () => window.clearTimeout(timer);
  }, [
    center,
    panelDirty,
    panelMetrics.coveragePct,
    panelMetrics.remainingAreaSqft,
    panelOrientation,
    panelSetbackFt,
    panelTiltDeg,
    mountingType,
    panelSpec,
    placedPanels,
    projectId,
    roofType,
    state.dirty,
    state.obstructions,
    state.roof,
  ]);

  const selectedObstruction = useMemo(
    () => state.obstructions.find((item) => item.id === state.selectedObstructionId) ?? null,
    [state.obstructions, state.selectedObstructionId]
  );
  const roofSections = useMemo(
    () => (state.roof ? roofGeometryToPolygons(state.roof) : []),
    [state.roof]
  );
  const selectedRoofMetrics = useMemo(() => {
    const section = roofSections[activeRoofIndex];
    return section ? calculateRoofMetrics(section) : null;
  }, [activeRoofIndex, roofSections]);
  const displayedMetrics = drawingRoof ? drawingMetrics : state.metrics;

  const azimuthAdvice = useMemo(() => {
    const az = selectedRoofMetrics?.azimuthDeg ?? displayedMetrics?.azimuthDeg ?? null;
    if (az == null) return null;
    return adviseRoofAzimuth(az);
  }, [displayedMetrics?.azimuthDeg, selectedRoofMetrics?.azimuthDeg]);

  /** Yaw from auto layout (0°) after west/east rotate nudges. */
  const panelRotationSummary = useMemo(() => {
    const source =
      selectedPanelIds.length > 0
        ? placedPanels.filter((panel) => selectedPanelIds.includes(panel.id))
        : placedPanels;
    if (source.length === 0) return null;
    const vals = source.map((panel) => Math.round(panel.rotation_deg * 10) / 10);
    const first = vals[0]!;
    const uniform = vals.every((value) => Math.abs(value - first) < 0.05);
    const scope = selectedPanelIds.length > 0 ? ("selection" as const) : ("plant" as const);
    if (!uniform) {
      return {
        scope,
        deg: null as number | null,
        label: "Mixed",
        detail: "Selected panels have different yaw — select a matching group to rotate together.",
      };
    }
    const deg = first;
    const abs = Math.abs(deg);
    const dir = deg === 0 ? "" : deg < 0 ? " west" : " east";
    const label =
      deg === 0
        ? "0°"
        : `${deg > 0 ? "+" : ""}${Number.isInteger(deg) ? String(deg) : deg.toFixed(1)}°`;
    return {
      scope,
      deg,
      label,
      detail:
        abs === 0
          ? "No yaw from auto layout"
          : `${abs}°${dir} from auto layout (toolbar rotate ±5°)`,
    };
  }, [placedPanels, selectedPanelIds]);

  const rowPitchM = useMemo(() => {
    const lengthM = moduleLengthForOrientationM(
      panelSpec.width_mm,
      panelSpec.height_mm,
      panelOrientation
    );
    return recommendedRowPitchM({
      tiltDeg: panelTiltDeg,
      moduleLengthM: lengthM,
      latitudeDeg: center[1],
      mounting: mountingType,
    });
  }, [center, mountingType, panelOrientation, panelSpec.height_mm, panelSpec.width_mm, panelTiltDeg]);

  const dcKwLive = placedPanels.length
    ? (placedPanels.length * panelSpec.wattage) / 1000
    : 0;

  const yieldEstimate = useMemo(() => {
    if (dcKwLive <= 0) return null;
    return estimateDesignAnnualYield({
      dcKw: dcKwLive,
      tiltDeg: panelTiltDeg,
      latitudeDeg: center[1],
      roofAzimuthDeg: selectedRoofMetrics?.azimuthDeg ?? displayedMetrics?.azimuthDeg ?? null,
    });
  }, [
    center,
    dcKwLive,
    displayedMetrics?.azimuthDeg,
    panelTiltDeg,
    selectedRoofMetrics?.azimuthDeg,
  ]);

  const areaWarning = displayedMetrics
    ? displayedMetrics.areaSqft < 100
      ? "Roof area is very small — zoom in and check the corners."
      : displayedMetrics.areaSqft > 50_000
        ? "Roof area looks too large — verify the polygon corners."
        : null
    : null;
  const canUndo = drawingRoof
    ? drawingPointCount > 0
    : panelUndoStackRef.current.length > 0 || undoStackRef.current.length > 0;
  const canRedo = drawingRoof
    ? drawingRedoRef.current.length > 0
    : panelRedoStackRef.current.length > 0 || redoStackRef.current.length > 0;

  const beginRoofDrawing = useCallback((mode: "add" | "replace") => {
    if (!mapRef.current) return;
    drawingModeRef.current = mode;
    addObstructionRef.current = null;
    setPendingObstruction(null);
    setStudioTool("select");
    studioToolRef.current = "select";
    setSelectedPanelIds([]);
    roofPolygonsRef.current.forEach((polygon) => polygon.setEditable(false));
    clearDraftOverlay();
    drawingPointsRef.current = [];
    drawingRedoRef.current = [];
    setDrawingPointCount(0);
    setDrawingMetrics(null);
    setDrawingRoof(true);
    mapRef.current.set("sol52DrawingRoof", true);
    mapRef.current.setOptions({ draggableCursor: "crosshair", disableDoubleClickZoom: true });
  }, [clearDraftOverlay]);

  const cancelRoofDrawing = useCallback(() => {
    clearDraftOverlay();
    drawingPointsRef.current = [];
    drawingRedoRef.current = [];
    setDrawingPointCount(0);
    setDrawingMetrics(null);
    setDrawingRoof(false);
    selectRoofSection(activeRoofIndexRef.current);
    mapRef.current?.set("sol52DrawingRoof", false);
    mapRef.current?.setOptions({ draggableCursor: null, disableDoubleClickZoom: false });
  }, [clearDraftOverlay, selectRoofSection]);

  const beginObstruction = useCallback(
    (type: ObstructionType) => {
      if (drawingRoof) {
        cancelRoofDrawing();
      }
      // Toggle off if same obstruction tool is already armed.
      if (pendingObstruction === type || addObstructionRef.current === type) {
        addObstructionRef.current = null;
        setPendingObstruction(null);
        setStudioTool(null);
        studioToolRef.current = null;
        mapRef.current?.setOptions({ draggableCursor: null });
        return;
      }
      setStudioTool(null);
      studioToolRef.current = null;
      setSelectedPanelIds([]);
      addObstructionRef.current = type;
      setPendingObstruction(type);
      mapRef.current?.setOptions({ draggableCursor: "crosshair" });
      mapRef.current?.getDiv().focus();
    },
    [cancelRoofDrawing, drawingRoof, pendingObstruction]
  );

  const toggleRoofDrawing = useCallback(() => {
    if (drawingRoof) {
      cancelRoofDrawing();
      return;
    }
    beginRoofDrawing("add");
  }, [beginRoofDrawing, cancelRoofDrawing, drawingRoof]);

  const finishRoofDrawing = useCallback(() => {
    const map = mapRef.current;
    if (!map || !window.google?.maps) return;
    const points = drawingPointsRef.current;
    if (points.length < 3) {
      toast.error("Add more corners", "Click at least 3 roof corners before finishing.");
      return;
    }

    clearDraftOverlay();
    const coordinates = points.map((point) => [point.lng, point.lat]);
    coordinates.push([...coordinates[0]]);
    const section = normalizeRoofPolygon({ type: "Polygon", coordinates: [coordinates] });
    if (!section) return;

    const sections = currentRoofRef.current
      ? roofGeometryToPolygons(currentRoofRef.current)
      : [];
    if (drawingModeRef.current === "replace" && sections[activeRoofIndexRef.current]) {
      sections[activeRoofIndexRef.current] = section;
    } else {
      sections.push(section);
      activeRoofIndexRef.current = sections.length - 1;
      setActiveRoofIndex(sections.length - 1);
    }
    const roof = polygonsToRoofGeometry(sections);
    if (!roof) return;

    roofLockedRef.current = true;
    setRoofLocked(true);
    commitRoof(roof);
    renderRoofGeometry(roof);
    drawingPointsRef.current = [];
    drawingRedoRef.current = [];
    setDrawingPointCount(0);
    setDrawingMetrics(null);
    setDrawingRoof(false);
    map.set("sol52DrawingRoof", false);
    map.setOptions({ draggableCursor: null, disableDoubleClickZoom: false });
    toast.success("Roof completed", "Roof stays under panels — Select / Group move ready.");
  }, [clearDraftOverlay, commitRoof, renderRoofGeometry, toast]);

  const clearRoof = useCallback(() => {
    clearDraftOverlay();
    drawingPointsRef.current = [];
    drawingRedoRef.current = [];
    setDrawingPointCount(0);
    setDrawingMetrics(null);
    setDrawingRoof(false);
    mapRef.current?.set("sol52DrawingRoof", false);
    mapRef.current?.setOptions({ draggableCursor: null, disableDoubleClickZoom: false });
    const sections = currentRoofRef.current
      ? roofGeometryToPolygons(currentRoofRef.current)
      : [];
    sections.splice(activeRoofIndexRef.current, 1);
    const nextRoof = polygonsToRoofGeometry(sections);
    activeRoofIndexRef.current = Math.max(
      0,
      Math.min(activeRoofIndexRef.current, sections.length - 1)
    );
    setActiveRoofIndex(activeRoofIndexRef.current);
    commitRoof(nextRoof);
    renderRoofGeometry(nextRoof);
    if (!nextRoof && placedPanelsRef.current.length > 0) {
      setStudioTool("select");
      studioToolRef.current = "select";
      toast.info(
        "Roof removed",
        "Panels still on map — use Select or Group move. Redraw roof when ready."
      );
    }
  }, [clearDraftOverlay, commitRoof, renderRoofGeometry, toast]);

  const updateDraftAfterHistory = useCallback(() => {
    const points = drawingPointsRef.current;
    setDrawingPointCount(points.length);
    renderDraftOverlay();
    const coordinates = points.map((point) => [point.lng, point.lat]);
    if (coordinates.length < 3) {
      setDrawingMetrics(null);
      return;
    }
    coordinates.push([...coordinates[0]]);
    const roof = normalizeRoofPolygon({ type: "Polygon", coordinates: [coordinates] });
    setDrawingMetrics(roof ? calculateRoofMetrics(roof) : null);
  }, [renderDraftOverlay]);

  const undoRoof = useCallback(() => {
    if (drawingRoof) {
      const point = drawingPointsRef.current.pop();
      if (!point) return;
      drawingRedoRef.current.push(point);
      updateDraftAfterHistory();
      return;
    }
    const previous = undoStackRef.current.pop();
    if (previous === undefined) return;
    redoStackRef.current.push(
      currentRoofRef.current ? structuredClone(currentRoofRef.current) : null
    );
    applyingHistoryRef.current = true;
    commitRoof(previous ? structuredClone(previous) : null, false);
    renderRoofGeometry(previous);
    applyingHistoryRef.current = false;
    setHistoryVersion((value) => value + 1);
  }, [commitRoof, drawingRoof, renderRoofGeometry, updateDraftAfterHistory]);

  const redoRoof = useCallback(() => {
    if (drawingRoof) {
      const point = drawingRedoRef.current.pop();
      if (!point) return;
      drawingPointsRef.current.push(point);
      updateDraftAfterHistory();
      return;
    }
    const next = redoStackRef.current.pop();
    if (next === undefined) return;
    undoStackRef.current.push(
      currentRoofRef.current ? structuredClone(currentRoofRef.current) : null
    );
    applyingHistoryRef.current = true;
    commitRoof(next ? structuredClone(next) : null, false);
    renderRoofGeometry(next);
    applyingHistoryRef.current = false;
    setHistoryVersion((value) => value + 1);
  }, [commitRoof, drawingRoof, renderRoofGeometry, updateDraftAfterHistory]);

  useEffect(() => {
    finishDrawingRef.current = finishRoofDrawing;
  }, [finishRoofDrawing]);

  useEffect(() => {
    draftCornerDeleteRef.current = (index: number) => {
      if (mapRef.current?.get("sol52DrawingRoof") !== true) return;
      if (index < 0 || index >= drawingPointsRef.current.length) return;
      drawingPointsRef.current.splice(index, 1);
      drawingRedoRef.current = [];
      updateDraftAfterHistory();
    };
  }, [updateDraftAfterHistory]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (event.key === "Enter" && drawingRoof) {
        event.preventDefault();
        finishRoofDrawing();
        return;
      }
      if (event.key === "Escape") {
        if (drawingRoof) {
          event.preventDefault();
          cancelRoofDrawing();
        } else if (pendingObstruction) {
          event.preventDefault();
          addObstructionRef.current = null;
          setPendingObstruction(null);
          mapRef.current?.setOptions({ draggableCursor: null });
        } else if (
          studioToolRef.current === "place_panel" ||
          studioToolRef.current === "move_group" ||
          studioToolRef.current === "select"
        ) {
          event.preventDefault();
          clearStudioToolRef.current?.();
        }
        return;
      }
      // V = Select tool (Photoshop-style)
      if (!event.ctrlKey && !event.metaKey && !event.altKey && event.key.toLowerCase() === "v") {
        event.preventDefault();
        setActiveStudioToolRef.current?.("select");
        return;
      }
      if (
        (event.key === "Delete" || event.key === "Backspace") &&
        selectedPanelIdsRef.current.length > 0 &&
        !drawingRoof
      ) {
        event.preventDefault();
        deleteSelectedPanelRef.current?.();
        return;
      }
      const isModifier = event.ctrlKey || event.metaKey;
      if (isModifier && event.key.toLowerCase() === "a" && !drawingRoof) {
        event.preventDefault();
        if (!roofLockedRef.current && roofPolygonsRef.current.length > 0) {
          roofLockedRef.current = true;
          setRoofLocked(true);
          roofPolygonsRef.current.forEach((polygon) =>
            polygon.setOptions({
              clickable: false,
              editable: false,
              zIndex: ROOF_Z_INDEX,
            })
          );
        }
        const unlocked = placedPanelsRef.current
          .filter((panel) => !panel.is_locked)
          .map((panel) => panel.id);
        setSelectedPanelIds(unlocked);
        setStudioTool("move_group");
        studioToolRef.current = "move_group";
        return;
      }
      if (isModifier && !event.shiftKey && event.key.toLowerCase() === "z") {
        event.preventDefault();
        undoStudioRef.current?.();
        return;
      }
      if (
        isModifier &&
        (event.key.toLowerCase() === "y" ||
          (event.shiftKey && event.key.toLowerCase() === "z"))
      ) {
        event.preventDefault();
        redoStudioRef.current?.();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [cancelRoofDrawing, drawingRoof, finishRoofDrawing, pendingObstruction]);

  const toggleRoofLock = useCallback(() => {
    if (!roofPolygonRef.current) return;
    const nextLocked = !roofLockedRef.current;
    roofLockedRef.current = nextLocked;
    setRoofLocked(nextLocked);
    if (nextLocked) {
      clearRoofEditMarkers();
      roofPolygonsRef.current.forEach((polygon) =>
        polygon.setOptions({
          clickable: false,
          editable: false,
          zIndex: ROOF_Z_INDEX,
        })
      );
    } else {
      setStudioTool(null);
      studioToolRef.current = null;
      setSelectedPanelIds([]);
      selectRoofSection(activeRoofIndexRef.current);
    }
    toast.success(
      nextLocked ? "Roof locked (under panels)" : "Roof unlocked",
      nextLocked
        ? "Panels are on top — Select / Group move work normally."
        : "Drag the small corner dots to refine the roof. Lock again before moving panels."
    );
  }, [clearRoofEditMarkers, selectRoofSection, toast]);

  const locateMe = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Location unavailable", "This browser does not provide GPS.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const next: [number, number] = [coords.longitude, coords.latitude];
        setCenter(next);
        setMapExtraScale(1);
        mapRef.current?.panTo({ lat: coords.latitude, lng: coords.longitude });
        mapRef.current?.setZoom(20);
      },
      (error) => toast.error("GPS failed", error.message),
      { enableHighAccuracy: true, timeout: 15_000 }
    );
  }, [toast]);

  /** Zoom out ke baad roof / panels pe wapas — toolbar “Find design”. */
  const focusOnDesign = useCallback(() => {
    const map = mapRef.current;
    if (!map || !window.google?.maps) {
      toast.error("Map not ready", "Wait for the map to load, then try again.");
      return;
    }
    setMapExtraScale(1);

    const bounds = new google.maps.LatLngBounds();
    let hasPoint = false;
    const roof = currentRoofRef.current;

    if (roof) {
      for (const section of roofGeometryToPolygons(roof)) {
        for (const [lng, lat] of section.coordinates[0].slice(0, -1)) {
          bounds.extend({ lat, lng });
          hasPoint = true;
        }
      }
    }
    for (const panel of placedPanelsRef.current) {
      for (const [lng, lat] of panel.footprint_geojson.coordinates[0]?.slice(0, -1) ?? []) {
        bounds.extend({ lat, lng });
        hasPoint = true;
      }
    }

    if (hasPoint) {
      map.fitBounds(bounds, 72);
      google.maps.event.addListenerOnce(map, "idle", () => {
        const z = map.getZoom();
        if (typeof z === "number" && z > 21) map.setZoom(21);
      });
      toast.success("Design found", "Map centered on your roof / panels.");
      return;
    }

    const [lng, lat] = center;
    if (lng !== DEFAULT_CENTER[0] || lat !== DEFAULT_CENTER[1]) {
      map.panTo({ lat, lng });
      map.setZoom(20);
      toast.success("Site location", "Map moved to project center.");
      return;
    }

    toast.info("No design yet", "Draw a roof first, or use GPS / Go to location.");
  }, [center, toast]);

  const flyToGps = useCallback(
    (lat: number, lng: number, label: string) => {
      const next: [number, number] = [lng, lat];
      setCenter(next);
      setLatInput(String(lat));
      setLngInput(String(lng));
      mapRef.current?.panTo({ lat, lng });
      mapRef.current?.setZoom(20);
      toast.success("Location set", label);
    },
    [toast]
  );

  const goToLatLng = useCallback(() => {
    const fromFields = parseSeparateLatLng(latInput, lngInput);
    const fromPaste = parseLatLngText(gpsPaste);
    const point = fromFields ?? fromPaste;
    if (!point) {
      toast.error(
        "Invalid coordinates",
        "Enter Lat + Long, or paste e.g. Lat 24.576354, Long 80.836641"
      );
      return;
    }
    flyToGps(
      point.lat,
      point.lng,
      point.source === "stamp" ? "GPS stamp applied." : "Coordinates applied."
    );
  }, [flyToGps, gpsPaste, latInput, lngInput, toast]);

  const onGpsPhotoSelected = useCallback(
    async (file: File | null) => {
      if (!file) return;
      setGpsBusy(true);
      try {
        const fromExif = await extractGpsFromImageFile(file);
        if (fromExif) {
          flyToGps(fromExif.lat, fromExif.lng, "GPS read from photo EXIF.");
          return;
        }
        toast.error(
          "No GPS in photo",
          "WhatsApp often removes EXIF. Open the photo, copy Lat/Long from the stamp, and paste below."
        );
      } catch (error) {
        toast.error("Photo GPS failed", error instanceof Error ? error.message : "Could not read photo.");
      } finally {
        setGpsBusy(false);
        if (photoInputRef.current) photoInputRef.current.value = "";
      }
    },
    [flyToGps, toast]
  );

  const searchLocation = useCallback(async () => {
    const query = searchText.trim();
    if (!query || !googleMapsKey || !window.google?.maps) return;
    setSearching(true);
    try {
      const geocoder = new google.maps.Geocoder();
      const response = await geocoder.geocode({ address: query, region: "IN" });
      const location = response.results[0]?.geometry.location;
      if (!location) throw new Error("Location not found.");
      const found: [number, number] = [location.lng(), location.lat()];
      setCenter(found);
      mapRef.current?.panTo(location);
      mapRef.current?.setZoom(20);
    } catch (error) {
      toast.error("Search failed", error instanceof Error ? error.message : "Location not found.");
    } finally {
      setSearching(false);
    }
  }, [googleMapsKey, searchText, toast]);

  const runAutoLayout = useCallback(
    (overrides?: {
      orientation?: Exclude<PanelOrientation, "east_west">;
      mountingType?: PanelMountingType;
      /** Soften toasts when re-packing after orientation/mounting toggle. */
      quiet?: boolean;
    }) => {
      if (!state.roof) {
        toast.error("Draw roof first", "Complete at least one roof section before auto layout.");
        return;
      }
      const orientation = overrides?.orientation ?? panelOrientation;
      const mounting = overrides?.mountingType ?? mountingType;
      const lengthM = moduleLengthForOrientationM(
        panelSpec.width_mm,
        panelSpec.height_mm,
        orientation
      );
      const pitchM = recommendedRowPitchM({
        tiltDeg: panelTiltDeg,
        moduleLengthM: lengthM,
        latitudeDeg: center[1],
        mounting,
      });

      setPacking(true);
      try {
        // Only keep locked panels; unlocked are cleared and re-packed (avoids old overlap on tanks).
        const lockedPanels = placedPanels.filter((panel) => panel.is_locked);
        const result = autoPackPanels({
          roof: state.roof,
          obstructions: state.obstructions,
          panelSpec,
          orientation,
          setbackFt: panelSetbackFt,
          mountingType: mounting,
          tiltDeg: panelTiltDeg,
          rowPitchM: mounting === "flush" ? undefined : pitchM,
          obstructionClearanceFt: 1.5,
          preservePanels: lockedPanels,
          packMode,
          targetKw: packMode === "target_kw" ? targetKw : undefined,
        });
        pushPanelHistory(placedPanels);
        setPlacedPanels(result.panels);
        setPanelMetrics({
          remainingAreaSqft: result.remainingAreaSqft,
          coveragePct: result.coveragePct,
        });
        setMaxCapacity({
          maxPanelCount: result.maxPanelCount,
          maxDcCapacityKw: result.maxDcCapacityKw,
        });
        setSelectedPanelIds([]);
        setPanelDirty(true);
        if (result.panelCount === 0) {
          toast.error(
            "No panels fit",
            "Roof too small for this module, or setback is high. Try setback 0–1 ft, or Landscape."
          );
        } else if (overrides?.quiet) {
          toast.success(
            orientation === "landscape" ? "Landscape layout" : "Portrait layout",
            `${result.panelCount} panels · ${result.dcCapacityKw.toFixed(2)} kW DC`
          );
        } else if (
          packMode === "target_kw" &&
          result.dcCapacityKw + 0.01 < targetKw &&
          result.maxDcCapacityKw + 0.01 < targetKw
        ) {
          toast.error(
            "Target exceeds roof",
            `Max ~${result.maxDcCapacityKw.toFixed(2)} kW on this roof. Placed ${result.panelCount} panels (${result.dcCapacityKw.toFixed(2)} kW).`
          );
        } else if (packMode === "target_kw" && result.dcCapacityKw + 0.05 < targetKw) {
          toast.success(
            "Partial target",
            `${result.panelCount} panels · ${result.dcCapacityKw.toFixed(2)} kW (max ${result.maxDcCapacityKw.toFixed(2)} kW)`
          );
        } else {
          toast.success(
            "Panels placed",
            `${result.panelCount} panels · ${result.dcCapacityKw.toFixed(2)} kW DC` +
              (packMode === "target_kw" ? ` · target ${targetKw} kW` : " · fill max")
          );
        }
      } catch (error) {
        toast.error(
          "Auto layout failed",
          error instanceof Error ? error.message : "Could not pack panels on this roof."
        );
      } finally {
        setPacking(false);
      }
    },
    [
      center,
      packMode,
      panelOrientation,
      panelSetbackFt,
      panelSpec,
      panelTiltDeg,
      mountingType,
      placedPanels,
      pushPanelHistory,
      state.obstructions,
      state.roof,
      targetKw,
      toast,
    ]
  );

  const applyPanelOrientation = useCallback(
    (orientation: Exclude<PanelOrientation, "east_west">) => {
      if (orientation === panelOrientation) return;
      setPanelOrientation(orientation);
      setPanelDirty(true);
      if (placedPanels.length > 0 && state.roof) {
        runAutoLayout({ orientation, quiet: true });
      }
    },
    [panelOrientation, placedPanels.length, runAutoLayout, state.roof]
  );

  useEffect(() => {
    if (!state.roof) {
      setMaxCapacity({ maxPanelCount: 0, maxDcCapacityKw: 0 });
      return;
    }
    try {
      const estimate = estimateMaxDcCapacity({
        roof: state.roof,
        obstructions: state.obstructions,
        panelSpec,
        orientation: panelOrientation,
        setbackFt: panelSetbackFt,
        mountingType,
        tiltDeg: panelTiltDeg,
        rowPitchM: mountingType === "flush" ? undefined : rowPitchM,
        obstructionClearanceFt: 1.5,
        preservePanels: [],
      });
      setMaxCapacity({
        maxPanelCount: estimate.maxPanelCount,
        maxDcCapacityKw: estimate.maxDcCapacityKw,
      });
    } catch {
      // ignore estimate errors while drawing
    }
  }, [
    mountingType,
    panelOrientation,
    panelSetbackFt,
    panelSpec,
    panelTiltDeg,
    rowPitchM,
    state.obstructions,
    state.roof,
  ]);

  const clearPanels = useCallback(() => {
    if (placedPanels.length === 0) return;
    pushPanelHistory(placedPanels);
    setPlacedPanels([]);
    setSelectedPanelIds([]);
    setPanelMetrics({ remainingAreaSqft: 0, coveragePct: 0 });
    setPanelDirty(true);
  }, [placedPanels, pushPanelHistory]);

  /** Rotate selected panels ±5° (west / east). Locked selection is skipped. */
  const rotatePlant = useCallback(
    (deltaDeg: number) => {
      const current = placedPanelsRef.current;
      const selectedIds = selectedPanelIdsRef.current;
      if (selectedIds.length === 0) {
        toast.error("Select panels first", "Click panels to select, then rotate west/east.");
        return;
      }
      const rotatable = selectedIds.filter((id) => {
        const panel = current.find((p) => p.id === id);
        return panel && !panel.is_locked;
      });
      if (rotatable.length === 0) {
        toast.error("Selected panels locked", "Unlock selected panels to rotate them.");
        return;
      }
      const next = rotatePlacedPanels(current, deltaDeg, rotatable);
      if (next === current) return;
      pushPanelHistory(current);
      setPlacedPanels(next);
      if (state.roof) {
        setPanelMetrics(computePanelCoverageMetrics(state.roof, next));
      }
      setPanelDirty(true);
      const dir = deltaDeg < 0 ? "west" : "east";
      toast.success(
        `${rotatable.length} panel${rotatable.length === 1 ? "" : "s"} rotated ${Math.abs(deltaDeg)}° ${dir}`,
        "Nudge panels if needed. Small east/west yaw (~1–3% generation) is fine."
      );
    },
    [pushPanelHistory, state.roof, toast]
  );

  const deleteSelectedPanel = useCallback(() => {
    const ids = selectedPanelIdsRef.current;
    if (ids.length === 0) return;
    pushPanelHistory(placedPanelsRef.current);
    setPlacedPanels((current) => {
      const next = current.filter((panel) => !ids.includes(panel.id));
      if (state.roof) {
        setPanelMetrics(computePanelCoverageMetrics(state.roof, next));
      } else {
        setPanelMetrics({ remainingAreaSqft: 0, coveragePct: 0 });
      }
      return next;
    });
    setSelectedPanelIds([]);
    setPanelDirty(true);
  }, [pushPanelHistory, state.roof]);

  /** Duplicate selected panels with a small NE offset so copies are visible. */
  const duplicateSelectedPanels = useCallback(() => {
    const ids = selectedPanelIdsRef.current;
    if (ids.length === 0) {
      toast.error("Select panels first", "Click a panel, then Duplicate.");
      return;
    }
    const current = placedPanelsRef.current;
    const selected = current.filter((panel) => ids.includes(panel.id));
    if (selected.length === 0) return;

    const stamp = Date.now();
    const copies: PlacedPanel[] = selected.map((panel, index) => {
      const c = footprintCentroid(panel.footprint_geojson);
      const lat = c?.lat ?? 20;
      const eastM = 0.55 + index * 0.05;
      const northM = 0.2;
      const dLat = northM / 110_540;
      const dLng = eastM / (111_320 * Math.max(0.2, Math.cos((lat * Math.PI) / 180)));
      return {
        ...panel,
        id: `p-dup-${stamp}-${index}-${Math.random().toString(36).slice(2, 7)}`,
        footprint_geojson: translateFootprint(panel.footprint_geojson, dLng, dLat),
        is_locked: false,
        is_manually_placed: true,
        row_index: panel.row_index,
        col_index: panel.col_index + 1,
      };
    });

    pushPanelHistory(current);
    const next = [...current, ...copies];
    setPlacedPanels(next);
    if (state.roof) {
      setPanelMetrics(computePanelCoverageMetrics(state.roof, next));
    }
    setSelectedPanelIds(copies.map((panel) => panel.id));
    setPanelDirty(true);
    toast.success(
      `Duplicated ${copies.length} panel${copies.length === 1 ? "" : "s"}`,
      "Copies are selected — drag to place. Snap (magnet) helps align."
    );
  }, [pushPanelHistory, state.roof, toast]);

  const placeManualPanelAt = useCallback(
    (latLng: google.maps.LatLng) => {
      if (!state.roof) {
        toast.error("Draw roof first", "Complete a roof section before placing panels.");
        return;
      }
      try {
        const roofFeature =
          state.roof.type === "Polygon"
            ? polygon(state.roof.coordinates)
            : multiPolygon(state.roof.coordinates);
        if (
          !booleanPointInPolygon(
            point([latLng.lng(), latLng.lat()]),
            roofFeature as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>
          )
        ) {
          toast.error("Outside roof", "Panel sirf roof ke andar place / snap hota hai.");
          return;
        }
      } catch {
        // if turf fails, still allow place
      }
      const panel = createManualPanelAt({
        lng: latLng.lng(),
        lat: latLng.lat(),
        panelSpec,
        orientation: panelOrientation,
        sectionIndex: activeRoofIndexRef.current,
      });
      if (!panel) {
        toast.error("Could not place panel", "Try zooming in and clicking again.");
        return;
      }
      const footprint =
        snapEnabledRef.current && placedPanelsRef.current.length > 0
          ? snapNewPanelFootprint({
              footprint: panel.footprint_geojson,
              anchors: placedPanelsRef.current,
              panelSpec,
              orientation: panelOrientation,
              panelGapMm: 20,
            })
          : panel.footprint_geojson;
      const nextPanel = { ...panel, footprint_geojson: footprint };
      pushPanelHistory(placedPanelsRef.current);
      const next = [...placedPanelsRef.current, nextPanel];
      setPlacedPanels(next);
      setSelectedPanelIds([nextPanel.id]);
      setPanelDirty(true);
      if (state.roof) {
        setPanelMetrics(computePanelCoverageMetrics(state.roof, next));
      }
    },
    [panelOrientation, panelSpec, pushPanelHistory, state.roof, toast]
  );

  useEffect(() => {
    placePanelRef.current = placeManualPanelAt;
  }, [placeManualPanelAt]);

  const undoStudio = useCallback(() => {
    if (drawingRoof) {
      undoRoof();
      return;
    }
    if (panelUndoStackRef.current.length > 0) {
      undoPanels();
      return;
    }
    undoRoof();
  }, [drawingRoof, undoPanels, undoRoof]);

  const redoStudio = useCallback(() => {
    if (drawingRoof) {
      redoRoof();
      return;
    }
    if (panelRedoStackRef.current.length > 0) {
      redoPanels();
      return;
    }
    redoRoof();
  }, [drawingRoof, redoPanels, redoRoof]);

  useEffect(() => {
    undoStudioRef.current = undoStudio;
    redoStudioRef.current = redoStudio;
    deleteSelectedPanelRef.current = deleteSelectedPanel;
  }, [deleteSelectedPanel, redoStudio, undoStudio]);

  const clearStudioTool = useCallback(() => {
    setStudioTool(null);
    studioToolRef.current = null;
    setSelectedPanelIds([]);
    addObstructionRef.current = null;
    setPendingObstruction(null);
    mapRef.current?.setOptions({ draggableCursor: null });
  }, []);

  const setActiveStudioTool = useCallback(
    (tool: StudioTool) => {
      if (drawingRoof) {
        cancelRoofDrawing();
      }
      addObstructionRef.current = null;
      setPendingObstruction(null);

      // Same tool again → fully unselect (idle). Do NOT force Select on.
      if (studioToolRef.current === tool) {
        clearStudioTool();
        return;
      }

      // Panel tools need roof locked underneath so it never steals clicks.
      if (!roofLockedRef.current && roofPolygonsRef.current.length > 0) {
        roofLockedRef.current = true;
        setRoofLocked(true);
        clearRoofEditMarkers();
        roofPolygonsRef.current.forEach((polygon) =>
          polygon.setOptions({
            clickable: false,
            editable: false,
            zIndex: ROOF_Z_INDEX,
          })
        );
      }

      setStudioTool(tool);
      studioToolRef.current = tool;
      if (tool === "move_group") {
        const unlocked = placedPanelsRef.current
          .filter((panel) => !panel.is_locked)
          .map((panel) => panel.id);
        setSelectedPanelIds(unlocked);
      } else if (tool === "select") {
        setSelectedPanelIds((ids) => (ids.length > 1 ? [] : ids));
      }
      mapRef.current?.setOptions({
        draggableCursor:
          tool === "place_panel" ? "crosshair" : tool === "move_group" ? "move" : null,
      });
    },
    [cancelRoofDrawing, clearRoofEditMarkers, clearStudioTool, drawingRoof]
  );

  useEffect(() => {
    setActiveStudioToolRef.current = setActiveStudioTool;
    clearStudioToolRef.current = clearStudioTool;
  }, [clearStudioTool, setActiveStudioTool]);

  /** Snap is a toggle, not a draw tool — never leave roof-draw / place modes on. */
  const toggleSnap = useCallback(() => {
    if (drawingRoof) {
      cancelRoofDrawing();
    }
    addObstructionRef.current = null;
    setPendingObstruction(null);
    setStudioTool(null);
    studioToolRef.current = null;
    mapRef.current?.setOptions({ draggableCursor: null });
    setSnapEnabled((value) => !value);
  }, [cancelRoofDrawing, drawingRoof]);

  const cycleMapType = useCallback(() => {
    const order: Array<"roadmap" | "hybrid" | "satellite"> = ["hybrid", "satellite", "roadmap"];
    const current = mapRef.current?.getMapTypeId() as string | undefined;
    const idx = order.indexOf(
      current === "roadmap" || current === "hybrid" || current === "satellite"
        ? current
        : mapTypeId
    );
    const next = order[(idx + 1) % order.length]!;
    mapRef.current?.setMapTypeId(next);
    setMapTypeId(next);
  }, [mapTypeId]);

  useEffect(() => {
    mapExtraScaleRef.current = mapExtraScale;
    const map = mapRef.current;
    if (!map) return;
    // Optical magnify breaks map pointer math — lock pan/zoom gestures while active.
    map.setOptions({
      gestureHandling: mapExtraScale > 1 ? "none" : "greedy",
      draggable: mapExtraScale <= 1,
      scrollwheel: mapExtraScale <= 1,
      maxZoom: MAP_MAX_ZOOM,
      isFractionalZoomEnabled: true,
    });
  }, [mapExtraScale]);

  const zoomBy = useCallback(
    (delta: number) => {
      const map = mapRef.current;
      if (!map) return;
      map.setOptions({ maxZoom: MAP_MAX_ZOOM, minZoom: 3, isFractionalZoomEnabled: true });
      const zoom = map.getZoom() ?? 18;
      const inOptical =
        mapExtraScaleRef.current > 1 || zoom >= MAP_OPTICAL_FROM - 0.05;

      if (delta > 0) {
        if (!inOptical) {
          const before = zoom;
          const step = zoom >= MAP_OPTICAL_FROM - 1 ? 0.5 : 1;
          const target = Math.min(MAP_MAX_ZOOM, zoom + step);
          map.setZoom(target);
          // If Google clamped (common on India satellite ~20), jump to optical.
          window.setTimeout(() => {
            const after = map.getZoom() ?? before;
            if (after <= before + 0.05) {
              setMapExtraScale((scale) =>
                Math.min(MAP_EXTRA_SCALE_MAX, +(Math.max(scale, 1) + MAP_EXTRA_SCALE_STEP).toFixed(2))
              );
            }
          }, 40);
          return;
        }
        setMapExtraScale((scale) => {
          const next = Math.min(MAP_EXTRA_SCALE_MAX, +(scale + MAP_EXTRA_SCALE_STEP).toFixed(2));
          if (next === scale) {
            toast.error(
              "Max zoom",
              `Design magnify max (${MAP_EXTRA_SCALE_MAX}×) pe pahunch gaye. Zoom out (−) se pehle kam karo.`
            );
          }
          return next;
        });
        return;
      }

      // Zoom out: unwind optical scale first, then native zoom.
      if (mapExtraScaleRef.current > 1) {
        setMapExtraScale((scale) => Math.max(1, +(scale - MAP_EXTRA_SCALE_STEP).toFixed(2)));
        return;
      }
      map.setZoom(Math.max(3, zoom - (zoom >= MAP_OPTICAL_FROM - 1 ? 0.5 : 1)));
    },
    [toast]
  );

  zoomByRef.current = zoomBy;

  /** Mouse wheel continues into Design magnify after Google satellite stops. */
  useEffect(() => {
    const el = mapViewportEl;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      const map = mapRef.current;
      if (!map) return;
      const zoom = map.getZoom() ?? 18;
      const atOptical =
        mapExtraScaleRef.current > 1 || zoom >= MAP_OPTICAL_FROM - 0.05;
      if (!atOptical) return;
      event.preventDefault();
      event.stopPropagation();
      zoomByRef.current(event.deltaY < 0 ? 1 : -1);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [mapViewportEl]);

  useEffect(() => {
    mapViewportElRef.current = mapViewportEl;
  }, [mapViewportEl]);

  /** Visual client → unscaled map container pixel (CSS optical magnify). */
  const clientToContainerPixel = useCallback((clientX: number, clientY: number) => {
    const map = mapRef.current;
    const viewport = mapViewportElRef.current;
    if (!map || !viewport) return null;
    const scale = Math.max(1, mapExtraScaleRef.current);
    const vr = viewport.getBoundingClientRect();
    const mapDiv = map.getDiv();
    const layoutW = mapDiv.clientWidth || viewport.clientWidth || vr.width;
    const layoutH = mapDiv.clientHeight || viewport.clientHeight || vr.height;
    if (layoutW <= 0 || layoutH <= 0) return null;
    const cx = vr.left + vr.width / 2;
    const cy = vr.top + vr.height / 2;
    return {
      x: layoutW / 2 + (clientX - cx) / scale,
      y: layoutH / 2 + (clientY - cy) / scale,
      layoutW,
      layoutH,
      scale,
      vr,
    };
  }, []);

  /** Layout container pixel → LatLng (OverlayView, else bounds + heading). */
  const containerPixelToLatLng = useCallback((mapX: number, mapY: number) => {
    const map = mapRef.current;
    if (!map || !window.google?.maps) return null;
    const overlay = projectionOverlayRef.current;
    const proj = overlay?.getProjection();
    if (proj) {
      const ll = proj.fromContainerPixelToLatLng(new google.maps.Point(mapX, mapY));
      if (ll) return ll;
    }
    const bounds = map.getBounds();
    if (!bounds) return null;
    const mapDiv = map.getDiv();
    const w = mapDiv.clientWidth || 1;
    const h = mapDiv.clientHeight || 1;
    let fx = mapX / w - 0.5;
    let fy = mapY / h - 0.5;
    const headingRad = ((map.getHeading() || 0) * Math.PI) / 180;
    if (headingRad !== 0) {
      const cos = Math.cos(-headingRad);
      const sin = Math.sin(-headingRad);
      const rx = fx * cos - fy * sin;
      const ry = fx * sin + fy * cos;
      fx = rx;
      fy = ry;
    }
    fx += 0.5;
    fy += 0.5;
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    const lat = ne.lat() - fy * (ne.lat() - sw.lat());
    const lng = sw.lng() + fx * (ne.lng() - sw.lng());
    return new google.maps.LatLng(lat, lng);
  }, []);

  /** CSS optical scale breaks Maps hit-testing — remap viewport clicks to LatLng. */
  const clientToLatLngOptical = useCallback(
    (clientX: number, clientY: number) => {
      const pixel = clientToContainerPixel(clientX, clientY);
      if (!pixel) return null;
      return containerPixelToLatLng(pixel.x, pixel.y);
    },
    [clientToContainerPixel, containerPixelToLatLng]
  );

  const findPanelAtLatLng = useCallback((latLng: google.maps.LatLng) => {
    const pt = point([latLng.lng(), latLng.lat()]);
    const panels = placedPanelsRef.current;
    for (let i = panels.length - 1; i >= 0; i -= 1) {
      const panel = panels[i]!;
      try {
        if (booleanPointInPolygon(pt, polygon(panel.footprint_geojson.coordinates))) {
          return panel;
        }
      } catch {
        /* ignore invalid ring */
      }
    }
    return null;
  }, []);

  /** Hit-test panels in screen space (more reliable under CSS scale than reverse LatLng). */
  const findPanelAtClient = useCallback(
    (clientX: number, clientY: number) => {
      const map = mapRef.current;
      const pixel = clientToContainerPixel(clientX, clientY);
      if (!map || !pixel || !window.google?.maps) {
        const latLng = clientToLatLngOptical(clientX, clientY);
        return latLng ? findPanelAtLatLng(latLng) : null;
      }

      const { layoutW, layoutH, scale, vr } = pixel;
      const cx = vr.left + vr.width / 2;
      const cy = vr.top + vr.height / 2;
      const overlay = projectionOverlayRef.current;
      const proj = overlay?.getProjection();
      const bounds = map.getBounds();
      const headingRad = ((map.getHeading() || 0) * Math.PI) / 180;

      const latLngToScreen = (lat: number, lng: number) => {
        if (proj) {
          const p = proj.fromLatLngToContainerPixel(new google.maps.LatLng(lat, lng));
          if (!p) return null;
          return {
            x: cx + (p.x - layoutW / 2) * scale,
            y: cy + (p.y - layoutH / 2) * scale,
          };
        }
        if (!bounds) return null;
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        const spanLat = ne.lat() - sw.lat() || 1e-9;
        const spanLng = ne.lng() - sw.lng() || 1e-9;
        let fx = (lng - sw.lng()) / spanLng - 0.5;
        let fy = (ne.lat() - lat) / spanLat - 0.5;
        if (headingRad !== 0) {
          const cos = Math.cos(headingRad);
          const sin = Math.sin(headingRad);
          const rx = fx * cos - fy * sin;
          const ry = fx * sin + fy * cos;
          fx = rx;
          fy = ry;
        }
        return {
          x: cx + fx * layoutW * scale,
          y: cy + fy * layoutH * scale,
        };
      };

      const pointInRing = (x: number, y: number, ring: Array<{ x: number; y: number }>) => {
        let inside = false;
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
          const xi = ring[i]!.x;
          const yi = ring[i]!.y;
          const xj = ring[j]!.x;
          const yj = ring[j]!.y;
          const dy = yj - yi;
          if (dy !== 0 && (yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / dy + xi) {
            inside = !inside;
          }
        }
        return inside;
      };

      const panels = placedPanelsRef.current;
      for (let i = panels.length - 1; i >= 0; i -= 1) {
        const panel = panels[i]!;
        const ring = panel.footprint_geojson.coordinates[0];
        if (!ring || ring.length < 3) continue;
        const screenRing: Array<{ x: number; y: number }> = [];
        let ok = true;
        for (let k = 0; k < ring.length - 1; k += 1) {
          const coord = ring[k]!;
          const screen = latLngToScreen(coord[1], coord[0]);
          if (!screen) {
            ok = false;
            break;
          }
          screenRing.push(screen);
        }
        if (ok && screenRing.length >= 3 && pointInRing(clientX, clientY, screenRing)) {
          return panel;
        }
      }

      // Fallback if projection/bounds screen mapping failed for all panels.
      const latLng = clientToLatLngOptical(clientX, clientY);
      return latLng ? findPanelAtLatLng(latLng) : null;
    },
    [clientToContainerPixel, clientToLatLngOptical, findPanelAtLatLng]
  );

  const handleOpticalPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (mapExtraScaleRef.current <= 1) return;
    const latLng = clientToLatLngOptical(event.clientX, event.clientY);
    const tool = studioToolRef.current;
    let panelDrag: {
      primaryId: string;
      startLatLng: { lat: number; lng: number };
      footprints: Record<string, PlacedPanel["footprint_geojson"]>;
      ids: string[];
    } | null = null;

    if (
      !addObstructionRef.current &&
      tool !== "place_panel" &&
      (tool === "select" || tool === "move_group" || tool == null)
    ) {
      const hit = findPanelAtClient(event.clientX, event.clientY);
      if (hit) {
        const selected = selectedPanelIdsRef.current;
        const ids =
          selected.includes(hit.id) && selected.length > 0
            ? selected.filter((id) => {
                const panel = placedPanelsRef.current.find((p) => p.id === id);
                return panel && !panel.is_locked;
              })
            : [hit.id];
        if (!selected.includes(hit.id)) {
          setSelectedPanelIds(hit.is_locked ? [hit.id] : ids);
        }
        if (!hit.is_locked && latLng) {
          const footprints: Record<string, PlacedPanel["footprint_geojson"]> = {};
          for (const item of placedPanelsRef.current) {
            if (ids.includes(item.id)) {
              footprints[item.id] = structuredClone(item.footprint_geojson);
            }
          }
          panelDrag = {
            primaryId: hit.id,
            startLatLng: { lat: latLng.lat(), lng: latLng.lng() },
            footprints,
            ids,
          };
          // Cell lines stay put while dragging — clear until commit redraw.
          panelCellLinesRef.current.forEach((line) => line.setMap(null));
          panelCellLinesRef.current = [];
          draggingPanelIdRef.current = hit.id;
        }
      }
    }

    opticalPointerRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
      panelDrag,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }, [clientToLatLngOptical, findPanelAtClient]);

  const handleOpticalPointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = opticalPointerRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 6) {
      drag.moved = true;
    }
    const panelDrag = drag.panelDrag;
    if (!panelDrag || !drag.moved) return;

    const latLng = clientToLatLngOptical(event.clientX, event.clientY);
    if (!latLng) return;
    const dLng = latLng.lng() - panelDrag.startLatLng.lng;
    const dLat = latLng.lat() - panelDrag.startLatLng.lat;
    const pathFromFootprint = (footprint: PlacedPanel["footprint_geojson"]) =>
      footprint.coordinates[0].slice(0, -1).map(([lng, lat]) => ({ lat, lng }));

    placedPanelsRef.current.forEach((item, index) => {
      const base = panelDrag.footprints[item.id];
      if (!base) return;
      const poly = panelPolygonsRef.current[index];
      if (!poly) return;
      poly.setPaths(pathFromFootprint(translateFootprint(base, dLng, dLat)));
    });
  }, [clientToLatLngOptical]);

  const handleOpticalPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = opticalPointerRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      opticalPointerRef.current = null;
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        /* already released */
      }

      const panelDrag = drag.panelDrag;
      draggingPanelIdRef.current = null;

      // Optical drag commit (CSS scale breaks native Maps polygon drag).
      if (panelDrag && drag.moved) {
        const latLng = clientToLatLngOptical(event.clientX, event.clientY);
        const primaryOriginal = placedPanelsRef.current.find((item) => item.id === panelDrag.primaryId);
        const basePrimary = panelDrag.footprints[panelDrag.primaryId];
        if (latLng && primaryOriginal && basePrimary) {
          let dLng = latLng.lng() - panelDrag.startLatLng.lng;
          let dLat = latLng.lat() - panelDrag.startLatLng.lat;
          const movedFootprint = translateFootprint(basePrimary, dLng, dLat);
          if (snapEnabledRef.current) {
            const anchors = placedPanelsRef.current.filter(
              (item) => !panelDrag.ids.includes(item.id)
            );
            const snapped = snapPanelMove({
              moved: primaryOriginal,
              movedFootprint,
              anchors,
              panelSpec: panelSpecRef.current,
              orientation: panelOrientationRef.current,
              panelGapMm: 20,
            });
            dLng = snapped.dLng;
            dLat = snapped.dLat;
          }
          pushPanelHistory(placedPanelsRef.current);
          setPlacedPanels((current) =>
            current.map((item) => {
              if (!panelDrag.ids.includes(item.id) || item.is_locked) return item;
              const base = panelDrag.footprints[item.id] ?? item.footprint_geojson;
              return {
                ...item,
                footprint_geojson: translateFootprint(base, dLng, dLat),
                is_manually_placed: true,
              };
            })
          );
          setPanelDirty(true);
        } else {
          // Abort mid-drag projection failure — redraw from committed state.
          setPlacedPanels((current) => current.map((panel) => ({ ...panel })));
        }
        return;
      }

      const latLng = clientToLatLngOptical(event.clientX, event.clientY);

      const type = addObstructionRef.current;
      if (type) {
        if (latLng) studioClickRef.current?.(latLng);
        return;
      }
      if (studioToolRef.current === "place_panel") {
        if (latLng) placePanelRef.current?.(latLng);
        return;
      }

      const hit = findPanelAtClient(event.clientX, event.clientY);
      const tool = studioToolRef.current;
      if (hit && (tool === "select" || tool === "move_group" || tool == null)) {
        if (event.shiftKey) {
          setSelectedPanelIds((current) =>
            current.includes(hit.id)
              ? current.filter((id) => id !== hit.id)
              : [...current, hit.id]
          );
        } else {
          setSelectedPanelIds([hit.id]);
        }
        return;
      }
      if (
        (tool === "select" || tool === "move_group" || tool == null) &&
        selectedPanelIdsRef.current.length > 0
      ) {
        setSelectedPanelIds([]);
      }
    },
    [clientToLatLngOptical, findPanelAtClient, pushPanelHistory]
  );

  const resetMapNorth = useCallback(() => {
    mapRef.current?.setHeading(0);
    mapRef.current?.setTilt(0);
    setMapHeading(0);
  }, []);

  const toggleSelectedPanelLock = useCallback(() => {
    const ids = selectedPanelIdsRef.current;
    if (ids.length === 0) return;
    setPlacedPanels((current) =>
      current.map((panel) =>
        ids.includes(panel.id) ? { ...panel, is_locked: !panel.is_locked } : panel
      )
    );
    setPanelDirty(true);
  }, []);

  const saveLayout = useCallback(async () => {
    if (!state.roof || !state.metrics) {
      toast.error("Draw roof first", "Complete the roof polygon before saving.");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/site-layout`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          center_lat: center[1],
          center_lng: center[0],
          roof_geojson: state.roof,
          roof_azimuth_deg: state.metrics.azimuthDeg,
          obstructions_geojson: state.obstructions,
          roof_area_sqft: state.metrics.areaSqft,
        }),
      });
      const json = (await response.json()) as ApiEnvelope<ProjectSiteLayout>;
      if (!json.ok || !json.data) throw new Error(json.error || "Layout could not be saved.");

      const surveyMethod = survey ? "PATCH" : "POST";
      const surveyResponse = await fetch(`/api/projects/${projectId}/survey`, {
        method: surveyMethod,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gps_lat: center[1],
          gps_lng: center[0],
          roof_area_sqft: state.metrics.areaSqft,
          roof_type: roofType || null,
        }),
      });
      if (surveyResponse.ok && !survey) {
        const surveyJson = (await surveyResponse.json()) as ApiEnvelope<SurveySummary>;
        if (surveyJson.data) setSurvey(surveyJson.data);
      }

      setCurrentLayout(json.data);
      dispatch({ type: "MARK_SAVED" });

      if (placedPanels.length > 0) {
        const panelCount = placedPanels.length;
        const dcCapacityKw = (panelCount * panelSpec.wattage) / 1_000;
        const panelResponse = await fetch(`/api/projects/${projectId}/panel-layout`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            site_layout_id: json.data.id,
            panel_spec: panelSpec,
            orientation: panelOrientation,
            tilt_deg: panelTiltDeg,
            mounting_type: mountingType,
            setback_ft: panelSetbackFt,
            walkway_ft: 0,
            panel_gap_mm: 20,
            panels_geojson: placedPanels,
            panel_count: panelCount,
            dc_capacity_kw: dcCapacityKw,
            remaining_area_sqft: panelMetrics.remainingAreaSqft,
            coverage_pct: panelMetrics.coveragePct,
          }),
        });
        const panelJson = (await panelResponse.json()) as ApiEnvelope<ProjectPanelLayout>;
        if (!panelJson.ok || !panelJson.data) {
          throw new Error(panelJson.error || "Panel layout could not be saved.");
        }
        setCurrentPanelLayout(panelJson.data);
        setPanelDirty(false);
        toast.success(
          "Design saved",
          `Roof V${json.data.version_number} · Panels V${panelJson.data.version_number} · ${panelCount} modules`
        );
      } else {
        toast.success("Site layout saved", `Version ${json.data.version_number} is now current.`);
      }

      await clearSiteLayoutDraft(projectId);
    } catch (error) {
      toast.error("Save failed", error instanceof Error ? error.message : "Could not save layout.");
    } finally {
      setSaving(false);
    }
  }, [
    center,
    panelMetrics.coveragePct,
    panelMetrics.remainingAreaSqft,
    panelOrientation,
    panelSetbackFt,
    panelSpec,
    panelTiltDeg,
    mountingType,
    placedPanels,
    projectId,
    roofType,
    state.metrics,
    state.obstructions,
    state.roof,
    survey,
    toast,
  ]);

  if (loading) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center text-sm text-slate-500">
        Loading Design Studio…
      </div>
    );
  }

  return (
    <main className="flex h-full min-h-0 flex-col overflow-hidden bg-slate-100 dark:bg-slate-950">
      <header className="z-40 shrink-0 border-b border-slate-200 bg-white/95 px-3 py-1.5 backdrop-blur dark:border-white/10 dark:bg-slate-950/95 sm:px-4">
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/projects/${encodeURIComponent(projectId)}?tab=design`}>
                <ArrowLeft className="mr-1 h-4 w-4" /> Project
              </Link>
            </Button>
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold text-slate-900 dark:text-white">
                2D Design Studio · {project?.official_name || project?.lead_name || "Project"}
              </p>
              <p className="truncate text-[11px] text-slate-500">
                Phase 2 Panels · {currentLayout ? `Roof V${currentLayout.version_number}` : "New roof"}
                {currentPanelLayout ? ` · Panels V${currentPanelLayout.version_number}` : ""}
                {state.dirty || panelDirty ? " · Unsaved changes" : ""}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="hidden items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold sm:flex dark:border-white/10 dark:bg-white/[0.04]">
              <span className="text-slate-500">
                {packMode === "target_kw" ? `Target ${targetKw} kW` : "Fill max"}
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-700 dark:text-slate-200">
                Max {maxCapacity.maxDcCapacityKw > 0 ? `${maxCapacity.maxDcCapacityKw.toFixed(1)} kW` : "—"}
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-blue-700 dark:text-blue-300">
                Placed{" "}
                {placedPanels.length
                  ? `${((placedPanels.length * panelSpec.wattage) / 1000).toFixed(2)} kW`
                  : "—"}
              </span>
            </div>
            <Button onClick={() => void saveLayout()} disabled={saving || !state.roof || drawingRoof}>
              <Save className="mr-1.5 h-4 w-4" />
              {saving ? "Saving…" : "Save version"}
            </Button>
          </div>
        </div>
      </header>

      <div className="grid min-h-0 w-full flex-1 grid-cols-[52px_minmax(0,1fr)] grid-rows-[minmax(0,1fr)_minmax(11rem,34dvh)] overflow-hidden bg-slate-200/40 dark:bg-slate-950 lg:grid-cols-[52px_minmax(0,1fr)_360px] lg:grid-rows-[minmax(0,1fr)]">

        <aside className="row-span-2 flex min-h-0 flex-col overflow-hidden border-r border-slate-800 bg-slate-900 text-slate-100 lg:row-span-1">
          <div className="flex flex-1 flex-col items-center gap-0.5 overflow-y-auto overscroll-contain py-2">
            <button
              type="button"
              title="Select / move (V) · click panel to select · empty map to deselect · Shift+click multi"
              onClick={() => setActiveStudioTool("select")}
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                studioTool === "select" && !pendingObstruction && !drawingRoof
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-white/10"
              }`}
            >
              <MousePointer2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Move group · starts with all unlocked; click a panel to select one · empty map deselects"
              disabled={drawingRoof || placedPanels.length === 0}
              onClick={() => setActiveStudioTool("move_group")}
              className={`flex h-10 w-10 items-center justify-center rounded-lg disabled:opacity-40 ${
                studioTool === "move_group" ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-white/10"
              }`}
            >
              <SquareStack className="h-4 w-4" />
            </button>
            <button
              type="button"
              title={state.roof ? "Place panel" : "Draw a roof first to place panels"}
              disabled={!state.roof || drawingRoof}
              onClick={() => setActiveStudioTool("place_panel")}
              className={`flex h-10 w-10 items-center justify-center rounded-lg disabled:opacity-40 ${
                studioTool === "place_panel" ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-white/10"
              }`}
            >
              <Square className="h-4 w-4" />
            </button>
            <button
              type="button"
              title={
                snapEnabled
                  ? "Snap ON — panel grid align (click to turn off)"
                  : "Snap OFF — click to turn on"
              }
              onClick={toggleSnap}
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                snapEnabled ? "bg-emerald-600 text-white" : "text-slate-300 hover:bg-white/10"
              }`}
            >
              <Magnet className="h-4 w-4" />
            </button>
            <button
              type="button"
              title={drawingRoof ? "Cancel roof draw" : "Draw / add roof section"}
              onClick={toggleRoofDrawing}
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                drawingRoof
                  ? "bg-rose-600 text-white"
                  : "text-slate-300 hover:bg-white/10"
              }`}
            >
              <TriangleRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              title={
                pendingObstruction === "water_tank"
                  ? "Cancel water tank place"
                  : "Water tank"
              }
              onClick={() => beginObstruction("water_tank")}
              className={`flex h-10 w-10 items-center justify-center rounded-lg text-[10px] font-extrabold ${
                pendingObstruction === "water_tank"
                  ? "bg-amber-500 text-white"
                  : "text-amber-300 hover:bg-white/10"
              }`}
            >
              WT
            </button>
            <div className="my-1 h-px w-6 bg-white/15" />
            <button type="button" title="Zoom in (past satellite limit = design magnify)" onClick={() => zoomBy(1)} className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10">
              <Plus className="h-4 w-4" />
            </button>
            <button type="button" title="Zoom out" onClick={() => zoomBy(-1)} className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10">
              <Minus className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Find design — zoom back to roof / panels"
              onClick={focusOnDesign}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-emerald-300 hover:bg-white/10"
            >
              <Focus className="h-4 w-4" />
            </button>
            <button
              type="button"
              title={`Rotate selected panels 5° west${panelRotationSummary?.deg != null ? ` · now ${panelRotationSummary.label}` : ""}`}
              disabled={
                !selectedPanelIds.some((id) => {
                  const panel = placedPanels.find((p) => p.id === id);
                  return panel && !panel.is_locked;
                })
              }
              onClick={() => rotatePlant(-5)}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-sky-300 hover:bg-white/10 disabled:opacity-30"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <div
              className="flex min-h-8 min-w-[2.75rem] items-center justify-center rounded-md bg-sky-500/15 px-1 text-[10px] font-extrabold tabular-nums text-sky-200"
              title={
                panelRotationSummary?.detail ??
                "Panel yaw after west/east rotate. Select panels, then rotate."
              }
            >
              {panelRotationSummary?.label ?? "—"}
            </div>
            <button
              type="button"
              title={`Rotate selected panels 5° east${panelRotationSummary?.deg != null ? ` · now ${panelRotationSummary.label}` : ""}`}
              disabled={
                !selectedPanelIds.some((id) => {
                  const panel = placedPanels.find((p) => p.id === id);
                  return panel && !panel.is_locked;
                })
              }
              onClick={() => rotatePlant(5)}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-sky-300 hover:bg-white/10 disabled:opacity-30"
            >
              <RotateCw className="h-4 w-4" />
            </button>
            <button type="button" title={`Map: ${mapTypeId}`} onClick={cycleMapType} className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10">
              <MapIcon className="h-4 w-4" />
            </button>
            <button type="button" title="Reset north" onClick={resetMapNorth} className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10">
              <Compass className="h-4 w-4" style={{ transform: `rotate(${-mapHeading}deg)` }} />
            </button>
            <div className="my-1 h-px w-6 bg-white/15" />
            <button type="button" title="Undo" disabled={!canUndo} onClick={undoStudio} className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10 disabled:opacity-30">
              <Undo2 className="h-4 w-4" />
            </button>
            <button type="button" title="Redo" disabled={!canRedo} onClick={redoStudio} className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10 disabled:opacity-30">
              <Redo2 className="h-4 w-4" />
            </button>
          </div>
        </aside>

        <section
          ref={setMapViewportEl}
          className="relative min-h-0 overflow-hidden overscroll-none border-slate-200 bg-slate-200 dark:border-white/10 dark:bg-slate-900 lg:h-full lg:border-0"
        >
          {googleMapsKey ? (
            <div
              className="absolute inset-0 h-full w-full will-change-transform"
              style={
                mapExtraScale > 1
                  ? { transform: `scale(${mapExtraScale})`, transformOrigin: "center center" }
                  : undefined
              }
            >
              <div ref={setMapContainerEl} className="h-full w-full" />
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <div className="max-w-md rounded-xl border border-amber-200 bg-amber-50 p-5 text-center">
                <Cloud className="mx-auto h-8 w-8 text-amber-700" />
                <p className="mt-2 text-sm font-extrabold text-amber-950">Google Maps API key required</p>
                <p className="mt-1 text-xs leading-relaxed text-amber-800">
                  Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local and Vercel, enable Maps JavaScript
                  API + Geocoding API with billing, then restart / redeploy.
                </p>
              </div>
            </div>
          )}
          {mapExtraScale > 1 ? (
            <>
              {/* Remap clicks — CSS scale breaks Google Maps panel hit-testing */}
              <div
                className="absolute inset-0 z-[15] touch-none"
                onPointerDown={handleOpticalPointerDown}
                onPointerMove={handleOpticalPointerMove}
                onPointerUp={handleOpticalPointerUp}
                onPointerCancel={handleOpticalPointerUp}
              />
              <div className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-900 shadow">
                Design magnify {mapExtraScale.toFixed(2)}× · max {MAP_EXTRA_SCALE_MAX}× · click/drag panels · wheel − zoom out
              </div>
            </>
          ) : null}
          {/* Compass — left side, vertically centered */}
          {googleMapsKey && mapReady ? (
            <button
              type="button"
              title="Compass — click to reset north"
              aria-label="Reset map to north"
              onClick={resetMapNorth}
              className="absolute left-3 top-1/2 z-20 flex h-[4.5rem] w-[4.5rem] -translate-y-1/2 flex-col items-center justify-center rounded-full border border-white/80 bg-slate-950/80 text-white shadow-lg backdrop-blur-sm transition hover:bg-slate-950/95 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              <span
                className="relative flex h-14 w-14 items-center justify-center"
                style={{ transform: `rotate(${-mapHeading}deg)` }}
              >
                <span
                  className="absolute left-1/2 top-0.5 h-5 w-0 -translate-x-1/2 border-x-[6px] border-b-[12px] border-x-transparent border-b-rose-500"
                  aria-hidden
                />
                <span
                  className="absolute bottom-0.5 left-1/2 h-5 w-0 -translate-x-1/2 border-x-[6px] border-t-[12px] border-x-transparent border-t-slate-300"
                  aria-hidden
                />
                <span className="absolute inset-0 rounded-full border border-white/30" aria-hidden />
                <span className="relative z-[1] text-xs font-extrabold tracking-wide text-rose-400">
                  N
                </span>
              </span>
            </button>
          ) : null}
          {!mapReady && googleMapsKey && !loadError ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-200/80 text-sm font-semibold text-slate-600 dark:bg-slate-900/80 dark:text-slate-300">
              Loading map…
            </div>
          ) : null}
          {loadError ? (
            <div className="absolute bottom-3 left-3 right-3 rounded-lg border border-amber-200 bg-amber-50/95 px-3 py-2 text-xs font-semibold text-amber-900">
              {loadError}
            </div>
          ) : null}
        </section>


        <aside className="col-span-2 min-h-0 space-y-3 overflow-y-auto overscroll-contain border-t border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900 lg:col-span-1 lg:border-l lg:border-t-0">

          <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-3 dark:border-blue-900/40 dark:bg-blue-950/30">
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-blue-700 dark:text-blue-300">Plant capacity</p>
            <p className="mt-1 text-[10px] leading-relaxed text-blue-900/80 dark:text-blue-100/80">
              Project se target aata hai — yahan badha/ghata sakte ho. Max = roof minus obstructions.
            </p>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setPackMode("target_kw")}
                className={`rounded-lg border px-2 py-2 text-[11px] font-semibold ${
                  packMode === "target_kw"
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-slate-950"
                }`}
              >
                Target kW
              </button>
              <button
                type="button"
                onClick={() => setPackMode("fill_max")}
                className={`rounded-lg border px-2 py-2 text-[11px] font-semibold ${
                  packMode === "fill_max"
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-slate-950"
                }`}
              >
                Fill max
              </button>
            </div>
            <label className="mt-2 block text-[11px] font-bold text-slate-700 dark:text-slate-200">
              Target plant size (kW)
              <input
                type="number"
                min={0.5}
                max={500}
                step={0.1}
                value={targetKw}
                disabled={packMode !== "target_kw"}
                onChange={(event) => {
                  setTargetKw(Math.max(0.5, Number(event.target.value) || 0.5));
                  setPanelDirty(true);
                }}
                className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs disabled:opacity-50 dark:border-white/10 dark:bg-slate-950"
              />
            </label>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              <div className="rounded-lg bg-white/90 p-1.5 dark:bg-slate-950/80">
                <p className="text-[9px] font-bold uppercase text-slate-400">Placed</p>
                <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                  {placedPanels.length
                    ? ((placedPanels.length * panelSpec.wattage) / 1000).toFixed(2)
                    : "—"}
                </p>
              </div>
              <div className="rounded-lg bg-white/90 p-1.5 dark:bg-slate-950/80">
                <p className="text-[9px] font-bold uppercase text-slate-400">Target</p>
                <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                  {packMode === "target_kw" ? targetKw.toFixed(2) : "—"}
                </p>
              </div>
              <div className="rounded-lg bg-white/90 p-1.5 dark:bg-slate-950/80">
                <p className="text-[9px] font-bold uppercase text-slate-400">Max</p>
                <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                  {maxCapacity.maxDcCapacityKw > 0 ? maxCapacity.maxDcCapacityKw.toFixed(2) : "—"}
                </p>
              </div>
            </div>
            {packMode === "target_kw" &&
            maxCapacity.maxDcCapacityKw > 0 &&
            targetKw > maxCapacity.maxDcCapacityKw + 0.01 ? (
              <p className="mt-2 rounded-md bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-900">
                Target ({targetKw} kW) roof max (~{maxCapacity.maxDcCapacityKw.toFixed(2)} kW) se zyada hai.
              </p>
            ) : null}
            <p className="mt-1 text-[10px] text-slate-500">
              Max ~{maxCapacity.maxPanelCount || 0} panels with current module / setback / keep-outs.
            </p>
          </div>


          <div>
            <p className="text-xs font-extrabold text-slate-900 dark:text-white">Site controls</p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
              Search the site, zoom to the roof, then use the polygon tool on the map.
            </p>
          </div>
          <div className="flex gap-1.5">
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void searchLocation();
              }}
              placeholder="Address, city or PIN"
              className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2.5 py-2 text-xs dark:border-white/10 dark:bg-slate-950"
            />
            <Button
              variant="outline"
              size="sm"
              disabled={searching || !googleMapsKey || !mapReady}
              onClick={() => void searchLocation()}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" className="w-full justify-start" onClick={locateMe}>
            <LocateFixed className="mr-2 h-4 w-4" /> Use current GPS
          </Button>

          <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-2.5 dark:border-white/10 dark:bg-white/[0.03]">
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
              Client GPS (office)
            </p>
            <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
              Paste Lat/Long from GPS Map Camera, or upload the original photo (WhatsApp may strip GPS).
            </p>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              <input
                value={latInput}
                onChange={(e) => setLatInput(e.target.value)}
                placeholder="Lat 24.576"
                inputMode="decimal"
                className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs dark:border-white/10 dark:bg-slate-950"
                aria-label="Latitude"
              />
              <input
                value={lngInput}
                onChange={(e) => setLngInput(e.target.value)}
                placeholder="Long 80.836"
                inputMode="decimal"
                className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs dark:border-white/10 dark:bg-slate-950"
                aria-label="Longitude"
              />
            </div>
            <textarea
              value={gpsPaste}
              onChange={(e) => setGpsPaste(e.target.value)}
              placeholder="Or paste: Lat 24.576354, Long 80.836641"
              rows={2}
              className="mt-1.5 w-full resize-none rounded-lg border border-slate-200 px-2 py-1.5 text-[11px] dark:border-white/10 dark:bg-slate-950"
            />
            <div className="mt-1.5 flex gap-1.5">
              <Button type="button" size="sm" className="flex-1" onClick={goToLatLng}>
                <MapPin className="mr-1 h-3.5 w-3.5" /> Go to location
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={gpsBusy}
                onClick={() => photoInputRef.current?.click()}
                title="Upload GPS Map Camera photo"
              >
                <ImagePlus className="h-4 w-4" />
              </Button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/heic"
                className="hidden"
                onChange={(e) => void onGpsPhotoSelected(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>

          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300">
            Roof type
            <select
              value={roofType}
              onChange={(event) => setRoofType(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs dark:border-white/10 dark:bg-slate-950"
            >
              {ROOF_TYPES.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <div className="border-t border-slate-100 pt-3 dark:border-white/10">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
                Roof sections
              </p>
              <span className="text-[10px] font-bold text-slate-400">
                {roofSections.length}
              </span>
            </div>
            {roofSections.length > 0 && !drawingRoof ? (
              <div className="mt-2 flex flex-wrap gap-1">
                {roofSections.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => selectRoofSection(index)}
                    className={`rounded-md border px-2 py-1 text-[10px] font-bold ${
                      activeRoofIndex === index
                        ? "border-teal-600 bg-teal-50 text-teal-800"
                        : "border-slate-200 text-slate-500"
                    }`}
                  >
                    Section {index + 1}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="mt-2 grid grid-cols-2 gap-2">
              {drawingRoof ? (
                <>
                  <Button size="sm" onClick={finishRoofDrawing} disabled={drawingPointCount < 3}>
                    <TriangleRight className="mr-1 h-4 w-4" />
                    Finish ({drawingPointCount})
                  </Button>
                  <Button variant="outline" size="sm" onClick={cancelRoofDrawing}>
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  {state.roof ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => beginRoofDrawing("replace")}
                      >
                        <TriangleRight className="mr-1 h-4 w-4" />
                        Redraw selected
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => beginRoofDrawing("add")}
                      >
                        + Add section
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="col-span-2 text-red-600"
                        onClick={clearRoof}
                      >
                        <Trash2 className="mr-1 h-4 w-4" /> Delete selected section
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="col-span-2"
                      onClick={() => beginRoofDrawing("add")}
                    >
                      <TriangleRight className="mr-1 h-4 w-4" />
                      Draw first roof section
                    </Button>
                  )}
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                className="col-span-2"
                onClick={toggleRoofLock}
                disabled={!state.roof || drawingRoof}
              >
                {roofLocked ? (
                  <><Lock className="mr-1 h-4 w-4" /> Unlock to edit corners</>
                ) : (
                  <><Unlock className="mr-1 h-4 w-4" /> Lock roof (under panels)</>
                )}
              </Button>
              <Button variant="outline" size="sm" disabled={!canUndo} onClick={undoStudio}>
                <Undo2 className="mr-1 h-4 w-4" /> Undo
              </Button>
              <Button variant="outline" size="sm" disabled={!canRedo} onClick={redoStudio}>
                <Redo2 className="mr-1 h-4 w-4" /> Redo
              </Button>
            </div>
            {drawingRoof ? (
              <p className="mt-2 rounded-lg bg-rose-50 px-2 py-1.5 text-[10px] font-semibold text-rose-800">
                Click each corner — dashed line follows. Finish: click the first dot, double-click,
                right-click, or Enter. Right-click a dot removes it. Esc cancels. Ctrl+Z undoes roof or panel edits.
              </p>
            ) : state.roof ? (
              <p className="mt-2 text-[10px] font-semibold text-slate-500">
                {roofLocked
                  ? `Section ${activeRoofIndex + 1} locked under panels — Select / Group move panels freely.`
                  : `Editing section ${activeRoofIndex + 1} corners. Lock roof before moving panels.`}
              </p>
            ) : placedPanels.length > 0 ? (
              <p className="mt-2 rounded-lg bg-amber-50 px-2 py-1.5 text-[10px] font-semibold text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                No roof — {placedPanels.length} panel(s) still on map. Use Select / Group move, or draw a new roof.
              </p>
            ) : null}
          </div>

          <div className="border-t border-slate-100 pt-3 dark:border-white/10">
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">Place obstruction</p>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {(Object.keys(OBSTRUCTION_LABELS) as ObstructionType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  disabled={drawingRoof}
                  onClick={() => beginObstruction(type)}
                  className={`rounded-lg border px-2 py-2 text-left text-[11px] font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
                    pendingObstruction === type
                      ? "border-amber-500 bg-amber-50 text-amber-900"
                      : "border-slate-200 text-slate-600 dark:border-white/10 dark:text-slate-300"
                  }`}
                >
                  {OBSTRUCTION_LABELS[type]}
                </button>
              ))}
            </div>
            {pendingObstruction ? (
              <p className="mt-2 text-[11px] font-semibold text-amber-700">Click its spot on the map — inside or outside the roof.</p>
            ) : (
              <p className="mt-2 text-[10px] text-slate-500">Tip: drag any placed marker to fine-tune its position.</p>
            )}
          </div>

          <div className="border-t border-slate-100 pt-3 dark:border-white/10">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
                Panel layout
              </p>
              <Grid2X2 className="h-3.5 w-3.5 text-slate-400" />
            </div>
            <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
              Built-in + org catalog (More → Panel catalog). Shared for all users — not browser-only.
            </p>
            <label className="mt-2 block text-[11px] font-bold text-slate-600 dark:text-slate-300">
              Brand
              <select
                value={panelSpec.manufacturer?.trim() || "Generic"}
                onChange={(event) => {
                  const brand = event.target.value;
                  const options = panelModulesForBrand(brand, moduleCatalog);
                  const next =
                    options.find((item) => item.wattage === panelSpec.wattage) ??
                    options[0] ??
                    DEFAULT_PANEL_MODULE;
                  setPanelSpec(next);
                  setPanelDirty(true);
                }}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs dark:border-white/10 dark:bg-slate-950"
              >
                {panelModuleBrands(moduleCatalog).map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-2 block text-[11px] font-bold text-slate-600 dark:text-slate-300">
              Watt
              <select
                value={panelSpec.catalog_id ?? panelSpec.model}
                onChange={(event) => {
                  const brand = panelSpec.manufacturer?.trim() || "Generic";
                  const next =
                    panelModulesForBrand(brand, moduleCatalog).find(
                      (item) => (item.catalog_id ?? item.model) === event.target.value
                    ) ??
                    moduleCatalog.find((item) => item.catalog_id === event.target.value) ??
                    DEFAULT_PANEL_MODULE;
                  setPanelSpec(next);
                  setPanelDirty(true);
                }}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs dark:border-white/10 dark:bg-slate-950"
              >
                {panelModulesForBrand(panelSpec.manufacturer?.trim() || "Generic", moduleCatalog).map(
                  (item) => (
                    <option key={item.catalog_id ?? item.model} value={item.catalog_id ?? item.model}>
                      {item.wattage}W
                      {item.catalog_id?.startsWith("org-")
                        ? " · org"
                        : item.catalog_id?.startsWith("custom-")
                          ? " · local"
                          : ""}
                    </option>
                  )
                )}
              </select>
            </label>
            <p className="mt-1 text-[10px] text-slate-500">
              Frame {panelSpec.width_mm} × {panelSpec.height_mm} mm
            </p>
            <a
              href="/more#more-section-panel-catalog"
              className="mt-1.5 inline-block text-[11px] font-bold text-blue-700 hover:underline"
            >
              Manage catalog in More → Panel catalog
            </a>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {(["portrait", "landscape"] as const).map((orientation) => (
                <button
                  key={orientation}
                  type="button"
                  disabled={packing}
                  onClick={() => applyPanelOrientation(orientation)}
                  className={`rounded-lg border px-2 py-2 text-[11px] font-semibold capitalize disabled:opacity-50 ${
                    panelOrientation === orientation
                      ? "border-blue-600 bg-blue-50 text-blue-900"
                      : "border-slate-200 text-slate-600 dark:border-white/10"
                  }`}
                >
                  {orientation}
                </button>
              ))}
            </div>
            {azimuthAdvice && panelOrientation !== azimuthAdvice.suggestedOrientation ? (
              <button
                type="button"
                className="mt-1.5 text-[11px] font-bold text-blue-700 hover:underline disabled:opacity-50"
                disabled={packing}
                onClick={() => applyPanelOrientation(azimuthAdvice.suggestedOrientation)}
              >
                Use suggested {azimuthAdvice.suggestedOrientation}
              </button>
            ) : null}
            <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-sky-200/80 bg-sky-50 px-2.5 py-2 dark:border-sky-500/30 dark:bg-sky-950/40">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-sky-700/80 dark:text-sky-300/80">
                  {panelRotationSummary?.scope === "selection" ? "Selected rotation" : "Plant rotation"}
                </p>
                <p className="text-sm font-extrabold tabular-nums text-sky-950 dark:text-sky-50">
                  {panelRotationSummary?.label ?? "—"}
                </p>
              </div>
              <p className="max-w-[10rem] text-right text-[10px] leading-snug text-sky-800/80 dark:text-sky-200/70">
                {panelRotationSummary?.detail ?? "Select panels, then use west / east rotate (±5°)."}
              </p>
            </div>
            <label className="mt-2 block text-[11px] font-bold text-slate-600 dark:text-slate-300">
              Mounting
              <select
                value={mountingType}
                onChange={(event) => {
                  const next = event.target.value as PanelMountingType;
                  setMountingType(next);
                  setPanelDirty(true);
                  if (placedPanels.length > 0 && state.roof) {
                    runAutoLayout({ mountingType: next, quiet: true });
                  }
                }}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs dark:border-white/10 dark:bg-slate-950"
              >
                <option value="flush">Flush (roof-parallel)</option>
                <option value="elevated">Elevated / MMS</option>
                <option value="ground_mount">Ground mount</option>
              </select>
            </label>
            <p className="mt-1 text-[10px] text-slate-500">
              Row pitch {rowPitchM.toFixed(2)} m
              {mountingType === "flush"
                ? " (module + gap)"
                : " (winter shade clearance from tilt + lat)"}
              . Elevated packing uses this spacing.
            </p>
            <label className="mt-2 block text-[11px] font-bold text-slate-600 dark:text-slate-300">
              Panel tilt (°)
              <input
                type="number"
                min={0}
                max={60}
                step={1}
                value={panelTiltDeg}
                onChange={(event) => {
                  const next = Math.max(0, Math.min(60, Math.round(Number(event.target.value) || 0)));
                  setPanelTiltDeg(next);
                  setTiltManual(true);
                  setPanelDirty(true);
                }}
                className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs dark:border-white/10 dark:bg-slate-950"
              />
            </label>
            {(() => {
              const suggested = recommendedTiltFromLatitude(center[1]);
              const latLabel = center[1].toFixed(1);
              return (
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p className="text-[10px] text-slate-500">
                    Suggested {suggested}° from site ({latLabel}°N) — lat − 5°, clamped 10–30°.
                    {tiltManual ? " Manual override on." : ""}
                  </p>
                  {tiltManual && panelTiltDeg !== suggested ? (
                    <button
                      type="button"
                      className="text-[11px] font-bold text-blue-700 hover:underline"
                      onClick={() => {
                        setPanelTiltDeg(suggested);
                        setTiltManual(false);
                        setPanelDirty(true);
                      }}
                    >
                      Use suggested
                    </button>
                  ) : null}
                </div>
              );
            })()}
            <label className="mt-2 block text-[11px] font-bold text-slate-600 dark:text-slate-300">
              Edge setback (ft)
              <input
                type="number"
                min={0}
                max={20}
                step={0.5}
                value={panelSetbackFt}
                onChange={(event) => {
                  setPanelSetbackFt(Math.max(0, Number(event.target.value) || 0));
                  setPanelDirty(true);
                }}
                className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs dark:border-white/10 dark:bg-slate-950"
              />
            </label>
            <p className="mt-1 text-[10px] text-slate-500">
              Roof edge se itna gap. 0–1.5 ft typical. Zyada setback = kam panels.
            </p>
            <Button
              className="mt-2 w-full"
              size="sm"
              disabled={!state.roof || drawingRoof || packing}
              onClick={() => runAutoLayout()}
            >
              {packing
                ? "Placing panels…"
                : packMode === "target_kw"
                  ? `Auto layout — ${targetKw} kW target`
                  : "Auto layout — fill max"}
            </Button>
            <Button
              variant={studioTool === "place_panel" ? "default" : "outline"}
              size="sm"
              className="mt-1.5 w-full"
              disabled={!state.roof || drawingRoof}
              onClick={() => setActiveStudioTool("place_panel")}
            >
              <Square className="mr-1 h-3.5 w-3.5" />
              {studioTool === "place_panel" ? "Placing… click map (Esc / click again cancel)" : "Manual place — click map"}
            </Button>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={selectedPanelIds.length === 0}
                onClick={toggleSelectedPanelLock}
              >
                {selectedPanelIds.length > 0 &&
                selectedPanelIds.every(
                  (id) => placedPanels.find((panel) => panel.id === id)?.is_locked
                ) ? (
                  <><Unlock className="mr-1 h-3.5 w-3.5" /> Unlock</>
                ) : (
                  <><Lock className="mr-1 h-3.5 w-3.5" /> Lock</>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={selectedPanelIds.length === 0}
                onClick={duplicateSelectedPanels}
              >
                <Copy className="mr-1 h-3.5 w-3.5" /> Duplicate
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600"
                disabled={selectedPanelIds.length === 0}
                onClick={deleteSelectedPanel}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={placedPanels.length === 0}
                onClick={clearPanels}
              >
                Clear all
              </Button>
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
              Panel pe click = select. Bahar click = deselect. Duplicate = copy selected (thoda offset). Shift+click = multi. Magnet = snap.
            </p>
          </div>


          <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900">
            <p className="text-xs font-extrabold text-slate-900 dark:text-white">Live geometry</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                ["Total roof area", displayedMetrics ? `${Math.round(displayedMetrics.areaSqft).toLocaleString("en-IN")} sq.ft` : "—"],
                ["Selected section", selectedRoofMetrics ? `${Math.round(selectedRoofMetrics.areaSqft).toLocaleString("en-IN")} sq.ft` : "—"],
                ["Perimeter", displayedMetrics ? `${displayedMetrics.perimeterM.toFixed(1)} m` : "—"],
                ["Selected azimuth", selectedRoofMetrics?.azimuthDeg != null ? `${selectedRoofMetrics.azimuthDeg.toFixed(0)}°` : "—"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-slate-50 p-2 dark:bg-white/[0.04]">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
                  <p className="mt-0.5 text-sm font-extrabold text-slate-900 dark:text-white">{value}</p>
                </div>
              ))}
            </div>
            {areaWarning ? (
              <p className="mt-2 rounded-lg bg-amber-50 px-2 py-1.5 text-[10px] font-semibold text-amber-800">
                {areaWarning}
              </p>
            ) : null}
            {azimuthAdvice ? (
              <div
                className={`mt-2 rounded-lg px-2 py-1.5 text-[10px] font-semibold ${
                  azimuthAdvice.grade === "excellent" || azimuthAdvice.grade === "good"
                    ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
                    : azimuthAdvice.grade === "fair"
                      ? "bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
                      : "bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-100"
                }`}
              >
                <p>{azimuthAdvice.summary}</p>
                <p className="mt-0.5 font-medium opacity-90">{azimuthAdvice.orientationHint}</p>
              </div>
            ) : (
              <p className="mt-2 text-[10px] text-slate-500">
                Draw a roof to get azimuth / south-facing advice.
              </p>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900">
            <p className="text-xs font-extrabold text-slate-900 dark:text-white">Panel metrics</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                ["Panels", String(placedPanels.length)],
                ["DC kW", placedPanels.length ? dcKwLive.toFixed(2) : "—"],
                ["Remaining", placedPanels.length ? `${Math.round(panelMetrics.remainingAreaSqft).toLocaleString("en-IN")} sq.ft` : "—"],
                ["Coverage", placedPanels.length ? `${panelMetrics.coveragePct.toFixed(0)}%` : "—"],
                [
                  "Yield / yr",
                  yieldEstimate ? `${yieldEstimate.annualKwh.toLocaleString("en-IN")} kWh` : "—",
                ],
                [
                  "kWh/kWp",
                  yieldEstimate ? String(yieldEstimate.specificYieldKwhPerKwp) : "—",
                ],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-slate-50 p-2 dark:bg-white/[0.04]">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
                  <p className="mt-0.5 text-sm font-extrabold text-slate-900 dark:text-white">{value}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-slate-500">
              {panelModuleLabel(panelSpec)} · {panelOrientation} · tilt {panelTiltDeg}° · {mountingType}
            </p>
            {yieldEstimate ? (
              <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
                ~{yieldEstimate.dailyKwh} kWh/day · {yieldEstimate.note}
              </p>
            ) : null}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <p className="text-xs font-extrabold text-slate-900 dark:text-white">Obstructions</p>
              <span className="text-[11px] font-bold text-slate-400">{state.obstructions.length}</span>
            </div>
            <div className="mt-2 space-y-2">
              {state.obstructions.length === 0 ? (
                <p className="text-[11px] leading-relaxed text-slate-500">Add tanks, trees or chimneys from the left toolbar.</p>
              ) : (
                state.obstructions.map((obstruction) => (
                  <button
                    key={obstruction.id}
                    type="button"
                    onClick={() => dispatch({ type: "SELECT_OBSTRUCTION", id: obstruction.id })}
                    className={`w-full rounded-lg border p-2 text-left ${
                      state.selectedObstructionId === obstruction.id
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                        : "border-slate-200 dark:border-white/10"
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{OBSTRUCTION_LABELS[obstruction.type]}</span>
                    <span className="ml-2 text-[10px] text-slate-500">{obstruction.height_ft} ft</span>
                  </button>
                ))
              )}
            </div>
            {selectedObstruction ? (
              <div className="mt-3 border-t border-slate-100 pt-3 dark:border-white/10">
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Height (ft)
                    <input
                      type="number"
                      min={0}
                      max={500}
                      value={selectedObstruction.height_ft}
                      onChange={(event) =>
                        dispatch({
                          type: "UPDATE_OBSTRUCTION",
                          obstruction: {
                            ...selectedObstruction,
                            height_ft: Math.max(0, Number(event.target.value) || 0),
                          },
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs dark:border-white/10 dark:bg-slate-950"
                    />
                  </label>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Radius (ft)
                    <input
                      type="number"
                      min={MIN_OBSTRUCTION_RADIUS_FT[selectedObstruction.type]}
                      max={500}
                      step={0.5}
                      value={effectiveObstructionRadiusFt(selectedObstruction)}
                      onChange={(event) =>
                        dispatch({
                          type: "UPDATE_OBSTRUCTION",
                          obstruction: {
                            ...selectedObstruction,
                            radius_ft: Math.max(
                              MIN_OBSTRUCTION_RADIUS_FT[selectedObstruction.type],
                              Number(event.target.value) || 0
                            ),
                          },
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs dark:border-white/10 dark:bg-slate-950"
                    />
                  </label>
                </div>
                <p className="mt-1 text-[10px] text-slate-500">
                  Keep-out circle on the map. Water tank min ~3.5 ft so Auto layout can avoid it.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full text-red-600"
                  onClick={() => dispatch({ type: "DELETE_OBSTRUCTION", id: selectedObstruction.id })}
                >
                  <Trash2 className="mr-1 h-4 w-4" /> Remove obstruction
                </Button>
              </div>
            ) : null}
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-[11px] leading-relaxed text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-100">
            <div className="flex items-center gap-1.5 font-extrabold">
              <Crosshair className="h-4 w-4" /> Phase 2
            </div>
            <p className="mt-1">
              Draw roof sections, then run Auto layout. Panels stay on the project design — not inside the customer proposal.
            </p>
          </div>

          <div className="rounded-xl border border-dashed border-slate-200 p-3 dark:border-white/10">
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">Shadow (Phase 4)</p>
            <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
              Shade analysis slot — coming after panel layout is stable. Design stays separate from proposal.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
