import { apiClient } from "../lib/apiClient";
import type { ApiResponse } from "../types/api";
import type { BillingPlan, BillingPlanFormValues } from "../types/billingPlan";

export async function getAllBillingPlans() {
  const { data } = await apiClient.get<ApiResponse<BillingPlan[]>>("/organization/getallbillings");
  return data.data ?? [];
}

export async function createBillingPlan(values: BillingPlanFormValues) {
  const { data } = await apiClient.post<ApiResponse<BillingPlan>>("/organization/billing", values);
  return data;
}

export async function updateBillingPlan(id: string, values: Partial<BillingPlanFormValues>) {
  const { data } = await apiClient.put<ApiResponse<BillingPlan>>(
    `/organization/updatebillingById/${id}`,
    values
  );
  return data;
}

export async function deleteBillingPlan(id: string) {
  const { data } = await apiClient.delete<ApiResponse>(`/organization/deletebillingById/${id}`);
  return data;
}
