import { useEffect, useSyncExternalStore } from "react";
import { queryOptions } from "@tanstack/react-query";
import { fetchNasaPower, type NasaPowerResult } from "./nasa.functions";

export type FarmConfig = {
  name: string;
  lat: number;
  lon: number;
  crop: string;
  start: string;
  end: string;
};

const STORAGE_KEY = "field-shift-farm";

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

export const DEFAULT_FARM: FarmConfig = {
  name: "Dinajpur Field Plot",
  lat: 25.63,
  lon: 88.63,
  crop: "rice",
  // NASA POWER daily data lags by a few days; keep a safe recent window.
  start: isoDaysAgo(370),
  end: isoDaysAgo(7),
};

let current: FarmConfig = DEFAULT_FARM;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function setFarm(next: FarmConfig) {
  current = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

let hydrated = false;
function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Partial<FarmConfig>;
    if (typeof parsed.lat === "number" && typeof parsed.lon === "number") {
      current = { ...DEFAULT_FARM, ...parsed } as FarmConfig;
      emit();
    }
  } catch {
    /* ignore malformed storage */
  }
}

export function useFarm(): FarmConfig {
  const farm = useSyncExternalStore(
    subscribe,
    () => current,
    () => DEFAULT_FARM,
  );
  useEffect(hydrate, []);
  return farm;
}

export function nasaQueryOptions(farm: FarmConfig) {
  return queryOptions<NasaPowerResult>({
    queryKey: ["nasa-power", farm.lat, farm.lon, farm.start, farm.end],
    queryFn: () =>
      fetchNasaPower({
        data: { lat: farm.lat, lon: farm.lon, start: farm.start, end: farm.end },
      }),
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });
}
