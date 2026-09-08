import { apiClient } from "../lib/apiClient";
import type { ApiResponse } from "../types/api";
import type { BulkTimetableResult, TimetableEntry, TimetableFormValues } from "../types/timetable";

// Port of admin-portal's src/services/timetable.api.ts — same endpoints the
// web Timetable page calls against backend/app/controllers/tenant/timetable.js.
// The bulk endpoint reads an Excel upload (multer field "file") OR a JSON
// { timetables: [...] } body; both run through identical dedup / working-day /
// teacher-overlap logic, so mobile bulk-add uses the JSON branch with real IDs
// straight from the pickers (no spreadsheet/template needed).

export async function getTimetable(params?: { class_id?: string; section_id?: string; day_of_week?: string }) {
  const { data } = await apiClient.get<ApiResponse<TimetableEntry[]>>("/tenant/getalltimetable", { params });
  return data.data ?? [];
}

export async function createTimetableEntry(values: TimetableFormValues) {
  const { data } = await apiClient.post<ApiResponse<TimetableEntry>>("/tenant/createtimetable", values);
  return data;
}

export async function updateTimetableEntry(id: string, values: Partial<TimetableFormValues>) {
  const { data } = await apiClient.put<ApiResponse<TimetableEntry>>(`/tenant/updatetimetableById/${id}`, values);
  return data;
}

export async function deleteTimetableEntry(id: string) {
  const { data } = await apiClient.delete<ApiResponse>(`/tenant/deletetimetableById/${id}`);
  return data;
}

export interface TimetableBulkRow {
  class_id: string;
  section_id: string;
  subject_id?: string;
  teacher_id: string;
  period_no?: number;
  time_sloat?: string;
  day_of_week: string;
  room_no?: string;
  academicYearId?: string;
}

// POST /tenant/timetable/bulk — rows keep the same required columns as the
// single-entry form (class_id, section_id, day_of_week, teacher_id). The
// backend counts inserted/skipped/failed and returns per-row errors for
// non-working days and teacher double-bookings.
export async function bulkAddTimetable(timetables: TimetableBulkRow[]) {
  const { data } = await apiClient.post<ApiResponse<TimetableEntry[]> & Partial<BulkTimetableResult>>(
    "/tenant/timetable/bulk",
    { timetables }
  );
  return {
    inserted: data.inserted ?? 0,
    failed: data.failed ?? 0,
    skipped: data.skipped ?? 0,
    errors: data.errors ?? [],
  } as BulkTimetableResult;
}