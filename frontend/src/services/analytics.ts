import { api } from "./api";
import type { SectorFlow } from "../types/market";

export interface HeatmapCell {
  symbol: string;
  sector: string;
  change_pct: number;
  direction: "in" | "out" | "neutral";
  latest_close: number;
  closes: number[];
}

export interface SectorFlowResponse {
  lookback_days: number;
  inflows: SectorFlow[];
  outflows: SectorFlow[];
  neutral: SectorFlow[];
  all: SectorFlow[];
}

export async function getHeatmap(lookbackDays = 5): Promise<{
  lookback_days: number;
  data: HeatmapCell[];
}> {
  const { data } = await api.get("/api/analytics/heatmap", {
    params: { lookback_days: lookbackDays },
  });
  return data;
}

export async function getSectorFlow(lookbackDays = 5): Promise<SectorFlowResponse> {
  const { data } = await api.get("/api/analytics/sector-flow", {
    params: { lookback_days: lookbackDays },
  });
  return data;
}