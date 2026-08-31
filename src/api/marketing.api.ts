import { apiClient } from "../lib/apiClient";
import type { ApiResponse } from "../types/api";
import type { MarketingDashboard } from "../types/marketing";

export async function getMarketingDashboard(marketingId: string, month?: number, year?: number) {
  const { data } = await apiClient.get<MarketingDashboard>(`/organization/marketing/dashboard/${marketingId}`, {
    params: { month, year },
  });
  return data;
}

export interface MarkAttendancePayload {
  marketing_id: string;
  date: string;
  status?: "present" | "absent" | "late" | "half-day";
  marked_by: string;
  remarks?: string;
}

export async function markMarketingAttendance(payload: MarkAttendancePayload) {
  const { data } = await apiClient.post<ApiResponse>("/organization/marketing-attendance", payload);
  return data;
}

export interface LogVisitPayload {
  marketing_id: string;
  school_name: string;
  visit_date: string;
  contact_person?: string;
  remarks?: string;
}

export async function logMarketingVisit(payload: LogVisitPayload) {
  const { data } = await apiClient.post<ApiResponse>("/organization/marketing-visit", payload);
  return data;
}

export interface AddLeadPayload {
  marketing_id: string;
  student_name: string;
  parent_name: string;
  mobile_number: string;
  interested_class?: string;
  school_name?: string;
  source?: string;
}

export async function addMarketingLead(payload: AddLeadPayload) {
  const { data } = await apiClient.post<ApiResponse>("/organization/marketing-lead", payload);
  return data;
}
