"use client";

import {
  ArrowLeft,
  Cloud,
  Crosshair,
  Grid2X2,
  ImagePlus,
  LocateFixed,
  Lock,
  MapPin,
  Redo2,
  Save,
  Search,
  Trash2,
  TriangleRight,
  Undo2,
  Unlock,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-center";
import {
  extractGpsFromImageFile,
  parseLatLngText,
  parseSeparateLatLng,
} from "@/lib/site-layout-gps";
import { loadGoogleMaps } from "@/lib/google-maps-loader";
import {
  DEFAULT_PANEL_MODULE,
  PANEL_MODULE_CATALOG,
  panelModuleBrands,
  panelModuleLabel,
  panelModulesForBrand,
} from "@/lib/panel-module-catalog";
import type {
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
  effectiveObstructionRadiusFt,
  MIN_OBSTRUCTION_RADIUS_FT,
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
};

type SurveySummary = {
  id: string;
  gps_lat: number | null;
  gps_lng: number | null;
  roof_type: string | null;
};

type ObstructionType = SiteObstruction["type"];

const DEFAULT_CENTER: [number, number] = [78.9629, 20.5937];

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
  const markersRef = useRef<google.maps.Marker[]>([]);
  const circlesRef = useRef<google.maps.Circle[]>([]);
  const panelPolygonsRef = useRef<google.maps.Polygon[]>([]);
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
  const activeRoofIndexRef = useRef(0);
  const drawingModeRef = useRef<"add" | "replace">("add");
  const applyingHistoryRef = useRef(false);
  const roofLockedRef = useRef(true);
  /** Shared click handler so clicks on the roof polygon also place obstructions / add points. */
  const studioClickRef = useRef<((latLng: google.maps.LatLng) => void) | null>(null);
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
  const [panelSpec, setPanelSpec] = useState<PanelSpec>(DEFAULT_PANEL_MODULE);
  const [panelOrientation, setPanelOrientation] = useState<Exclude<PanelOrientation, "east_west">>("portrait");
  const [panelSetbackFt, setPanelSetbackFt] = useState(1.5);
  const [placedPanels, setPlacedPanels] = useState<PlacedPanel[]>([]);
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);
  const [panelMetrics, setPanelMetrics] = useState({
    remainingAreaSqft: 0,
    coveragePct: 0,
  });
  const [panelDirty, setPanelDirty] = useState(false);
  const [packing, setPacking] = useState(false);
  const [currentPanelLayout, setCurrentPanelLayout] = useState<ProjectPanelLayout | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const googleMapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "";

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [projectRes, surveyRes, layoutRes, panelRes] = await Promise.all([
          fetch(`/api/projects/${projectId}`, { cache: "no-store" }),
          fetch(`/api/projects/${projectId}/survey`, { cache: "no-store" }),
          fetch(`/api/projects/${projectId}/site-layout`, { cache: "no-store" }),
          fetch(`/api/projects/${projectId}/panel-layout`, { cache: "no-store" }),
        ]);
        const projectJson = (await projectRes.json()) as ApiEnvelope<ProjectSummary>;
        const surveyJson = (await surveyRes.json()) as ApiEnvelope<SurveySummary | null>;
        const layoutJson = (await layoutRes.json()) as ApiEnvelope<ProjectSiteLayout | null>;
        const panelJson = (await panelRes.json()) as ApiEnvelope<ProjectPanelLayout | null>;
        if (cancelled) return;
        if (!projectJson.ok || !projectJson.data) {
          throw new Error(projectJson.error || "Project could not be loaded.");
        }

        setProject(projectJson.data);
        const surveyData = surveyJson.ok ? surveyJson.data ?? null : null;
        setSurvey(surveyData);
        setRoofType(surveyData?.roof_type || projectJson.data.roof_type || "");

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
          setPlacedPanels(savedPanel.panels_geojson);
          setPanelMetrics({
            remainingAreaSqft: savedPanel.remaining_area_sqft,
            coveragePct: savedPanel.coverage_pct,
          });
          setPanelDirty(false);
        } else if (draft?.panels?.length) {
          if (draft.panel_spec) setPanelSpec(draft.panel_spec);
          if (draft.panel_orientation === "landscape" || draft.panel_orientation === "portrait") {
            setPanelOrientation(draft.panel_orientation);
          }
          if (typeof draft.panel_setback_ft === "number") setPanelSetbackFt(draft.panel_setback_ft);
          setPlacedPanels(draft.panels);
          setPanelMetrics({
            remainingAreaSqft: draft.panel_remaining_area_sqft ?? 0,
            coveragePct: draft.panel_coverage_pct ?? 0,
          });
          setPanelDirty(true);
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
      strokeOpacity: 1,
      strokeColor: "#f43f5e",
      scale: 3,
    };
    const linePath = points.length >= 3 ? [...points, points[0]] : points;
    if (draftLineRef.current) {
      draftLineRef.current.setPath(linePath);
    } else {
      draftLineRef.current = new google.maps.Polyline({
        map,
        path: linePath,
        clickable: false,
        strokeOpacity: 0,
        icons: [{ icon: dashSymbol, offset: "0", repeat: "14px" }],
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
          scale: index === 0 ? 4.5 : 3,
          fillColor: index === 0 ? "#f43f5e" : "#ffffff",
          fillOpacity: 1,
          strokeColor: "#f43f5e",
          strokeWeight: 1.5,
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
      polygon.setOptions({
        editable: selected && !roofLockedRef.current,
        strokeColor: selected ? "#0f766e" : "#0369a1",
        strokeWeight: selected ? 3 : 2,
        fillColor: selected ? "#14b8a6" : "#38bdf8",
        fillOpacity: selected ? 0.24 : 0.12,
        zIndex: selected ? 2 : 1,
      });
    });
  }, []);

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
        const polygon = new google.maps.Polygon({
          map,
          paths: path,
          editable: selected && !roofLockedRef.current,
          draggable: false,
          strokeColor: selected ? "#0f766e" : "#0369a1",
          strokeOpacity: 1,
          strokeWeight: selected ? 3 : 2,
          fillColor: selected ? "#14b8a6" : "#38bdf8",
          fillOpacity: selected ? 0.24 : 0.12,
          zIndex: selected ? 2 : 1,
        });
        attachRoofListeners(polygon, index);
        return polygon;
      });
      roofPolygonRef.current = roofPolygonsRef.current[selectedIndex] ?? null;
    },
    [attachRoofListeners, removeRoofListeners]
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
          zoom: initialCenterRef.current[0] === DEFAULT_CENTER[0] ? 5 : 20,
          mapTypeId: maps.MapTypeId.HYBRID,
          tilt: 0,
          streetViewControl: false,
          fullscreenControl: true,
          mapTypeControl: true,
          mapTypeControlOptions: {
            mapTypeIds: [maps.MapTypeId.SATELLITE, maps.MapTypeId.HYBRID],
          },
          gestureHandling: "greedy",
          clickableIcons: false,
        });
        mapRef.current = map;

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
          const isDrawing = map.get("sol52DrawingRoof") === true;
          if (!isDrawing) return;
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
          })
        );

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
    if (!mapReady || !mapRef.current || !window.google?.maps) return;
    panelListenersRef.current.forEach((listener) => listener.remove());
    panelListenersRef.current = [];
    panelPolygonsRef.current.forEach((polygon) => polygon.setMap(null));
    panelPolygonsRef.current = placedPanels.map((panel) => {
      const selected = panel.id === selectedPanelId;
      const path = panel.footprint_geojson.coordinates[0]
        .slice(0, -1)
        .map(([lng, lat]) => ({ lat, lng }));
      const polygon = new google.maps.Polygon({
        map: mapRef.current!,
        paths: path,
        clickable: true,
        editable: false,
        draggable: false,
        strokeColor: selected ? "#1d4ed8" : panel.is_locked ? "#a16207" : "#1e3a8a",
        strokeOpacity: 1,
        strokeWeight: selected ? 2.5 : 1.5,
        fillColor: selected ? "#3b82f6" : panel.is_locked ? "#f59e0b" : "#2563eb",
        fillOpacity: selected ? 0.55 : 0.4,
        zIndex: selected ? 8 : 6,
      });
      panelListenersRef.current.push(
        google.maps.event.addListener(polygon, "click", () => {
          setSelectedPanelId(panel.id);
        })
      );
      return polygon;
    });
  }, [mapReady, placedPanels, selectedPanelId]);

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
  const areaWarning = displayedMetrics
    ? displayedMetrics.areaSqft < 100
      ? "Roof area is very small — zoom in and check the corners."
      : displayedMetrics.areaSqft > 50_000
        ? "Roof area looks too large — verify the polygon corners."
        : null
    : null;
  const canUndo = drawingRoof
    ? drawingPointCount > 0
    : historyVersion >= 0 && undoStackRef.current.length > 0;
  const canRedo = drawingRoof
    ? drawingRedoRef.current.length > 0
    : historyVersion >= 0 && redoStackRef.current.length > 0;

  const beginObstruction = useCallback((type: ObstructionType) => {
    mapRef.current?.set("sol52DrawingRoof", false);
    setDrawingRoof(false);
    addObstructionRef.current = type;
    setPendingObstruction(type);
    mapRef.current?.getDiv().focus();
  }, []);

  const beginRoofDrawing = useCallback((mode: "add" | "replace") => {
    if (!mapRef.current) return;
    drawingModeRef.current = mode;
    addObstructionRef.current = null;
    setPendingObstruction(null);
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

    roofLockedRef.current = false;
    setRoofLocked(false);
    commitRoof(roof);
    renderRoofGeometry(roof);
    drawingPointsRef.current = [];
    drawingRedoRef.current = [];
    setDrawingPointCount(0);
    setDrawingMetrics(null);
    setDrawingRoof(false);
    map.set("sol52DrawingRoof", false);
    map.setOptions({ draggableCursor: null, disableDoubleClickZoom: false });
    toast.success("Roof completed", "Adjust corners if needed, then lock the roof.");
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
  }, [clearDraftOverlay, commitRoof, renderRoofGeometry]);

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
        }
        return;
      }
      const isModifier = event.ctrlKey || event.metaKey;
      if (isModifier && !event.shiftKey && event.key.toLowerCase() === "z") {
        event.preventDefault();
        undoRoof();
        return;
      }
      if (
        isModifier &&
        (event.key.toLowerCase() === "y" ||
          (event.shiftKey && event.key.toLowerCase() === "z"))
      ) {
        event.preventDefault();
        redoRoof();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [cancelRoofDrawing, drawingRoof, finishRoofDrawing, pendingObstruction, redoRoof, undoRoof]);

  const toggleRoofLock = useCallback(() => {
    if (!roofPolygonRef.current) return;
    const nextLocked = !roofLockedRef.current;
    roofLockedRef.current = nextLocked;
    setRoofLocked(nextLocked);
    roofPolygonsRef.current.forEach((polygon) => polygon.setEditable(false));
    if (!nextLocked) selectRoofSection(activeRoofIndexRef.current);
    toast.success(
      nextLocked ? "Roof locked" : "Roof unlocked",
      nextLocked
        ? "Corners are protected from accidental changes."
        : "Drag the corner handles to refine the roof."
    );
  }, [selectRoofSection, toast]);

  const locateMe = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Location unavailable", "This browser does not provide GPS.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const next: [number, number] = [coords.longitude, coords.latitude];
        setCenter(next);
        mapRef.current?.panTo({ lat: coords.latitude, lng: coords.longitude });
        mapRef.current?.setZoom(20);
      },
      (error) => toast.error("GPS failed", error.message),
      { enableHighAccuracy: true, timeout: 15_000 }
    );
  }, [toast]);

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

  const runAutoLayout = useCallback(() => {
    if (!state.roof) {
      toast.error("Draw roof first", "Complete at least one roof section before auto layout.");
      return;
    }
    setPacking(true);
    try {
      // Only keep locked panels; unlocked are cleared and re-packed (avoids old overlap on tanks).
      const lockedPanels = placedPanels.filter((panel) => panel.is_locked);
      const result = autoPackPanels({
        roof: state.roof,
        obstructions: state.obstructions,
        panelSpec,
        orientation: panelOrientation,
        setbackFt: panelSetbackFt,
        mountingType: "flush",
        tiltDeg: 0,
        obstructionClearanceFt: 1.5,
        preservePanels: lockedPanels,
      });
      setPlacedPanels(result.panels);
      setPanelMetrics({
        remainingAreaSqft: result.remainingAreaSqft,
        coveragePct: result.coveragePct,
      });
      setSelectedPanelId(null);
      setPanelDirty(true);
      if (result.panelCount === 0) {
        toast.error(
          "No panels fit",
          "Roof too small for this module, or setback is high. Try setback 0–1 ft, or Landscape."
        );
      } else {
        toast.success(
          "Panels placed",
          `${result.panelCount} panels · ${result.dcCapacityKw.toFixed(2)} kW DC`
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
  }, [
    panelOrientation,
    panelSetbackFt,
    panelSpec,
    placedPanels,
    state.obstructions,
    state.roof,
    toast,
  ]);

  const clearPanels = useCallback(() => {
    setPlacedPanels([]);
    setSelectedPanelId(null);
    setPanelMetrics({ remainingAreaSqft: 0, coveragePct: 0 });
    setPanelDirty(true);
  }, []);

  const deleteSelectedPanel = useCallback(() => {
    if (!selectedPanelId) return;
    setPlacedPanels((current) => {
      const next = current.filter((panel) => panel.id !== selectedPanelId);
      if (state.roof) {
        setPanelMetrics(computePanelCoverageMetrics(state.roof, next));
      } else {
        setPanelMetrics({ remainingAreaSqft: 0, coveragePct: 0 });
      }
      return next;
    });
    setSelectedPanelId(null);
    setPanelDirty(true);
  }, [selectedPanelId, state.roof]);

  const toggleSelectedPanelLock = useCallback(() => {
    if (!selectedPanelId) return;
    setPlacedPanels((current) =>
      current.map((panel) =>
        panel.id === selectedPanelId ? { ...panel, is_locked: !panel.is_locked } : panel
      )
    );
    setPanelDirty(true);
  }, [selectedPanelId]);

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
            tilt_deg: 0,
            mounting_type: "flush",
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
    return <div className="flex min-h-[70vh] items-center justify-center text-sm text-slate-500">Loading Design Studio…</div>;
  }

  return (
    <main className="flex h-[100dvh] flex-col overflow-hidden bg-slate-100 dark:bg-slate-950">
      <header className="sticky top-0 z-40 shrink-0 border-b border-slate-200 bg-white/95 px-3 py-2 backdrop-blur dark:border-white/10 dark:bg-slate-950/95 sm:px-5">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/projects/${encodeURIComponent(projectId)}?tab=design`}>
                <ArrowLeft className="mr-1 h-4 w-4" /> Project
              </Link>
            </Button>
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold text-slate-900 dark:text-white">
                2D Design Studio · {project?.official_name || project?.lead_name || "Project"}
              </p>
              <p className="text-[11px] text-slate-500">
                Phase 2 Panels · {currentLayout ? `Roof V${currentLayout.version_number}` : "New roof"}
                {currentPanelLayout ? ` · Panels V${currentPanelLayout.version_number}` : ""}
                {state.dirty || panelDirty ? " · Unsaved changes" : ""}
              </p>
            </div>
          </div>
          <Button onClick={() => void saveLayout()} disabled={saving || !state.roof || drawingRoof}>
            <Save className="mr-1.5 h-4 w-4" />
            {saving ? "Saving…" : "Save version"}
          </Button>
        </div>
      </header>

      <div className="mx-auto grid min-h-0 w-full max-w-[1600px] flex-1 gap-3 overflow-hidden p-3 lg:grid-cols-[300px_minmax(0,1fr)_280px] lg:p-4">
        <aside className="min-h-0 space-y-3 overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900">
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
                  <><Unlock className="mr-1 h-4 w-4" /> Unlock to edit corners</>
                ) : (
                  <><Lock className="mr-1 h-4 w-4" /> Lock roof</>
                )}
              </Button>
              <Button variant="outline" size="sm" disabled={!canUndo} onClick={undoRoof}>
                <Undo2 className="mr-1 h-4 w-4" /> Undo
              </Button>
              <Button variant="outline" size="sm" disabled={!canRedo} onClick={redoRoof}>
                <Redo2 className="mr-1 h-4 w-4" /> Redo
              </Button>
            </div>
            {drawingRoof ? (
              <p className="mt-2 rounded-lg bg-rose-50 px-2 py-1.5 text-[10px] font-semibold text-rose-800">
                Click each corner — dashed line follows. Finish: click the first dot, double-click,
                right-click, or Enter. Right-click a dot removes it. Esc cancels, Ctrl+Z undo.
              </p>
            ) : state.roof ? (
              <p className="mt-2 text-[10px] font-semibold text-slate-500">
                {roofLocked
                  ? `Section ${activeRoofIndex + 1} selected. Unlock before editing corners.`
                  : `Editing section ${activeRoofIndex + 1}. Drag handles or right-click a corner to delete it.`}
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
              Brand pehle, uske baad watt. Size packing ke liye watt/dimensions se aata hai. Auto layout water tank / trees avoid karta hai.
            </p>
            <label className="mt-2 block text-[11px] font-bold text-slate-600 dark:text-slate-300">
              Brand
              <select
                value={panelSpec.manufacturer?.trim() || "Generic"}
                onChange={(event) => {
                  const brand = event.target.value;
                  const options = panelModulesForBrand(brand);
                  const next =
                    options.find((item) => item.wattage === panelSpec.wattage) ??
                    options[0] ??
                    DEFAULT_PANEL_MODULE;
                  setPanelSpec(next);
                  setPanelDirty(true);
                }}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs dark:border-white/10 dark:bg-slate-950"
              >
                {panelModuleBrands().map((brand) => (
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
                    panelModulesForBrand(brand).find(
                      (item) => (item.catalog_id ?? item.model) === event.target.value
                    ) ??
                    PANEL_MODULE_CATALOG.find((item) => item.catalog_id === event.target.value) ??
                    DEFAULT_PANEL_MODULE;
                  setPanelSpec(next);
                  setPanelDirty(true);
                }}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs dark:border-white/10 dark:bg-slate-950"
              >
                {panelModulesForBrand(panelSpec.manufacturer?.trim() || "Generic").map((item) => (
                  <option key={item.catalog_id ?? item.model} value={item.catalog_id ?? item.model}>
                    {item.wattage}W
                  </option>
                ))}
              </select>
            </label>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {(["portrait", "landscape"] as const).map((orientation) => (
                <button
                  key={orientation}
                  type="button"
                  onClick={() => {
                    setPanelOrientation(orientation);
                    setPanelDirty(true);
                  }}
                  className={`rounded-lg border px-2 py-2 text-[11px] font-semibold capitalize ${
                    panelOrientation === orientation
                      ? "border-blue-600 bg-blue-50 text-blue-900"
                      : "border-slate-200 text-slate-600 dark:border-white/10"
                  }`}
                >
                  {orientation}
                </button>
              ))}
            </div>
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
              onClick={runAutoLayout}
            >
              {packing ? "Placing panels…" : "Auto layout — place panels"}
            </Button>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={!selectedPanelId}
                onClick={toggleSelectedPanelLock}
              >
                {placedPanels.find((panel) => panel.id === selectedPanelId)?.is_locked ? (
                  <><Unlock className="mr-1 h-3.5 w-3.5" /> Unlock</>
                ) : (
                  <><Lock className="mr-1 h-3.5 w-3.5" /> Lock</>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600"
                disabled={!selectedPanelId}
                onClick={deleteSelectedPanel}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="col-span-2"
                disabled={placedPanels.length === 0}
                onClick={clearPanels}
              >
                Clear all panels
              </Button>
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
              Click a blue panel to select. Locked panels stay on re-run. Design is project-only — not in the proposal.
            </p>
          </div>
        </aside>

        <section className="relative min-h-[50vh] overflow-hidden overscroll-none rounded-xl border border-slate-200 bg-slate-200 dark:border-white/10 dark:bg-slate-900 lg:min-h-0 lg:h-full">
          {googleMapsKey ? (
            <div
              ref={setMapContainerEl}
              className="absolute inset-0 h-full w-full"
            />
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
          {!mapReady && googleMapsKey && !loadError ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-200/80 text-sm font-semibold text-slate-600 dark:bg-slate-900/80 dark:text-slate-300">
              Loading Google satellite map…
            </div>
          ) : null}
          {loadError ? (
            <div className="absolute bottom-3 left-3 right-3 rounded-lg border border-amber-200 bg-amber-50/95 px-3 py-2 text-xs font-semibold text-amber-900">
              {loadError}
            </div>
          ) : null}
        </section>

        <aside className="min-h-0 space-y-3 overflow-y-auto overscroll-contain">
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
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900">
            <p className="text-xs font-extrabold text-slate-900 dark:text-white">Panel metrics</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                ["Panels", String(placedPanels.length)],
                ["DC kW", placedPanels.length ? ((placedPanels.length * panelSpec.wattage) / 1000).toFixed(2) : "—"],
                ["Remaining", placedPanels.length ? `${Math.round(panelMetrics.remainingAreaSqft).toLocaleString("en-IN")} sq.ft` : "—"],
                ["Coverage", placedPanels.length ? `${panelMetrics.coveragePct.toFixed(0)}%` : "—"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-slate-50 p-2 dark:bg-white/[0.04]">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
                  <p className="mt-0.5 text-sm font-extrabold text-slate-900 dark:text-white">{value}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-slate-500">
              {panelModuleLabel(panelSpec)} · {panelOrientation}
            </p>
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
        </aside>
      </div>
    </main>
  );
}
