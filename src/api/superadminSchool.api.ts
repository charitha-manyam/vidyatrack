import { apiClient } from "../lib/apiClient";
import type { ApiResponse } from "../types/api";
import type { School, SchoolSubscriptionStatusRow, SubscriptionStatus } from "../types/schoolAdmin";
import type { SubscriptionSummary } from "../types/subscription";

export async function getAllSchoolDetails() {
  const { data } = await apiClient.get<{ schools: School[] }>("/organization/getallschooldetails");
  return data.schools ?? [];
}

export async function updateSchool(id: string, values: Record<string, unknown>) {
  const { data } = await apiClient.put<{ message: string; school: School }>(
    `/organization/updateSchool/${id}`,
    values
  );
  return data;
}

export async function deleteSchool(id: string) {
  const { data } = await apiClient.delete<{ status: boolean; message: string }>(
    `/organization/deleteschool/${id}`
  );
  return data;
}

export async function getSubscriptionSummary() {
  const { data } = await apiClient.get<ApiResponse<SubscriptionSummary>>(
    "/organization/subscription-summary"
  );
  return data.data!;
}

export async function getSchoolsByStatus(status?: SubscriptionStatus) {
  const url = status
    ? `/organization/subscription-status/${status}`
    : "/organization/subscription-status";
  const { data } = await apiClient.get<ApiResponse<SchoolSubscriptionStatusRow[]>>(url);
  return data.data ?? [];
}
