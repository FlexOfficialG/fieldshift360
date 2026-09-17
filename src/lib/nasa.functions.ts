import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const RequestSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  /** ISO date strings, YYYY-MM-DD */
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type NasaDailyPoint = {
  date: string;
  t2m: number | null;
  precip: number | null;
  solar: number | null;
};

export type NasaVariable = {
  code: string;
  longName: string;
  unit: string;
  validDays: number;
  missingDays: number;
  mean: number | null;
  min: number | null;
  max: number | null;
};

export type NasaDataStatus = "available" | "partial" | "insufficient" | "unavailable";

export type NasaPowerResult = {
  status: NasaDataStatus;
  message: string | null;
  provenance: {
    source: string;
    api: string;
    endpoint: string;
    community: string;
    temporal: string;
    requestedLat: number;
    requestedLon: number;
    returnedLat: number | null;
    returnedLon: number | null;
    elevation: number | null;
    start: string;
    end: string;
    requestedAt: string;
    fillValue: number;
    header: Record<string, unknown> | null;
  };
  variables: NasaVariable[];
  series: NasaDailyPoint[];
  totalDays: number;
};

const FILL = -999;
const PARAMS = ["T2M", "PRECTOTCORR", "ALLSKY_SFC_SW_DWN"] as const;

const compact = (d: string) => d.replaceAll("-", "");
const expand = (d: string) => `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;

function summarise(
  code: string,
  meta: { longname?: string; units?: string } | undefined,
  values: (number | null)[],
): NasaVariable {
  const valid = values.filter((v): v is number => v !== null);
  const mean = valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
  return {
    code,
    longName: meta?.longname ?? code,
    unit: meta?.units ?? "unknown",
    validDays: valid.length,
    missingDays: values.length - valid.length,
    mean: mean === null ? null : Math.round(mean * 1000) / 1000,
    min: valid.length ? Math.min(...valid) : null,
    max: valid.length ? Math.max(...valid) : null,
  };
}

/**
 * Fetches real daily observations/reanalysis from the NASA POWER API.
 * No value is ever synthesised: missing days stay null and are reported.
 */
export const fetchNasaPower = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => RequestSchema.parse(input))
  .handler(async ({ data }): Promise<NasaPowerResult> => {
    const endpoint = "https://power.larc.nasa.gov/api/temporal/daily/point";
    const url =
      `${endpoint}?parameters=${PARAMS.join(",")}` +
      `&community=AG&latitude=${data.lat}&longitude=${data.lon}` +
      `&start=${compact(data.start)}&end=${compact(data.end)}&format=JSON`;

    const baseProvenance = {
      source: "NASA POWER — REAL OBSERVED/REANALYZED DATA",
      api: "NASA POWER API v2 (Prediction Of Worldwide Energy Resources)",
      endpoint: url,
      community: "AG (Agroclimatology)",
      temporal: "Daily point",
      requestedLat: data.lat,
      requestedLon: data.lon,
      returnedLat: null as number | null,
      returnedLon: null as number | null,
      elevation: null as number | null,
      start: data.start,
      end: data.end,
      requestedAt: new Date().toISOString(),
      fillValue: FILL,
      header: null as Record<string, unknown> | null,
    };

    let json: any;
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) {
        const body = await res.text();
        return {
          status: "unavailable",
          message: `NASA POWER API responded with HTTP ${res.status}. ${body.slice(0, 300)}`,
          provenance: baseProvenance,
          variables: [],
          series: [],
          totalDays: 0,
        };
      }
      json = await res.json();
    } catch (error) {
      return {
        status: "unavailable",
        message: `NASA POWER request failed: ${error instanceof Error ? error.message : "network error"}`,
        provenance: baseProvenance,
        variables: [],
        series: [],
        totalDays: 0,
      };
    }

    const parameters = json?.properties?.parameter;
    if (!parameters || typeof parameters !== "object") {
      return {
        status: "unavailable",
        message:
          "NASA POWER returned a response without a parameter block. " +
          (typeof json?.messages === "object" ? JSON.stringify(json.messages).slice(0, 300) : ""),
        provenance: baseProvenance,
        variables: [],
        series: [],
        totalDays: 0,
      };
    }

    const coords = json?.geometry?.coordinates;
    const provenance = {
      ...baseProvenance,
      returnedLon: Array.isArray(coords) ? (coords[0] ?? null) : null,
      returnedLat: Array.isArray(coords) ? (coords[1] ?? null) : null,
      elevation: Array.isArray(coords) ? (coords[2] ?? null) : null,
      header: (json?.header ?? null) as Record<string, unknown> | null,
    };

    const clean = (v: unknown) =>
      typeof v === "number" && v !== FILL && v > FILL + 1 ? v : null;

    const dates = Object.keys(parameters["T2M"] ?? parameters[PARAMS[1]] ?? {}).sort();
    const series: NasaDailyPoint[] = dates.map((key) => ({
      date: expand(key),
      t2m: clean(parameters["T2M"]?.[key]),
      precip: clean(parameters["PRECTOTCORR"]?.[key]),
      solar: clean(parameters["ALLSKY_SFC_SW_DWN"]?.[key]),
    }));

    const units = json?.parameters ?? {};
    const variables: NasaVariable[] = [
      summarise("T2M", units["T2M"], series.map((s) => s.t2m)),
      summarise("PRECTOTCORR", units["PRECTOTCORR"], series.map((s) => s.precip)),
      summarise("ALLSKY_SFC_SW_DWN", units["ALLSKY_SFC_SW_DWN"], series.map((s) => s.solar)),
    ];

    const total = series.length;
    let status: NasaDataStatus = "available";
    let message: string | null = null;

    if (total === 0) {
      status = "unavailable";
      message = "NASA POWER returned no daily records for this location and date range.";
    } else {
      const emptyVars = variables.filter((v) => v.validDays === 0);
      const worstMissingRatio = Math.max(...variables.map((v) => v.missingDays / total));
      if (emptyVars.length > 0) {
        status = "insufficient";
        message = `Required variables have no valid values: ${emptyVars.map((v) => v.code).join(", ")}.`;
      } else if (worstMissingRatio > 0.4) {
        status = "insufficient";
        message = `More than 40% of daily values are missing (fill value ${FILL}) for at least one variable.`;
      } else if (worstMissingRatio > 0) {
        status = "partial";
        message = `Some daily values are missing and were excluded from all statistics: ${variables
          .filter((v) => v.missingDays > 0)
          .map((v) => `${v.code} ${v.missingDays}/${total}`)
          .join(", ")}.`;
      }
    }

    return { status, message, provenance, variables, series, totalDays: total };
  });
