import { apiClient } from "../lib/apiClient";
import type { AcademicYear, MarketingExecutive, ParentInfo, Permission, RoleInfo } from "../types/auth";

// ============================================================
// School (Staff or Parent) — same tenant OTP flow for both;
// the backend tells us which one via `userType` on verify.
// ============================================================
export interface SchoolLoginPayload {
  schoolcode: string;
  email?: string;
  phonenumber?: string;
}

export interface SchoolLoginResult {
  status: boolean;
  message: string;
  userType: string;
  userId: string | number;
  otp?: string;
}

export interface SchoolVerifyOtpPayload extends SchoolLoginPayload {
  otp: string;
  userId?: string | number;
}

export interface SchoolVerifyOtpResult {
  status: boolean;
  message: string;
  token: string;
  userType: string;
  userId: string | number;
  name?: string;
  role?: RoleInfo | null;
  permissions?: Permission[];
  academicYear?: AcademicYear | null;
  parent?: ParentInfo;
}

export async function requestSchoolOtp(payload: SchoolLoginPayload) {
  const { data } = await apiClient.post<SchoolLoginResult>("/tenant/userlogin", payload);
  return data;
}

export async function resendSchoolOtp(payload: SchoolLoginPayload) {
  const { data } = await apiClient.post<SchoolLoginResult>("/tenant/resendotp", payload);
  return data;
}

export async function verifySchoolOtp(payload: SchoolVerifyOtpPayload) {
  const { data } = await apiClient.post<SchoolVerifyOtpResult>("/tenant/otpverify", payload);
  return data;
}

// ============================================================
// Marketing rep — phone only, no OTP (see app/controllers/
// marketingTarget.js#marketingLogin).
// ============================================================
export interface MarketingLoginResult {
  status: boolean;
  message: string;
  data: { token: string; executive: MarketingExecutive };
}

export async function marketingLogin(phone: string) {
  const { data } = await apiClient.post<MarketingLoginResult>("/organization/marketing/login", { phone });
  return data;
}

// ============================================================
// Super Admin — email + password (env-based login only, see
// app/controllers/superAdminAuth.js#loginWithEnv).
// ============================================================
export interface SuperAdminLoginResult {
  status: boolean;
  message: string;
  token: string;
  user: { email: string; role: string; permissions: Permission[] };
}

export async function superAdminLogin(email: string, password: string) {
  const { data } = await apiClient.post<SuperAdminLoginResult>("/organization/superadminlogin", {
    email,
    password,
  });
  return data;
}
