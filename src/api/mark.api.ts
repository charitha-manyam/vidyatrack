import { apiClient } from "../lib/apiClient";
import type { ApiResponse } from "../types/api";
import type { MarkEntry, MarksReport, PublishResultsPayload, PublishScope, RosterStudent } from "../types/mark";

// Port of admin-portal's src/services/mark.api.ts — same four endpoints the
// web Marks page calls against backend/app/controllers/tenant/marks.js.

export async function getStudentsBySubject(params: {
  class_id: string;
  section_id: string;
  subject_id: string;
  academicYearId: string;
}) {
  const { data } = await apiClient.get<ApiResponse<RosterStudent[]>>("/tenant/studentsbysubject", { params });
  return data.data ?? [];
}

// getMarks wraps its report in an array ({ data: [report] }) even though it
// always returns exactly one report — unwrap the first element like the web
// portal's loader does via queryFn.
export async function getMarksReport(params: {
  exam_id: string;
  class_id: string;
  section_id: string;
  subject_id: string;
}): Promise<MarksReport | null> {
  const { data } = await apiClient.get<ApiResponse<MarksReport[]>>("/tenant/getallmarks", { params });
  return (data.data ?? [])[0] ?? null;
}

export async function createMarksBulk(marks: MarkEntry[], school_code: string) {
  const { data } = await apiClient.post<ApiResponse>("/tenant/marks/bulk", { marks, school_code });
  return data;
}

// STUDENT scope goes to a single student's own record — not reachable from
// the marks grid, so mobile only ever sends CLASS_SECTION / CLASS / ENTIRE_EXAM.
export function publishResults(payload: PublishResultsPayload) {
  return apiClient.post<ApiResponse>("/tenant/markspublish", payload);
}

export type { PublishScope };