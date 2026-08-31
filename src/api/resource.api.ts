import { apiClient } from "../lib/apiClient";
import type { ApiResponse } from "../types/api";
import type { ResourceConfig } from "../config/resources";

// Generic CRUD calls for config-driven module screens. All endpoints are
// tenant-scoped routes under /tenant, same ones the admin-portal uses.
export async function listResource(config: ResourceConfig, studentId?: string) {
  const path = config.studentFiltered && studentId ? `${config.listPath}/${studentId}` : config.listPath;
  const { data } = await apiClient.get<ApiResponse<Record<string, unknown>[]>>(path);
  const payload = data.data;
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") return [payload as Record<string, unknown>];
  return [];
}

export async function createResource(config: ResourceConfig, values: Record<string, unknown>) {
  const { data } = await apiClient.post<ApiResponse>(config.createPath!, values);
  return data;
}

export async function updateResource(config: ResourceConfig, id: string, values: Record<string, unknown>) {
  const { data } = await apiClient.put<ApiResponse>(config.updatePath!(id), values);
  return data;
}

export async function deleteResource(config: ResourceConfig, id: string) {
  const method = config.deleteMethod ?? "delete";
  const path = config.deletePath!(id);
  const response =
    method === "post"
      ? await apiClient.post<ApiResponse>(path)
      : method === "put"
        ? await apiClient.put<ApiResponse>(path)
        : method === "patch"
          ? await apiClient.patch<ApiResponse>(path)
          : await apiClient.delete<ApiResponse>(path);
  const { data } = response;
  return data;
}

export async function runRowAction(
  action: { path: string; method?: "put" | "post" | "patch" },
  id: string,
  values?: Record<string, unknown>
) {
  const method = action.method ?? "put";
  const { data } = await apiClient[method]<ApiResponse>(action.path.replace("{id}", id), values);
  return data;
}
