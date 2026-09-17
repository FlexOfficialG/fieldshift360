import type { Crop } from "./crops";

export type StressLevel = "Low" | "Moderate" | "High" | "Severe";

export type Indicator = {
  key: "heat" | "water" | "environmental";
  label: string;
  /** 0-100 prototype index, calculated by Field Shift (not a NASA observation). */
  value: number;
  level: StressLevel;
  input: string;
  calculation: string;
  result: string;
};

export type ClimateState = {
  /** Mean 2-metre air temperature over the period (deg C). */
  tMean: number;
  /** Mean daily precipitation over the period (mm/day). */
  precipMeanDaily: number;
  /** Mean daily all-sky shortwave irradiance (MJ/m^2/day). */
  solarMean: number;
};

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const round1 = (x: number) => Math.round(x * 10) / 10;

export function stressLevel(value: number): StressLevel {
  if (value < 25) return "Low";
  if (value < 50) return "Moderate";
  if (value < 75) return "High";
  return "Severe";
}

export function heatStress(state: ClimateState, crop: Crop): number {
  const raw = (state.tMean - crop.tOpt) / (crop.tCrit - crop.tOpt);
  return round1(clamp01(raw) * 100);
}

export function waterStress(state: ClimateState, crop: Crop): number {
  const raw = 1 - state.precipMeanDaily / crop.waterReq;
  return round1(clamp01(raw) * 100);
}

export function radiationDeficit(state: ClimateState, crop: Crop): number {
  const raw = 1 - state.solarMean / crop.radReq;
  return round1(clamp01(raw) * 100);
}

export function environmentalStress(state: ClimateState, crop: Crop): number {
  const h = heatStress(state, crop);
  const w = waterStress(state, crop);
  const r = radiationDeficit(state, crop);
  return round1(0.45 * h + 0.45 * w + 0.1 * r);
}

export function computeIndicators(state: ClimateState, crop: Crop): Indicator[] {
  const h = heatStress(state, crop);
  const w = waterStress(state, crop);
  const r = radiationDeficit(state, crop);
  const e = environmentalStress(state, crop);

  return [
    {
      key: "heat",
      label: "Heat Stress",
      value: h,
      level: stressLevel(h),
      input: `Mean air temperature ${round1(state.tMean)} °C (NASA POWER T2M); ${crop.name} reference range ${crop.tOpt} °C optimal upper bound, ${crop.tCrit} °C saturation`,
      calculation: `clamp((T_mean − T_opt) ÷ (T_crit − T_opt), 0, 1) × 100 = clamp((${round1(state.tMean)} − ${crop.tOpt}) ÷ (${crop.tCrit} − ${crop.tOpt}), 0, 1) × 100`,
      result: `${h} / 100 — ${stressLevel(h)}`,
    },
    {
      key: "water",
      label: "Water Stress",
      value: w,
      level: stressLevel(w),
      input: `Mean daily precipitation ${round1(state.precipMeanDaily)} mm/day (NASA POWER PRECTOTCORR); ${crop.name} reference demand ${crop.waterReq} mm/day`,
      calculation: `clamp(1 − (P_mean ÷ P_ref), 0, 1) × 100 = clamp(1 − (${round1(state.precipMeanDaily)} ÷ ${crop.waterReq}), 0, 1) × 100`,
      result: `${w} / 100 — ${stressLevel(w)}`,
    },
    {
      key: "environmental",
      label: "Environmental Stress",
      value: e,
      level: stressLevel(e),
      input: `Heat Stress ${h}, Water Stress ${w}, Radiation Deficit ${r} (from ALLSKY_SFC_SW_DWN mean ${round1(state.solarMean)} MJ/m²/day vs ${crop.radReq} MJ/m²/day reference)`,
      calculation: `(0.45 × Heat) + (0.45 × Water) + (0.10 × Radiation Deficit) = (0.45 × ${h}) + (0.45 × ${w}) + (0.10 × ${r})`,
      result: `${e} / 100 — ${stressLevel(e)}`,
    },
  ];
}

export type Priority = {
  title: string;
  urgency: StressLevel;
  reason: string;
};

export function adaptationPriorities(state: ClimateState, crop: Crop): Priority[] {
  const h = heatStress(state, crop);
  const w = waterStress(state, crop);
  const r = radiationDeficit(state, crop);
  const e = environmentalStress(state, crop);

  return [
    {
      title: "Water monitoring",
      urgency: stressLevel(w),
      reason: `Water Stress is ${w}/100 because mean precipitation over the period (${round1(state.precipMeanDaily)} mm/day) sits ${state.precipMeanDaily < crop.waterReq ? "below" : "at or above"} the ${crop.waterReq} mm/day reference demand for ${crop.name}. Consider monitoring soil moisture and irrigation availability; further local assessment is recommended.`,
    },
    {
      title: "Heat monitoring",
      urgency: stressLevel(h),
      reason: `Heat Stress is ${h}/100 from a mean air temperature of ${round1(state.tMean)} °C against a ${crop.tOpt} °C optimal upper bound. May indicate exposure during sensitive growth stages; consider tracking daily maxima and shifting sowing windows after local verification.`,
    },
    {
      title: "Vegetation monitoring",
      urgency: stressLevel(Math.max(e, r)),
      reason: `Combined Environmental Stress is ${e}/100 and the radiation term is ${r}/100. Consider monitoring canopy condition with vegetation indices (for example NASA MODIS or Landsat imagery) to check whether field response matches these calculated indicators.`,
    },
    {
      title: "Weather monitoring",
      urgency: stressLevel(Math.max(h, w)),
      reason: `Both temperature and precipitation drive the indicators above, so continued tracking of NASA POWER updates and local forecasts may indicate emerging deviations from this baseline period.`,
    },
  ];
}
