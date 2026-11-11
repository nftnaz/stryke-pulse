export interface PulseResponse {
  score: number;
  mood: string;
  breadth: number;
  net_flow: number;
}

export interface OptionStrike {
  strike: number;
  call_oi: number;
  put_oi: number;

  call_change_oi?: number | null;
  put_change_oi?: number | null;

  call_volume?: number;
  put_volume?: number;
}

export interface OptionsChainResponse {
  symbol: string;
  spot: number;
  expiry: string;
  strikes: OptionStrike[];
}

export interface OptionsSummary {
  symbol: string;

  spot: number;

  pcr: number;

  max_pain?: number;

  support?: number;

  resistance?: number;

  call_oi_total: number;

  put_oi_total: number;

  insights: string[];
}