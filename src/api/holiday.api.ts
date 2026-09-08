import { apiClient, getAuthToken } from "../lib/apiClient";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import type { ApiResponse } from "../types/api";
import type { BulkHolidayRow, Holiday, HolidayFormValues, HolidayType } from "../types/holiday";

export async function getHolidays(params?: { type?: string; school_code?: string }) {
  const { data } = await apiClient.get<ApiResponse<Holiday[]>>("/tenant/getallholidays", { params });
  return data.data ?? [];
}

// Responds with an array even for a single date, since the backend always
// inserts via bulkCreate (a from_date/to_date range expands to one row per
// day). Returns 409 with the conflicting date(s) if any already exist.
export async function createHoliday(values: HolidayFormValues) {
  const { data } = await apiClient.post<ApiResponse<Holiday[]>>("/tenant/createholidays", values);
  return data;
}

export async function updateHoliday(id: string, values: Partial<HolidayFormValues>) {
  const { data } = await apiClient.put<ApiResponse<Holiday>>(`/tenant/updateholidayById/${id}`, values);
  return data;
}

export async function deleteHoliday(id: string) {
  const { data } = await apiClient.delete<ApiResponse>(`/tenant/deleteholidayById/${id}`);
  return data;
}

// Each row in `holidays` is itself a distinct holiday (own name/date) — for
// adding several different holidays at once, not one holiday across a range
// (that's covered by createHoliday's from_date/to_date).
export async function bulkAddHolidays(holidays: BulkHolidayRow[]) {
  const { data } = await apiClient.post<ApiResponse<Holiday[]>>("/tenant/bulkaddholidays", { holidays });
  return data;
}

// Fetches the generated PDF (returns application/pdf bytes, not the usual
// JSON envelope) and hands it to the OS share sheet so it can be saved or
// sent from the device.
export async function downloadHolidaysPdf(params?: { type?: HolidayType }) {
  const base = apiClient.defaults.baseURL ?? "https://api.vidyatrack.com";
  const query = params?.type ? `?type=${encodeURIComponent(params.type)}` : "";
  const file = new FileSystem.File(FileSystem.Paths.cache, `holidays_${Date.now()}.pdf`);
  await FileSystem.File.downloadFileAsync(`${base}/tenant/holidaysdownload${query}`, file, {
    headers: { Authorization: `Bearer ${getAuthToken()}` },
    idempotent: true,
  });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: "application/pdf", dialogTitle: "Holiday list" });
  }
  return file.uri;
}