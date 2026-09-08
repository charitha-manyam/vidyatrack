import { apiClient } from "../lib/apiClient";
import type { ApiResponse } from "../types/api";
import type { Complaint, ComplaintFormValues } from "../types/complaint";

export async function getComplaints(params?: {
  regarding_type?: string;
  category?: string;
  status?: string;
}) {
  const { data } = await apiClient.get<ApiResponse<Complaint[]>>("/tenant/getallcomplaints", { params });
  return data.data ?? [];
}

export async function createComplaint(values: ComplaintFormValues) {
  const { data } = await apiClient.post<ApiResponse<Complaint>>("/tenant/createcomplaints", values);
  return data;
}

export async function resolveComplaint(id: string, resolution: string) {
  const { data } = await apiClient.put<ApiResponse<Complaint>>(`/tenant/resolvecomplaint/${id}`, {
    resolution,
  });
  return data;
}

export async function rejectComplaint(id: string, remarks?: string) {
  const { data } = await apiClient.put<ApiResponse<Complaint>>(`/tenant/rejectcomplaint/${id}`, {
    remarks,
  });
  return data;
}