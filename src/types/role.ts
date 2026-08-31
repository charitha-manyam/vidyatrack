export interface TenantRole {
  id: string;
  name: string;
  description?: string | null;
  is_system_default: boolean;
  permissionCount?: number;
  staffCount?: number;
  createdAt?: string;
}

export interface RolePermission {
  module: string;
  actions: string[];
}

export interface TenantRoleDetail extends TenantRole {
  permissions: RolePermission[];
  staff: { id: string; name: string; email?: string; phone?: string }[];
}

export interface RoleFormValues {
  name: string;
  description?: string;
  permissions: RolePermission[];
}

// One entry per module in the catalog, e.g. { module: "Fees", actions: ["create","read","update","delete"] }
export type PermissionCatalogEntry = RolePermission;
