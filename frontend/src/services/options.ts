import { api } from "./api";

export async function getOptionsSummary() {
  const response = await api.get(
    "/api/options/NIFTY"
  );

  return response.data;
}

export async function getOptionsChain() {
  const response = await api.get(
    "/api/options/NIFTY/chain"
  );

  return response.data;
}