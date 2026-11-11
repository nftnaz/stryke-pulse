import { api } from "./api";

export async function getPulse() {
  const response = await api.get(
    "/api/pulse"
  );

  return response.data;
}