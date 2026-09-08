import { apiClient } from "../lib/apiClient";
import type { ApiResponse } from "../types/api";
import type { PricingPlan, PricingPlanFormValues } from "../types/pricingPlan";

export async function getPricingPlans() {
  const { data } = await apiClient.get<ApiResponse<PricingPlan[]>>("/organization/pricing-plans");
  return data.data ?? [];
}

export async function updatePricingPlan(id: string, values: Partial<PricingPlanFormValues>) {
  const { data } = await apiClient.put<ApiResponse<PricingPlan>>(`/organization/pricing-plans/${id}`, values);
  return data;
}
