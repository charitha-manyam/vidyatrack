import { apiClient } from "../lib/apiClient";
import type { ApiResponse } from "../types/api";
import type { StudyMaterial, StudyMaterialFormValues } from "../types/studyMaterial";

// File picked by DocumentPicker/ImagePicker. On native it is appended to
// FormData as the RN {uri,name,type} object; on web the asset also carries a
// real File object which axios/the browser uploads directly.
export interface StudyMaterialPdfFile {
  uri?: string;
  name: string;
  mimeType?: string;
  size?: number;
  file?: File | null;
}

// GET /tenant/getallstudymaterials filters by class_id/section_id/subject_id
// and resolves the FK ids into { id, name } refs under `data`.
export async function getStudyMaterials(params?: {
  class_id?: string;
  section_id?: string;
  subject_id?: string;
}) {
  const { data } = await apiClient.get<ApiResponse<StudyMaterial[]>>("/tenant/getallstudymaterials", {
    params,
  });
  return data.data ?? [];
}

// POST/PUT sit behind uploadS3.any(), so multer only parses multipart/form-data
// — same contract as createStudent in school.api.ts.
async function toFormData(values: object, file?: StudyMaterialPdfFile): Promise<FormData> {
  const formData = new FormData();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      formData.append(key, String(value));
    }
  });
  if (file) {
    if (file.file) {
      // Web: append the real File object.
      formData.append("pdf", file.file, file.name);
    } else if (file.uri) {
      // React Native: { uri, name, type } tuple.
      formData.append(
        "pdf",
        { uri: file.uri, name: file.name, type: file.mimeType ?? "application/octet-stream" } as unknown as Blob
      );
    }
  }
  return formData;
}

export async function createStudyMaterial(values: StudyMaterialFormValues, file?: StudyMaterialPdfFile) {
  const formData = await toFormData(values, file);
  const { data } = await apiClient.post<ApiResponse<StudyMaterial>>("/tenant/createstudymaterial", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function updateStudyMaterial(
  id: string,
  values: Partial<StudyMaterialFormValues>,
  file?: StudyMaterialPdfFile
) {
  const formData = await toFormData(values, file);
  const { data } = await apiClient.put<ApiResponse<StudyMaterial>>(`/tenant/updatestudymaterialById/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function deleteStudyMaterial(id: string) {
  const { data } = await apiClient.delete<ApiResponse>(`/tenant/deletestudymaterialById/${id}`);
  return data;
}