import { isAxiosError } from "axios";
import { apiClient, getAuthToken } from "../lib/apiClient";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import type { ApiResponse } from "../types/api";
import type {
  Child,
  ChildHomeworkItem,
  ChildMark,
  ChildTimetableEntry,
  ChildVehicleLocation,
  CreateComplaintPayload,
  FeeSummaryWithDetails,
  Holiday,
  MonthlyAttendanceResponse,
  MyComplaint,
  ParentAnnouncement,
  PaymentHistoryItem,
} from "../types/parent";

export async function getMyChildren() {
  const { data } = await apiClient.get<ApiResponse<Child[]>>("/tenant/parent/mychildren");
  return data.data ?? [];
}

export async function getChildFeeSummary(studentId: string) {
  const { data } = await apiClient.get<ApiResponse<FeeSummaryWithDetails>>(
    `/tenant/parent/students/${studentId}/fee-summary`
  );
  return data.data;
}

export async function getChildMonthlyAttendance(studentId: string, month: number, year: number) {
  const { data } = await apiClient.get<MonthlyAttendanceResponse>(
    `/tenant/parent/students/${studentId}/attendance/monthly`,
    { params: { month, year } }
  );
  return data;
}

export async function getChildHomework(studentId: string) {
  const { data } = await apiClient.get<ApiResponse<ChildHomeworkItem[]>>(
    `/tenant/parent/students/${studentId}/homework`
  );
  return data.data ?? [];
}

// Backend 404s with "Results have not been published yet." when empty —
// that's an empty list, not a failure (same handling as the web portal).
export async function getChildMarks(studentId: string) {
  try {
    const { data } = await apiClient.get<ApiResponse<ChildMark[]>>(
      `/tenant/parent/students/${studentId}/marks`
    );
    return data.data ?? [];
  } catch (err) {
    if (isAxiosError(err) && err.response?.status === 404) return [];
    throw err;
  }
}

export async function getChildTimetable(studentId: string) {
  const { data } = await apiClient.get<ApiResponse<ChildTimetableEntry[]>>(
    `/tenant/parent/students/${studentId}/timetable`
  );
  return data.data ?? [];
}

// /tenant/getallholidays sits behind a global requireNotParent gate that
// 403s parent tokens — /tenant/parent/holidays is the same controller
// registered before that gate.
export async function getHolidays() {
  const { data } = await apiClient.get<ApiResponse<Holiday[]>>("/tenant/parent/holidays");
  return data.data ?? [];
}

// /tenant/parent/announcements responds with `success`, not `status`.
export async function getParentAnnouncements() {
  const { data } = await apiClient.get<{ success: boolean; data: ParentAnnouncement[] }>(
    "/tenant/parent/announcements",
    { params: { type: "parent" } }
  );
  return data.data ?? [];
}

export async function getMyComplaints() {
  const { data } = await apiClient.get<ApiResponse<MyComplaint[]>>("/tenant/parent/complaints");
  return data.data ?? [];
}

export async function createMyComplaint(payload: CreateComplaintPayload) {
  const { data } = await apiClient.post<ApiResponse<MyComplaint>>("/tenant/parent/complaints", payload);
  return data;
}

export async function getChildPayments(studentId: string) {
  const { data } = await apiClient.get<ApiResponse<PaymentHistoryItem[]>>(
    `/tenant/parent/students/${studentId}/payments`
  );
  return data.data ?? [];
}

// Meant to be polled (setInterval) rather than fetched once — see
// ParentTrackMyBusScreen.tsx (mirrors the web portal's 15s refetch).
export async function getChildVehicleLocation(studentId: string) {
  const { data } = await apiClient.get<ApiResponse<ChildVehicleLocation>>(
    `/tenant/parent/students/${studentId}/vehicle-location`
  );
  return data.data!;
}

// Fetches the receipt PDF (raw bytes, not the JSON envelope) and hands it to
// the OS share sheet so it can be saved or sent from the device.
export async function downloadPaymentReceipt(payment: PaymentHistoryItem) {
  const base = apiClient.defaults.baseURL ?? "https://api.vidyatrack.com";
  const file = new FileSystem.File(FileSystem.Paths.cache, `receipt_${payment.receipt_no}.pdf`);
  await FileSystem.File.downloadFileAsync(
    `${base}/tenant/parent/payments/${payment.id}/receipt?type=${payment.type}`,
    file,
    {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
      idempotent: true,
    }
  );
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: "application/pdf", dialogTitle: "Payment receipt" });
  }
  return file.uri;
}
