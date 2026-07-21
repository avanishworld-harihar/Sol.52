"use client";

import {
  ArrowLeft,
  Cloud,
  Crosshair,
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
import { calculateRoofMetrics, normalizeRoofPolygon } from "./core/geometry";
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
    label: null,
  };
}

export function DesignStudioClient({ projectId }: { projectId: string }) {
  const toast = useToast();
  const mapRef = useRef<google.maps.Map | null>(null);
  const roofPolygonRef = useRef<google.maps.Polygon | null>(null);
  const draftPolygonRef = useRef<google.maps.Polygon | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const mapListenersRef = useRef<google.maps.MapsEventListener[]>([]);
  const roofListenersRef = useRef<google.maps.MapsEventListener[]>([]);
  const drawingPointsRef = useRef<google.maps.LatLngLiteral[]>([]);
  const drawingRedoRef = useRef<google.maps.LatLngLiteral[]>([]);
  const addObstructionRef = useRef<ObstructionType | null>(null);
  const initialRoofRef = useRef<RoofPolygon | null>(null);
  const initialCenterRef = useRef<[number, number]>(DEFAULT_CENTER);
  const currentRoofRef = useRef<RoofPolygon | null>(null);
  const undoStackRef = useRef<Array<RoofPolygon | null>>([]);
  const redoStackRef = useRef<Array<RoofPolygon | null>>([]);
  const applyingHistoryRef = useRef(false);
  const roofLockedRef = useRef(true);
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
  const [historyVersion, setHistoryVersion] = useState(0);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const googleMapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "";

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [projectRes, surveyRes, layoutRes] = await Promise.all([
          fetch(`/api/projects/${projectId}`, { cache: "no-store" }),
          fetch(`/api/projects/${projectId}/survey`, { cache: "no-store" }),
          fetch(`/api/projects/${projectId}/site-layout`, { cache: "no-store" }),
        ]);
        const projectJson = (await projectRes.json()) as ApiEnvelope<ProjectSummary>;
        const surveyJson = (await surveyRes.json()) as ApiEnvelope<SurveySummary | null>;
        const layoutJson = (await layoutRes.json()) as ApiEnvelope<ProjectSiteLayout | null>;
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
        let roof = layout ? normalizeRoofPolygon(layout.roof_geojson) : null;
        let obstructions = Array.isArray(layout?.obstructions_geojson)
          ? layout.obstructions_geojson
          : [];

        const draft = await readSiteLayoutDraft(projectId);
        if (!layout && draft?.roof) {
          roof = draft.roof;
          obstructions = draft.obstructions;
          setRoofType(draft.roof_type || surveyData?.roof_type || projectJson.data.roof_type || "");
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

  const commitRoof = useCallback((roof: RoofPolygon | null, recordHistory = true) => {
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

  const syncRoofPolygon = useCallback(
    (polygon: google.maps.Polygon) => {
      const points = polygon
        .getPath()
        .getArray()
        .map((point) => [point.lng(), point.lat()]);
      if (points.length < 3) return;
      points.push([...points[0]]);
      const roof = normalizeRoofPolygon({ type: "Polygon", coordinates: [points] });
      if (roof) commitRoof(roof);
    },
    [commitRoof]
  );

  const attachRoofListeners = useCallback(
    (polygon: google.maps.Polygon) => {
      removeRoofListeners();
      const path = polygon.getPath();
      roofListenersRef.current = [
        google.maps.event.addListener(path, "set_at", () => syncRoofPolygon(polygon)),
        google.maps.event.addListener(path, "insert_at", () => syncRoofPolygon(polygon)),
        google.maps.event.addListener(path, "remove_at", () => syncRoofPolygon(polygon)),
      ];
    },
    [removeRoofListeners, syncRoofPolygon]
  );

  const renderRoofPolygon = useCallback(
    (roof: RoofPolygon | null) => {
      const map = mapRef.current;
      if (!map || !window.google?.maps) return;
      removeRoofListeners();
      roofPolygonRef.current?.setMap(null);
      roofPolygonRef.current = null;
      if (!roof) return;

      const path = roof.coordinates[0].slice(0, -1).map(([lng, lat]) => ({ lat, lng }));
      const polygon = new google.maps.Polygon({
        map,
        paths: path,
        editable: !roofLockedRef.current,
        draggable: false,
        strokeColor: "#0f766e",
        strokeOpacity: 1,
        strokeWeight: 3,
        fillColor: "#14b8a6",
        fillOpacity: 0.24,
      });
      roofPolygonRef.current = polygon;
      attachRoofListeners(polygon);
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

        if (initialRoofRef.current) {
          const path = initialRoofRef.current.coordinates[0].slice(0, -1).map(([lng, lat]) => ({ lat, lng }));
          renderRoofPolygon(initialRoofRef.current);
          const bounds = new maps.LatLngBounds();
          path.forEach((point) => bounds.extend(point));
          map.fitBounds(bounds, 70);
        }

        mapListenersRef.current.push(
          map.addListener("click", (event: google.maps.MapMouseEvent) => {
            const latLng = event.latLng;
            if (!latLng) return;
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
            if (!drawingPointsRef.current) return;
            const isDrawing = map.get("sol52DrawingRoof") === true;
            if (!isDrawing) return;
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
            if (!draftPolygonRef.current) {
              draftPolygonRef.current = new maps.Polygon({
                map,
                paths: drawingPointsRef.current,
                strokeColor: "#0284c7",
                strokeOpacity: 1,
                strokeWeight: 3,
                fillColor: "#38bdf8",
                fillOpacity: 0.2,
              });
            } else {
              draftPolygonRef.current.setPath(drawingPointsRef.current);
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
      roofPolygonRef.current?.setMap(null);
      roofPolygonRef.current = null;
      draftPolygonRef.current?.setMap(null);
      draftPolygonRef.current = null;
      mapRef.current = null;
      setMapReady(false);
    };
  }, [googleMapsKey, mapContainerEl, removeRoofListeners, renderRoofPolygon]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !window.google?.maps) return;
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = state.obstructions.map((obstruction) => {
      const marker = new google.maps.Marker({
        map: mapRef.current!,
        position: { lat: obstruction.lat, lng: obstruction.lng },
        title: `${OBSTRUCTION_LABELS[obstruction.type]} · ${obstruction.height_ft} ft`,
        label: {
          text: obstruction.type === "tree" ? "TR" : obstruction.type === "water_tank" ? "WT" : "OB",
          color: "#ffffff",
          fontSize: "10px",
          fontWeight: "700",
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: "#d97706",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
          scale: 16,
        },
      });
      marker.addListener("click", () => {
        dispatch({ type: "SELECT_OBSTRUCTION", id: obstruction.id });
      });
      return marker;
    });
  }, [mapReady, state.obstructions]);

  useEffect(() => {
    if (!state.dirty) return;
    const timer = window.setTimeout(() => {
      void writeSiteLayoutDraft(projectId, {
        roof: state.roof,
        obstructions: state.obstructions,
        center_lat: center[1],
        center_lng: center[0],
        roof_type: roofType || null,
        updated_at: new Date().toISOString(),
      });
    }, 600);
    return () => window.clearTimeout(timer);
  }, [center, projectId, roofType, state.dirty, state.obstructions, state.roof]);

  const selectedObstruction = useMemo(
    () => state.obstructions.find((item) => item.id === state.selectedObstructionId) ?? null,
    [state.obstructions, state.selectedObstructionId]
  );
  const displayedMetrics = drawingRoof ? drawingMetrics : state.metrics;
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

  const beginRoofDrawing = useCallback(() => {
    if (!mapRef.current) return;
    addObstructionRef.current = null;
    setPendingObstruction(null);
    roofPolygonRef.current?.setEditable(false);
    draftPolygonRef.current?.setMap(null);
    draftPolygonRef.current = null;
    drawingPointsRef.current = [];
    drawingRedoRef.current = [];
    setDrawingPointCount(0);
    setDrawingMetrics(null);
    setDrawingRoof(true);
    mapRef.current.set("sol52DrawingRoof", true);
    mapRef.current.setOptions({ draggableCursor: "crosshair" });
  }, []);

  const cancelRoofDrawing = useCallback(() => {
    draftPolygonRef.current?.setMap(null);
    draftPolygonRef.current = null;
    drawingPointsRef.current = [];
    drawingRedoRef.current = [];
    setDrawingPointCount(0);
    setDrawingMetrics(null);
    setDrawingRoof(false);
    roofPolygonRef.current?.setEditable(!roofLockedRef.current);
    mapRef.current?.set("sol52DrawingRoof", false);
    mapRef.current?.setOptions({ draggableCursor: null });
  }, []);

  const finishRoofDrawing = useCallback(() => {
    const map = mapRef.current;
    if (!map || !window.google?.maps) return;
    const points = drawingPointsRef.current;
    if (points.length < 3) {
      toast.error("Add more corners", "Click at least 3 roof corners before finishing.");
      return;
    }

    draftPolygonRef.current?.setMap(null);
    draftPolygonRef.current = null;
    const coordinates = points.map((point) => [point.lng, point.lat]);
    coordinates.push([...coordinates[0]]);
    const roof = normalizeRoofPolygon({ type: "Polygon", coordinates: [coordinates] });
    if (!roof) return;

    roofLockedRef.current = false;
    setRoofLocked(false);
    commitRoof(roof);
    renderRoofPolygon(roof);
    drawingPointsRef.current = [];
    drawingRedoRef.current = [];
    setDrawingPointCount(0);
    setDrawingMetrics(null);
    setDrawingRoof(false);
    map.set("sol52DrawingRoof", false);
    map.setOptions({ draggableCursor: null });
    toast.success("Roof completed", "Adjust corners if needed, then lock the roof.");
  }, [commitRoof, renderRoofPolygon, toast]);

  const clearRoof = useCallback(() => {
    removeRoofListeners();
    roofPolygonRef.current?.setMap(null);
    roofPolygonRef.current = null;
    draftPolygonRef.current?.setMap(null);
    draftPolygonRef.current = null;
    drawingPointsRef.current = [];
    drawingRedoRef.current = [];
    setDrawingPointCount(0);
    setDrawingMetrics(null);
    setDrawingRoof(false);
    mapRef.current?.set("sol52DrawingRoof", false);
    mapRef.current?.setOptions({ draggableCursor: null });
    commitRoof(null);
  }, [commitRoof, removeRoofListeners]);

  const updateDraftAfterHistory = useCallback(() => {
    const points = drawingPointsRef.current;
    setDrawingPointCount(points.length);
    draftPolygonRef.current?.setPath(points);
    const coordinates = points.map((point) => [point.lng, point.lat]);
    if (coordinates.length < 3) {
      setDrawingMetrics(null);
      return;
    }
    coordinates.push([...coordinates[0]]);
    const roof = normalizeRoofPolygon({ type: "Polygon", coordinates: [coordinates] });
    setDrawingMetrics(roof ? calculateRoofMetrics(roof) : null);
  }, []);

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
    renderRoofPolygon(previous);
    applyingHistoryRef.current = false;
    setHistoryVersion((value) => value + 1);
  }, [commitRoof, drawingRoof, renderRoofPolygon, updateDraftAfterHistory]);

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
    renderRoofPolygon(next);
    applyingHistoryRef.current = false;
    setHistoryVersion((value) => value + 1);
  }, [commitRoof, drawingRoof, renderRoofPolygon, updateDraftAfterHistory]);

  const toggleRoofLock = useCallback(() => {
    if (!roofPolygonRef.current) return;
    const nextLocked = !roofLockedRef.current;
    roofLockedRef.current = nextLocked;
    setRoofLocked(nextLocked);
    roofPolygonRef.current.setEditable(!nextLocked);
    toast.success(
      nextLocked ? "Roof locked" : "Roof unlocked",
      nextLocked
        ? "Corners are protected from accidental changes."
        : "Drag the corner handles to refine the roof."
    );
  }, [toast]);

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
      await clearSiteLayoutDraft(projectId);
      toast.success("Site layout saved", `Version ${json.data.version_number} is now current.`);
    } catch (error) {
      toast.error("Save failed", error instanceof Error ? error.message : "Could not save layout.");
    } finally {
      setSaving(false);
    }
  }, [center, projectId, roofType, state.metrics, state.obstructions, state.roof, survey, toast]);

  if (loading) {
    return <div className="flex min-h-[70vh] items-center justify-center text-sm text-slate-500">Loading Design Studio…</div>;
  }

  return (
    <main className="min-h-[100dvh] bg-slate-100 dark:bg-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 px-3 py-2 backdrop-blur dark:border-white/10 dark:bg-slate-950/95 sm:px-5">
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
                Phase 1 Geometry · {currentLayout ? `Saved V${currentLayout.version_number}` : "New layout"}
                {state.dirty ? " · Unsaved changes" : ""}
              </p>
            </div>
          </div>
          <Button onClick={() => void saveLayout()} disabled={saving || !state.roof}>
            <Save className="mr-1.5 h-4 w-4" />
            {saving ? "Saving…" : "Save version"}
          </Button>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] gap-3 p-3 lg:grid-cols-[280px_minmax(0,1fr)_300px] lg:p-4">
        <aside className="space-y-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900">
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
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">Drawing</p>
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
                  <Button variant="outline" size="sm" onClick={beginRoofDrawing}>
                    <TriangleRight className="mr-1 h-4 w-4" />
                    {state.roof ? "Redraw roof" : "Draw roof"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearRoof} disabled={!state.roof}>
                    <Trash2 className="mr-1 h-4 w-4" /> Clear
                  </Button>
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
              <p className="mt-2 rounded-lg bg-sky-50 px-2 py-1.5 text-[10px] font-semibold text-sky-800">
                Click each roof corner, use Undo for mistakes, then press Finish.
              </p>
            ) : state.roof ? (
              <p className="mt-2 text-[10px] font-semibold text-slate-500">
                {roofLocked
                  ? "Roof is locked. Unlock it before dragging corners."
                  : "Drag the white corner handles, then lock the roof."}
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
                  onClick={() => beginObstruction(type)}
                  className={`rounded-lg border px-2 py-2 text-left text-[11px] font-semibold ${
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
              <p className="mt-2 text-[11px] font-semibold text-amber-700">Click its location on the map.</p>
            ) : null}
          </div>
        </aside>

        <section className="relative min-h-[62vh] overflow-hidden rounded-xl border border-slate-200 bg-slate-200 dark:border-white/10 dark:bg-slate-900 lg:min-h-[calc(100dvh-100px)]">
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

        <aside className="space-y-3">
          <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900">
            <p className="text-xs font-extrabold text-slate-900 dark:text-white">Live geometry</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                ["Roof area", displayedMetrics ? `${Math.round(displayedMetrics.areaSqft).toLocaleString("en-IN")} sq.ft` : "—"],
                ["Area", displayedMetrics ? `${Math.round(displayedMetrics.areaSqm).toLocaleString("en-IN")} m²` : "—"],
                ["Perimeter", displayedMetrics ? `${displayedMetrics.perimeterM.toFixed(1)} m` : "—"],
                ["Azimuth", displayedMetrics?.azimuthDeg != null ? `${displayedMetrics.azimuthDeg.toFixed(0)}°` : "—"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-slate-50 p-2 dark:bg-white/[0.04]">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
                  <p className="mt-0.5 text-sm font-extrabold text-slate-900 dark:text-white">{value}</p>
                </div>
              ))}
            </div>
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
              <Crosshair className="h-4 w-4" /> Phase 1
            </div>
            <p className="mt-1">
              Draw and save the roof geometry now. Auto panel placement, engineering validation and shadow analysis follow in approved phases.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
