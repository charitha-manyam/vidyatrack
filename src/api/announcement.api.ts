import { apiClient } from "../lib/apiClient";
import type {
  Announcement,
  AnnouncementAudienceType,
  AnnouncementFormValues,
} from "../types/announcement";

// The tenant announcements controller (tenants/announcements.js) responds with
// { success, message, data } instead of this codebase's usual { status,
// message, data } envelope — normalized here so callers never have to know the
// difference.
interface TenantAnnouncementResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
}

// GET /getallannouncements is registered twice on the same router — a
// "master" controller's version (no organization filter, leaks announcements
// across every school on the platform) is registered first and permanently
// shadows the tenant-scoped one, since Express matches in registration order.
// Listing must go through the type-scoped endpoint instead, which is not
// shadowed and is properly filtered by organization_id from the auth token.
export async function getAnnouncementsByType(type: AnnouncementAudienceType) {
  const { data } = await apiClient.get<TenantAnnouncementResponse<Announcement[]>>(
    "/tenant/getannouncementsByType",
    { params: { type } }
  );
  return data.data ?? [];
}

export async function createAnnouncement(values: AnnouncementFormValues) {
  const { data } = await apiClient.post<TenantAnnouncementResponse<Announcement>>(
    "/tenant/createannouncements",
    {
      title: values.title,
      message: values.message,
      visible_until: values.visible_until || null,
      visibility_scope: { type: values.audience, departmentId: null, teamId: null, userId: null },
    }
  );
  return data;
}

export async function updateAnnouncement(id: string, values: Partial<AnnouncementFormValues>) {
  const payload: Record<string, unknown> = {};
  if (values.title !== undefined) payload.title = values.title;
  if (values.message !== undefined) payload.message = values.message;
  if (values.visible_until !== undefined) payload.visible_until = values.visible_until || null;
  if (values.audience !== undefined) {
    payload.visibility_scope = { type: values.audience, departmentId: null, teamId: null, userId: null };
  }
  const { data } = await apiClient.put<TenantAnnouncementResponse<Announcement>>(
    `/tenant/updateannouncements/${id}`,
    payload
  );
  return data;
}

// The backend 403s here if the logged-in user isn't the original author
// (announcement.user_id !== req.user.id) — surfaced to the user as-is rather
// than hiding the buttons preemptively, since authorship isn't reliably known
// client-side.
export async function deleteAnnouncement(id: string) {
  const { data } = await apiClient.delete<TenantAnnouncementResponse<unknown>>(
    `/tenant/deleteannouncements/${id}`
  );
  return data;
}