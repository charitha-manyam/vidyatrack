import { apiClient } from "../lib/apiClient";
import type { ApiResponse } from "../types/api";
import type { PermissionCatalogEntry, RoleFormValues, TenantRole, TenantRoleDetail } from "../types/role";

// Same tenant role endpoints the admin-portal uses (src/services/role.api.ts).
export async function getRoles(search?: string) {
  const { data } = await apiClient.get<ApiResponse<TenantRole[]>>("/tenant/getallroles", {
    params: search ? { search } : undefined,
  });
  return data.data ?? [];
}

export async function getRoleById(id: string) {
  const { data } = await apiClient.get<ApiResponse<TenantRoleDetail>>(`/tenant/getroleById/${id}`);
  return data.data;
}

export async function createRole(values: RoleFormValues) {
  const { data } = await apiClient.post<ApiResponse<TenantRole>>("/tenant/createrole", values);
  return data;
}

export async function updateRole(id: string, values: Partial<RoleFormValues>) {
  const { data } = await apiClient.put<ApiResponse<TenantRole>>(`/tenant/updateroleById/${id}`, values);
  return data;
}

export async function deleteRole(id: string) {
  const { data } = await apiClient.delete<ApiResponse>(`/tenant/deleteroleById/${id}`);
  return data;
}

// Source of truth for the module×action picker grid — mirrors the live
// TenantPermission table, not our rbac.ts (which only knows the module list
// for nav-gating, not the assignable action grid).
export async function getPermissionCatalog() {
  const { data } = await apiClient.get<ApiResponse<PermissionCatalogEntry[]>>(
    "/tenant/getpermissioncatalog"
  );
  return data.data ?? [];
}
