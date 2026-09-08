import { apiClient } from "../lib/apiClient";
import type { ApiResponse } from "../types/api";
import type {
  AccountantReport,
  AccountantReportFormValues,
  AttendanceReportRequest,
  MonthlyFeeCollectionReportRequest,
  RecentReport,
  ReportGenerationResult,
  StaffReportRequest,
  StudentReportRequest,
} from "../types/report";

export async function generateAttendanceReport(payload: AttendanceReportRequest) {
  const { data } = await apiClient.post<ReportGenerationResult>("/tenant/attendance-report", payload);
  return data;
}

export async function generateStudentReport(payload: StudentReportRequest) {
  const { data } = await apiClient.post<ReportGenerationResult>("/tenant/student-report", payload);
  return data;
}

export async function generateStaffReport(payload: StaffReportRequest) {
  const { data } = await apiClient.post<ReportGenerationResult>("/tenant/staff-report", payload);
  return data;
}

export async function generateMonthlyFeeCollectionReport(payload: MonthlyFeeCollectionReportRequest) {
  const { data } = await apiClient.post<ReportGenerationResult>("/tenant/monthlyfeecollectionreport", payload);
  return data;
}

export async function getRecentlyGeneratedReports(params?: {
  reportype?: string;
  academic_year_id?: string;
  page?: number;
  limit?: number;
}) {
  const { data } = await apiClient.get<ApiResponse<RecentReport[]>>("/tenant/getrecentlygeneratedreports", {
    params,
  });
  return data.data ?? [];
}

export async function deleteReport(id: string) {
  const { data } = await apiClient.delete<ApiResponse>(`/tenant/deletereportById/${id}`);
  return data;
}

export async function getAccountantReports(params?: {
  reportType?: string;
  classFilter?: string;
  format?: string;
  academicYearId?: string;
}) {
  const { data } = await apiClient.get<ApiResponse<AccountantReport[]>>("/tenant/getreports", { params });
  return data.data ?? [];
}

export async function generateAccountantReport(values: AccountantReportFormValues) {
  const { data } = await apiClient.post<ApiResponse<AccountantReport>>("/tenant/generateReport", values);
  return data;
}

export async function deleteAccountantReport(id: string) {
  const { data } = await apiClient.delete<ApiResponse>(`/tenant/deletereport/${id}`);
  return data;
}