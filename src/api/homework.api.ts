import { apiClient } from "../lib/apiClient";
import type { ApiResponse } from "../types/api";
import type {
  Homework,
  HomeworkFormValues,
  HomeworkSubmissionRosterEntry,
  SubmissionReviewStatus,
} from "../types/homework";

export async function getHomeworks(params?: {
  class_id?: string;
  subject_id?: string;
  teacher_id?: string;
  is_published?: boolean;
}) {
  const { data } = await apiClient.get<ApiResponse<Homework[]>>("/tenant/getallhomework", { params });
  return data.data ?? [];
}

export async function getHomeworkById(id: string) {
  const { data } = await apiClient.get<ApiResponse<Homework>>(`/tenant/gethomeworkById/${id}`);
  return data.data;
}

// POST /createhomework is wired with uploadS3.any(), so multipart is required
// even without attachments — same pattern as createStudent/createStaff.
export async function createHomework(values: HomeworkFormValues) {
  const formData = new FormData();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== "") formData.append(key, String(value));
  });

  const { data } = await apiClient.post<ApiResponse<Homework>>("/tenant/createhomework", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function updateHomework(id: string, values: Partial<HomeworkFormValues>) {
  const { data } = await apiClient.put<ApiResponse<Homework>>(`/tenant/updatehomeworkById/${id}`, values);
  return data;
}

export async function publishHomework(id: string) {
  const { data } = await apiClient.put<ApiResponse<Homework>>(`/tenant/homework/${id}/publish`, {});
  return data;
}

export async function deleteHomework(id: string) {
  const { data } = await apiClient.delete<ApiResponse>(`/tenant/deletehomeworkById/${id}`);
  return data;
}

export async function getSubmissionsByHomework(homeworkId: string) {
  const { data } = await apiClient.get<ApiResponse<HomeworkSubmissionRosterEntry[]> & { homework?: { id: string; title: string } }>(
    `/tenant/getsubmissionsbyhomeworkId/${homeworkId}`
  );
  return { data: data.data ?? [], homework: data.homework };
}

export async function updateHomeworkSubmission(
  id: string,
  values: { remarks?: string; status?: SubmissionReviewStatus }
) {
  const { data } = await apiClient.put<ApiResponse>(`/tenant/updatehomeworksubmissionById/${id}`, values);
  return data;
}