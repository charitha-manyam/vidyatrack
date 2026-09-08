import { apiClient } from "../lib/apiClient";
import type { ApiResponse } from "../types/api";
import type { Exam, ExamFormValues, ExamsTimetableEntry, ExamsTimetableFormValues } from "../types/exam";

// Port of admin-portal's src/services/exam.api.ts — same endpoints the web
// Exams / Exams Timetable pages call against
// backend/app/controllers/tenant/exams.js and exams_timetable.js.
// Note: the exams-timetable list lives at /tenant/getallexams-timetable (the
// old mobile config pointed at "/tenant/exams-timetable", which has no route).

export async function getExams(academicYearId?: string) {
  const { data } = await apiClient.get<ApiResponse<Exam[]>>("/tenant/getallexams", {
    params: academicYearId ? { academicYearId } : undefined,
  });
  return data.data ?? [];
}

export async function createExam(values: ExamFormValues) {
  const { data } = await apiClient.post<ApiResponse<Exam>>("/tenant/createexam", values);
  return data;
}

export async function updateExam(id: string, values: Partial<ExamFormValues>) {
  const { data } = await apiClient.put<ApiResponse<Exam>>(`/tenant/updateexamById/${id}`, values);
  return data;
}

export async function deleteExam(id: string) {
  const { data } = await apiClient.delete<ApiResponse>(`/tenant/deleteexamById/${id}`);
  return data;
}

export async function getExamsTimetable(params?: { class_id?: string; section_id?: string; examnameid?: string }) {
  const { data } = await apiClient.get<ApiResponse<ExamsTimetableEntry[]>>("/tenant/getallexams-timetable", {
    params,
  });
  return data.data ?? [];
}

export async function createExamsTimetableEntry(values: ExamsTimetableFormValues) {
  const { data } = await apiClient.post<ApiResponse<ExamsTimetableEntry>>("/tenant/createexams-timetable", values);
  return data;
}

export async function updateExamsTimetableEntry(id: string, values: Partial<ExamsTimetableFormValues>) {
  const { data } = await apiClient.put<ApiResponse<ExamsTimetableEntry>>(
    `/tenant/updateexams-timetableById/${id}`,
    values
  );
  return data;
}

export async function deleteExamsTimetableEntry(id: string) {
  const { data } = await apiClient.delete<ApiResponse>(`/tenant/deleteexams-timetableById/${id}`);
  return data;
}