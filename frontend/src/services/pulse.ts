import { api } from "./api";
import type { PulseResponse } from "../types/market";

export async function getPulse(): Promise<PulseResponse> {
  const { data } = await api.get<PulseResponse>("/api/pulse");
  return data;
}