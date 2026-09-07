import { apiClient, getAuthToken } from "../lib/apiClient";
import { decodeJwtPayload } from "../lib/jwt";
import type { RazorpayConfigFormValues, RazorpayConfigStatus } from "../types/paymentSettings";

// These live under /organization, not /tenant — backend schools.js's
// saveRazorpayConfig/getRazorpayConfigStatus check `req.user.organization_id
// === :id` (or a super-admin token), so a school's own admin token works here
// as long as :id is that same school's own organization_id. No
// login/getUserById response currently surfaces organization_id as a plain
// field, so it's read straight off the JWT the app already holds.
function getMyOrganizationId(): string {
  const token = getAuthToken();
  const payload = token ? decodeJwtPayload<{ organization_id?: string }>(token) : null;
  if (!payload?.organization_id) {
    throw new Error("Couldn't determine your school's organization id from the current session.");
  }
  return payload.organization_id;
}

export async function getRazorpayConfigStatus() {
  const orgId = getMyOrganizationId();
  const { data } = await apiClient.get<{ data: RazorpayConfigStatus }>(
    `/organization/school/${orgId}/razorpay-config`
  );
  return data.data;
}

export async function saveRazorpayConfig(values: RazorpayConfigFormValues) {
  const orgId = getMyOrganizationId();
  const { data } = await apiClient.put<{ data: { razorpayKeyId: string; webhookConfigured: boolean } }>(
    `/organization/school/${orgId}/razorpay-config`,
    values
  );
  return data;
}