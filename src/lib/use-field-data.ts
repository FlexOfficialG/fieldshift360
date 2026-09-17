import { useQuery } from "@tanstack/react-query";
import { getCrop } from "./crops";
import { useFarm, nasaQueryOptions, type FarmConfig } from "./farm-store";
import { computeIndicators, type ClimateState, type Indicator } from "./indicators";
import type { NasaPowerResult } from "./nasa.functions";

export type FieldData = {
  farm: FarmConfig;
  crop: ReturnType<typeof getCrop>;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  nasa: NasaPowerResult | undefined;
  /** Aggregated NASA baseline; null when data is not usable. */
  baseline: ClimateState | null;
  indicators: Indicator[] | null;
};

export function useFieldData(): FieldData {
  const farm = useFarm();
  const crop = getCrop(farm.crop);
  const query = useQuery(nasaQueryOptions(farm));
  const nasa = query.data;

  const usable = nasa && (nasa.status === "available" || nasa.status === "partial");
  const mean = (code: string) => nasa?.variables.find((v) => v.code === code)?.mean ?? null;

  let baseline: ClimateState | null = null;
  if (usable) {
    const t = mean("T2M");
    const p = mean("PRECTOTCORR");
    const s = mean("ALLSKY_SFC_SW_DWN");
    if (t !== null && p !== null && s !== null) {
      baseline = { tMean: t, precipMeanDaily: p, solarMean: s };
    }
  }

  return {
    farm,
    crop,
    isLoading: query.isPending,
    isError: query.isError,
    error: (query.error as Error) ?? null,
    nasa,
    baseline,
    indicators: baseline ? computeIndicators(baseline, crop) : null,
  };
}
