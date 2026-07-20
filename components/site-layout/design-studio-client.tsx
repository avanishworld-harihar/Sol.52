"use client";

import MapboxDraw from "@mapbox/mapbox-gl-draw";
import mapboxgl, { type Map as MapboxMap, type Marker } from "mapbox-gl";
import {
  ArrowLeft,
  Cloud,
  Crosshair,
  LocateFixed,
  MapPin,
  Redo2,
  Save,
  Search,
  Trash2,
  TriangleRight,
  Undo2,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-center";
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
  const mapRef = useRef<MapboxMap | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const addObstructionRef = useRef<ObstructionType | null>(null);
  const initialRoofRef = useRef<RoofPolygon | null>(null);
  const initialCenterRef = useRef<[number, number]>(DEFAULT_CENTER);
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

  const mapToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim() ?? "";

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
    if (!mapContainerEl || !mapToken || mapRef.current) return;

    mapboxgl.accessToken = mapToken;
    let cancelled = false;
    const map = new mapboxgl.Map({
      container: mapContainerEl,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: initialCenterRef.current,
      zoom: initialCenterRef.current[0] === DEFAULT_CENTER[0] ? 5 : 19,
      pitch: 0,
      preserveDrawingBuffer: false,
      attributionControl: true,
    });
    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: { polygon: true, trash: true },
      defaultMode: initialRoofRef.current ? "simple_select" : "draw_polygon",
    });
    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");
    map.addControl(draw, "top-left");
    mapRef.current = map;
    drawRef.current = draw;

    const syncRoof = () => {
      const polygons = draw
        .getAll()
        .features.filter((feature) => feature.geometry.type === "Polygon");
      const latestFeature = polygons[polygons.length - 1];
      if (!latestFeature) {
        dispatch({ type: "DELETE_POLYGON" });
        return;
      }
      if (polygons.length > 1) {
        for (const feature of polygons.slice(0, -1)) {
          if (feature.id != null) draw.delete(String(feature.id));
        }
      }
      const roof = normalizeRoofPolygon(latestFeature.geometry);
      if (roof) dispatch({ type: "COMMIT_POLYGON", roof, metrics: calculateRoofMetrics(roof) });
    };

    const handleMapClick = (event: mapboxgl.MapMouseEvent) => {
      const type = addObstructionRef.current;
      if (!type) return;
      const obstruction = newObstruction(type, event.lngLat.lng, event.lngLat.lat);
      dispatch({ type: "PLACE_OBSTRUCTION", obstruction });
      addObstructionRef.current = null;
      setPendingObstruction(null);
    };

    const handleMapError = (event: { error?: Error | { message?: string; status?: number } }) => {
      if (cancelled) return;
      const err = event?.error;
      const message =
        err && typeof err === "object" && "message" in err && typeof err.message === "string"
          ? err.message
          : "Mapbox failed to load the map.";
      const status = err && typeof err === "object" && "status" in err ? Number(err.status) : NaN;
      if (status === 401 || status === 403 || /unauthorized|forbidden|access token/i.test(message)) {
        setLoadError(
          "Mapbox token rejected (401/403). Use public pk. token, allow your Vercel URL in Mapbox token restrictions (or remove restrictions), then redeploy."
        );
      } else {
        setLoadError(message);
      }
    };

    const bumpResize = () => {
      if (!cancelled && mapRef.current) mapRef.current.resize();
    };

    map.on("error", handleMapError);
    map.on("load", () => {
      if (cancelled) return;
      bumpResize();
      window.setTimeout(bumpResize, 100);
      window.setTimeout(bumpResize, 400);
      if (initialRoofRef.current) {
        draw.add({
          type: "Feature",
          properties: {},
          geometry: initialRoofRef.current,
        });
        const coordinates = initialRoofRef.current.coordinates[0];
        const bounds = coordinates.reduce(
          (box, coordinate) => box.extend(coordinate as [number, number]),
          new mapboxgl.LngLatBounds(
            coordinates[0] as [number, number],
            coordinates[0] as [number, number]
          )
        );
        map.fitBounds(bounds, { padding: 70, maxZoom: 20 });
      }
      setMapReady(true);
      setLoadError((prev) => (prev.toLowerCase().includes("mapbox") ? "" : prev));
    });
    map.on("draw.create", syncRoof);
    map.on("draw.update", syncRoof);
    map.on("draw.delete", syncRoof);
    map.on("click", handleMapClick);
    map.on("moveend", () => {
      const next = map.getCenter();
      setCenter([next.lng, next.lat]);
    });

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            bumpResize();
          })
        : null;
    resizeObserver?.observe(mapContainerEl);
    // First paint after grid layout
    requestAnimationFrame(bumpResize);

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.off("error", handleMapError);
      map.remove();
      mapRef.current = null;
      drawRef.current = null;
      setMapReady(false);
    };
  }, [mapContainerEl, mapToken]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = state.obstructions.map((obstruction) => {
      const element = document.createElement("button");
      element.type = "button";
      element.className =
        "flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-amber-600 text-[10px] font-black text-white";
      element.title = `${OBSTRUCTION_LABELS[obstruction.type]} · ${obstruction.height_ft} ft`;
      element.textContent = obstruction.type === "tree" ? "TR" : obstruction.type === "water_tank" ? "WT" : "OB";
      element.addEventListener("click", (event) => {
        event.stopPropagation();
        dispatch({ type: "SELECT_OBSTRUCTION", id: obstruction.id });
      });
      return new mapboxgl.Marker({ element })
        .setLngLat([obstruction.lng, obstruction.lat])
        .addTo(mapRef.current!);
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

  const beginObstruction = useCallback((type: ObstructionType) => {
    addObstructionRef.current = type;
    setPendingObstruction(type);
    mapRef.current?.getCanvas().focus();
  }, []);

  const locateMe = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Location unavailable", "This browser does not provide GPS.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const next: [number, number] = [coords.longitude, coords.latitude];
        setCenter(next);
        mapRef.current?.flyTo({ center: next, zoom: 19 });
      },
      (error) => toast.error("GPS failed", error.message),
      { enableHighAccuracy: true, timeout: 15_000 }
    );
  }, [toast]);

  const searchLocation = useCallback(async () => {
    const query = searchText.trim();
    if (!query || !mapToken) return;
    setSearching(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${encodeURIComponent(mapToken)}&country=IN&limit=1`
      );
      const json = (await response.json()) as { features?: Array<{ center?: [number, number] }> };
      const found = json.features?.[0]?.center;
      if (!found) throw new Error("Location not found.");
      setCenter(found);
      mapRef.current?.flyTo({ center: found, zoom: 19 });
    } catch (error) {
      toast.error("Search failed", error instanceof Error ? error.message : "Location not found.");
    } finally {
      setSearching(false);
    }
  }, [mapToken, searchText, toast]);

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
            <Button variant="outline" size="sm" disabled={searching || !mapToken} onClick={() => void searchLocation()}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" className="w-full justify-start" onClick={locateMe}>
            <LocateFixed className="mr-2 h-4 w-4" /> Use current GPS
          </Button>
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
              <Button variant="outline" size="sm" onClick={() => drawRef.current?.changeMode("draw_polygon")}>
                <TriangleRight className="mr-1 h-4 w-4" /> Roof
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  drawRef.current?.deleteAll();
                  dispatch({ type: "DELETE_POLYGON" });
                }}
              >
                <Trash2 className="mr-1 h-4 w-4" /> Clear
              </Button>
              <Button variant="outline" size="sm" disabled title="Undo adapter arrives in next Phase 1 increment">
                <Undo2 className="mr-1 h-4 w-4" /> Undo
              </Button>
              <Button variant="outline" size="sm" disabled title="Redo adapter arrives in next Phase 1 increment">
                <Redo2 className="mr-1 h-4 w-4" /> Redo
              </Button>
            </div>
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
          {mapToken ? (
            <div
              ref={setMapContainerEl}
              className="absolute inset-0 h-full w-full [&_.mapboxgl-map]:h-full [&_.mapboxgl-map]:w-full [&_.mapboxgl-canvas]:outline-none"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <div className="max-w-md rounded-xl border border-amber-200 bg-amber-50 p-5 text-center">
                <Cloud className="mx-auto h-8 w-8 text-amber-700" />
                <p className="mt-2 text-sm font-extrabold text-amber-950">Mapbox token required</p>
                <p className="mt-1 text-xs leading-relaxed text-amber-800">
                  Add NEXT_PUBLIC_MAPBOX_TOKEN to .env.local (local) and Vercel (production), then restart / redeploy.
                </p>
              </div>
            </div>
          )}
          {!mapReady && mapToken && !loadError ? (
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

        <aside className="space-y-3">
          <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900">
            <p className="text-xs font-extrabold text-slate-900 dark:text-white">Live geometry</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                ["Roof area", state.metrics ? `${Math.round(state.metrics.areaSqft).toLocaleString("en-IN")} sq.ft` : "—"],
                ["Area", state.metrics ? `${Math.round(state.metrics.areaSqm).toLocaleString("en-IN")} m²` : "—"],
                ["Perimeter", state.metrics ? `${state.metrics.perimeterM.toFixed(1)} m` : "—"],
                ["Azimuth", state.metrics?.azimuthDeg != null ? `${state.metrics.azimuthDeg.toFixed(0)}°` : "—"],
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
