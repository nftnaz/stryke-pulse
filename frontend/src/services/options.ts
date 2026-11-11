import { api } from "./api";
import type { OptionsSummary, OptionsChainResponse } from "../types/market";

export async function getOptionsSummary(
  symbol = "NIFTY",
  expiry?: string,
  tradeDate?: string
): Promise<OptionsSummary> {
  const { data } = await api.get<OptionsSummary>(`/api/options/${symbol}`, {
    params: { expiry, trade_date: tradeDate },
  });
  return data;
}

export async function getOptionsChain(
  symbol = "NIFTY",
  expiry?: string,
  tradeDate?: string
): Promise<OptionsChainResponse> {
  const { data } = await api.get<OptionsChainResponse>(
    `/api/options/${symbol}/chain`,
    { params: { expiry, trade_date: tradeDate } }
  );
  return data;
}