// Mirrors app/models/schemas.py exactly

export interface IndexSnapshot {
  symbol: string;
  ltp?: number | null;
  change?: number | null;
  change_pct?: number | null;
  prev_close?: number | null;
  high?: number | null;
  low?: number | null;
  timestamp?: string | null; // ISO datetime from backend
}

export interface MarketMood {
  score: number; // 0–100
  label: string;
  breadth_pct?: number | null;
  money_flow_score?: number | null;
  vix?: number | null;
  notes: string[];
}

export type SectorDirection = "in" | "out" | "neutral";

export interface SectorFlow {
  sector: string;
  net_flow_cr?: number | null;
  change_pct?: number | null;
  direction: SectorDirection;
}

export interface PulseResponse {
  as_of: string; // ISO datetime
  market_status: "open" | "closed" | "pre" | "post" | string;
  mood: MarketMood;
  indices: IndexSnapshot[];
  india_vix?: number | null;
  sectors: SectorFlow[];
  summary: string;
  raw?: Record<string, unknown> | null;
}

// ---------- Options ----------

export interface OptionWall {
  strike: number;
  oi: number;
  change_oi?: number | null;
  side: "call" | "put";
}

export interface StrikeRow {
  strike: number;
  call_oi?: number | null;
  call_change_oi?: number | null;
  put_oi?: number | null;
  put_change_oi?: number | null;
  call_volume?: number | null;
  put_volume?: number | null;
}

export interface OptionsSummary {
  symbol: string;
  instrument_key: string;
  expiry: string;
  trade_date: string;
  spot?: number | null;
  pcr?: number | null;
  max_pain?: number | null;
  support?: number | null;
  resistance?: number | null;
  call_oi_total?: number | null;
  put_oi_total?: number | null;
  top_call_walls: OptionWall[];
  top_put_walls: OptionWall[];
  insights: string[];
  as_of: string;
  source: "mock" | "upstox" | string;
}

export interface OptionsChainResponse {
  symbol: string;
  instrument_key: string;
  expiry: string;
  trade_date: string;
  spot?: number | null;
  strikes: StrikeRow[];
  as_of: string;
  source: "mock" | "upstox" | string;
}