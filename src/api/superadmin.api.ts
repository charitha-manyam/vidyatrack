import { apiClient } from "../lib/apiClient";
import type { ApiResponse } from "../types/api";
import type { SubscriptionSummary } from "../types/subscription";

export async function getSubscriptionSummary() {
  const { data } = await apiClient.get<ApiResponse<SubscriptionSummary>>("/organization/subscription-summary");
  return data.data!;
}
