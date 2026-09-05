import { apiClient } from "../lib/apiClient";
import type { ApiResponse } from "../types/api";
import type { Leave, LeaveFormValues, StaffLeaveAllocation } from "../types/leave";

export async function getLeaves(params?: { status?: string }) {
  const { data } = await apiClient.get<ApiResponse<Leave[]>>("/tenant/getallleaves", { params });
  return data.data ?? [];
}

export async function createLeave(values: LeaveFormValues) {
  const { data } = await apiClient.post<ApiResponse<Leave>>("/tenant/createleaves", values);
  return data;
}

export async function approveLeave(id: string, approved_by: string) {
  const { data } = await apiClient.put<ApiResponse<Leave>>(`/tenant/leaves/${id}/approve`, { approved_by });
  return data;
}

export async function rejectLeave(id: string, approved_by: string, remarks?: string) {
  const { data } = await apiClient.put<ApiResponse<Leave>>(`/tenant/leaves/${id}/reject`, {
    approved_by,
    remarks,
  });
  return data;
}

export async function deleteLeave(id: string) {
  const { data } = await apiClient.delete<ApiResponse>(`/tenant/deleteleaveById/${id}`);
  return data;
}

export async function getLeaveAllocations(params?: { academicYearId?: string; school_code?: string }) {
  const { data } = await apiClient.get<ApiResponse<StaffLeaveAllocation[]>>("/tenant/getallleaveallocations", { params });
  return data.data ?? [];
}

export async function setLeaveAllocations(
  academicYearId: string,
  school_code: string,
  allocations: { leave_type: string; allocated_days: number }[]
) {
  const { data } = await apiClient.post<ApiResponse>("/tenant/createleaveallocation", {
    allocations,
    academicYearId,
    school_code,
  });
  return data;
}