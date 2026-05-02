import { apiRequest } from "./apiClient";
import type { BootstrapResponse } from "./types";

export function fetchBootstrap(): Promise<BootstrapResponse> {
  return apiRequest<BootstrapResponse>("/bootstrap");
}
