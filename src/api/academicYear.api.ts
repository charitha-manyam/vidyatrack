import { apiClient } from "../lib/apiClient";
import type { ApiResponse } from "../types/api";
import type { AcademicYearFormValues, AcademicYearFull } from "../types/academicYear";

// Same tenant academic-year endpoints the admin-portal uses
// (src/services/academicYear.api.ts).
export async function getAcademicYears() {
  const { data } = await apiClient.get<ApiResponse<AcademicYearFull[]>>("/tenant/getallacademicyears");
  return data.data ?? [];
}

export async function selectAcademicYear(academicYearId: string) {
  const { data } = await apiClient.patch<ApiResponse>("/tenant/academic-years/select", {
    academicYearId,
  });
  return data;
}

export async function createAcademicYear(values: AcademicYearFormValues) {
  const { data } = await apiClient.post<ApiResponse<AcademicYearFull>>("/tenant/academic-years", values);
  return data;
}

export async function updateAcademicYear(id: string, values: Partial<AcademicYearFormValues>) {
  const { data } = await apiClient.put<ApiResponse<AcademicYearFull>>(
    `/tenant/updateAcademicYear/${id}`,
    values
  );
  return data;
}

export async function deleteAcademicYear(id: string) {
  const { data } = await apiClient.delete<ApiResponse>(`/tenant/deleteacademicyear/${id}`);
  return data;
}
