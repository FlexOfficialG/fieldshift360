export type Crop = {
  id: string;
  name: string;
  /** Upper bound of the commonly cited optimal mean-temperature range (deg C). */
  tOpt: number;
  /** Mean temperature at which heat stress is treated as saturated (deg C). */
  tCrit: number;
  /** Reference water demand used by the prototype water indicator (mm/day). */
  waterReq: number;
  /** Reference daily solar demand used by the radiation term (MJ/m^2/day). */
  radReq: number;
};

export const CROPS: Crop[] = [
  { id: "rice", name: "Rice", tOpt: 28, tCrit: 38, waterReq: 6.0, radReq: 18 },
  { id: "wheat", name: "Wheat", tOpt: 22, tCrit: 32, waterReq: 3.5, radReq: 15 },
  { id: "maize", name: "Maize", tOpt: 26, tCrit: 36, waterReq: 4.5, radReq: 18 },
  { id: "potato", name: "Potato", tOpt: 20, tCrit: 30, waterReq: 3.5, radReq: 14 },
  { id: "soybean", name: "Soybean", tOpt: 26, tCrit: 35, waterReq: 4.0, radReq: 17 },
  { id: "cotton", name: "Cotton", tOpt: 30, tCrit: 40, waterReq: 4.0, radReq: 19 },
  { id: "jute", name: "Jute", tOpt: 30, tCrit: 39, waterReq: 5.0, radReq: 18 },
];

export function getCrop(id: string): Crop {
  return CROPS.find((c) => c.id === id) ?? CROPS[0]!;
}
