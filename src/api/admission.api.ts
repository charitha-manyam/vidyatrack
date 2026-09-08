import { apiClient } from "../lib/apiClient";
import type { ApiResponse } from "../types/api";
import type {
  Admission,
  AdmissionFormValues,
  AdmissionStage,
  AdmissionStageCounts,
  AdmissionStageList,
  ConfirmAdmission,
  ConfirmAdmissionFormValues,
} from "../types/admission";

async function fetchStage(url: string, school_code?: string): Promise<AdmissionStageList> {
  const { data } = await apiClient.get<ApiResponse<Admission[]> & { counts?: AdmissionStageCounts }>(
    url,
    { params: school_code ? { school_code } : undefined }
  );
  return { data: data.data ?? [], counts: data.counts };
}

const STAGE_URLS: Record<AdmissionStage, string> = {
  enquiry: "/tenant/getenquiries",
  interview: "/tenant/getinterviewlist",
  docs_verification: "/tenant/getdocsverificationlist",
  confirmed: "/tenant/getconfirmedadmissions",
  declined: "/tenant/getdeclinedadmissions",
};

export async function getAdmissionsByStage(stage: AdmissionStage, school_code?: string) {
  return fetchStage(STAGE_URLS[stage], school_code);
}

export async function getAdmissionById(id: string) {
  const { data } = await apiClient.get<ApiResponse<Admission>>(`/tenant/getadmissionById/${id}`);
  return data.data;
}

export async function createAdmission(values: AdmissionFormValues) {
  const { data } = await apiClient.post<ApiResponse<Admission>>("/tenant/createadmissions", values);
  return data;
}

export async function updateAdmission(id: string, values: Partial<AdmissionFormValues>) {
  const { data } = await apiClient.put<ApiResponse<Admission>>(`/tenant/updateadmissionById/${id}`, values);
  return data;
}

export async function deleteAdmission(id: string) {
  const { data } = await apiClient.delete<ApiResponse>(`/tenant/deleteadmissionById/${id}`);
  return data;
}

// Each stage transition below 400s with the admission's real current status if
// it isn't in the expected preceding stage — surfaced to the user as-is.
export async function shortlistToInterview(id: string) {
  const { data } = await apiClient.put<ApiResponse<Admission>>(`/tenant/shortlist-to-interview/${id}`, {});
  return data;
}

export async function shortlistToDocs(id: string) {
  const { data } = await apiClient.put<ApiResponse<Admission>>(`/tenant/shortlist-to-docs/${id}`, {});
  return data;
}

export async function confirmAdmissionStage(id: string) {
  const { data } = await apiClient.put<ApiResponse<Admission>>(`/tenant/confirm-admission/${id}`, {});
  return data;
}

export async function declineAdmission(id: string) {
  const { data } = await apiClient.put<ApiResponse<Admission>>(`/tenant/decline-admission/${id}`, {});
  return data;
}

export async function getConfirmAdmissions() {
  const { data } = await apiClient.get<ApiResponse<ConfirmAdmission[]>>("/tenant/getallconfirmadmissions");
  return data.data ?? [];
}

export async function createConfirmAdmission(values: ConfirmAdmissionFormValues) {
  const { data } = await apiClient.post<ApiResponse<ConfirmAdmission>>("/tenant/createconfirmadmission", values);
  return data;
}

export async function updateConfirmAdmission(id: string, values: Partial<ConfirmAdmissionFormValues>) {
  const { data } = await apiClient.put<ApiResponse<ConfirmAdmission>>(
    `/tenant/updateconfirmadmissionById/${id}`,
    values
  );
  return data;
}

export async function deleteConfirmAdmission(id: string) {
  const { data } = await apiClient.delete<ApiResponse>(`/tenant/deleteconfirmadmissionById/${id}`);
  return data;
}