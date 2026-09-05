import { apiClient } from "../lib/apiClient";
import type { ApiResponse } from "../types/api";
import type {
  Concession,
  FeeHead,
  FeePayment,
  FeePaymentLink,
  FeeStructure,
  PendingFeeBreakdownItem,
  PendingFeeTotals,
  StudentFeeAssignment,
  StudentFeeSummary,
} from "../types/fees";

// The tenant controllers wrap list payloads inconsistently — sometimes the
// array sits at data, sometimes behind a named key (rows/items/assignments…).
// This norm recognises any of those shapes.
function rowsOf<T>(res: { data?: unknown }, keys: string[] = []): T[] {
  const data = (res as { data?: unknown }).data;
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    for (const key of ["data", "rows", "items", "list", "records", ...keys]) {
      if (Array.isArray(obj[key])) return obj[key] as T[];
    }
  }
  return [];
}

function unwrap<T>(res: { data: ApiResponse<T> }): T | undefined {
  return res.data?.data;
}

// ---------------- Fee heads ----------------
export async function getFeeHeads(): Promise<FeeHead[]> {
  const res = await apiClient.get<ApiResponse<FeeHead[]>>("/tenant/getallfeeheads");
  return rowsOf<FeeHead>(res);
}

export async function getFeeHeadById(id: string): Promise<FeeHead | undefined> {
  const all = await getFeeHeads();
  return all.find((h) => h.id === id);
}

export async function createFeeHead(values: { feeName: string; displayOrder?: string; description?: string }) {
  const res = await apiClient.post<ApiResponse<FeeHead>>("/tenant/addfeehead", values);
  return unwrap(res);
}

export async function updateFeeHead(id: string, values: { feeName: string; displayOrder?: string; description?: string }) {
  const res = await apiClient.put<ApiResponse<FeeHead>>(`/tenant/updatefeeheadById/${id}`, values);
  return unwrap(res);
}

export async function deleteFeeHead(id: string) {
  const res = await apiClient.delete<ApiResponse<unknown>>(`/tenant/deletefeeheadById/${id}`);
  return unwrap(res);
}

// ---------------- Fee structures ----------------
export async function getFeeStructures(): Promise<FeeStructure[]> {
  const res = await apiClient.get<ApiResponse<FeeStructure[]>>("/tenant/getallfeeheadmappings");
  return rowsOf<FeeStructure>(res);
}

export async function createFeeStructure(values: Partial<FeeStructure>) {
  const res = await apiClient.post<ApiResponse<FeeStructure>>("/tenant/addfee", values);
  return unwrap(res);
}

export async function updateFeeStructure(id: string, values: Partial<FeeStructure>) {
  const res = await apiClient.put<ApiResponse<FeeStructure>>(`/tenant/updatefeeheadmappingById/${id}`, values);
  return unwrap(res);
}

export async function deleteFeeStructure(id: string) {
  const res = await apiClient.delete<ApiResponse<unknown>>(`/tenant/deletefeeheadmappingById/${id}`);
  return unwrap(res);
}

// ---------------- Student fee assignments ----------------
export async function getFeeAssignments(): Promise<StudentFeeAssignment[]> {
  const res = await apiClient.get<ApiResponse<StudentFeeAssignment[]>>("/tenant/getallassignments");
  return rowsOf<StudentFeeAssignment>(res, ["assignments"]);
}

export async function getAssignmentsByStudent(studentId: string): Promise<StudentFeeAssignment[]> {
  const res = await apiClient.get<ApiResponse<StudentFeeAssignment[]>>(`/tenant/getassignmentsbystudent/${studentId}`);
  return rowsOf<StudentFeeAssignment>(res, ["assignments"]);
}

export async function createFeeAssignment(values: {
  studentId: string;
  feeStructureId: string;
  originalAmount?: number;
  discountAmount?: number;
  paidAmount?: number;
}) {
  const res = await apiClient.post<ApiResponse<StudentFeeAssignment>>("/tenant/createassignment", values);
  return unwrap(res);
}

export async function bulkCreateAssignments(values: { feeStructureId: string; studentIds: string[] }): Promise<{ created?: number; message?: string } | undefined> {
  const res = await apiClient.post<ApiResponse<{ created?: number; message?: string }>>("/tenant/bulkcreateassignments", values);
  return unwrap(res);
}

export async function updateFeeAssignment(
  id: string,
  values: { originalAmount?: number; discountAmount?: number; paidAmount?: number }
) {
  const res = await apiClient.put<ApiResponse<StudentFeeAssignment>>(`/tenant/updateassignment/${id}`, values);
  return unwrap(res);
}

export async function deleteFeeAssignment(id: string) {
  const res = await apiClient.delete<ApiResponse<unknown>>(`/tenant/deleteAssignment/${id}`);
  return unwrap(res);
}

// ---------------- Concessions ----------------
export async function getConcessions(): Promise<Concession[]> {
  const res = await apiClient.get<ApiResponse<Concession[]>>("/tenant/getallconcessions");
  return rowsOf<Concession>(res, ["concessions"]);
}

export async function createConcession(values: {
  feeStructureId: string;
  concessionType: string;
  discountType: string;
  discountValue: number;
  reason?: string;
  effectiveFrom: string;
  effectiveUntil: string;
}) {
  const res = await apiClient.post<ApiResponse<Concession>>("/tenant/addconcession", values);
  return unwrap(res);
}

export async function updateConcession(
  id: string,
  values: { discountType: string; discountValue: number; reason?: string; effectiveFrom: string; effectiveUntil: string }
) {
  const res = await apiClient.put<ApiResponse<Concession>>(`/tenant/updateconcessionById/${id}`, values);
  return unwrap(res);
}

export async function deleteConcession(id: string) {
  const res = await apiClient.delete<ApiResponse<unknown>>(`/tenant/deleteconcessionById/${id}`);
  return unwrap(res);
}

// ---------------- Fee payments (records) ----------------
export async function getFeePayments(): Promise<FeePayment[]> {
  const res = await apiClient.get<ApiResponse<FeePayment[]>>("/tenant/getallrecordfeepayments");
  return rowsOf<FeePayment>(res, ["payments", "records"]);
}

export async function createFeePayment(values: {
  class_id: string;
  section_id: string;
  student_id: string;
  payment_mode: string;
  amount: number;
  topay: number;
  receipt_no?: string;
  transaction_id?: string;
  payment_date?: string;
}) {
  const res = await apiClient.post<ApiResponse<FeePayment>>("/tenant/createrecordfeepayment", values);
  return unwrap(res);
}

export async function updateFeePayment(
  id: string,
  values: {
    class_id: string;
    section_id: string;
    student_id: string;
    payment_mode: string;
    amount: number;
    topay: number;
    receipt_no?: string;
    transaction_id?: string;
    payment_date?: string;
  }
) {
  const res = await apiClient.put<ApiResponse<FeePayment>>(`/tenant/updaterecordfeepaymentById/${id}`, values);
  return unwrap(res);
}

export async function deleteFeePayment(id: string) {
  const res = await apiClient.delete<ApiResponse<unknown>>(`/tenant/deleterecordfeepaymentById/${id}`);
  return unwrap(res);
}

// ---------------- Fee payment links ----------------
export async function getPaymentLinksByStudent(studentId: string): Promise<FeePaymentLink[]> {
  const res = await apiClient.get<ApiResponse<FeePaymentLink[]>>(`/tenant/getpaymentlinksbystudent/${studentId}`);
  return rowsOf<FeePaymentLink>(res, ["links", "paymentLinks"]);
}

export async function createPaymentLink(values: { studentId: string; fee_type_id: string; expiresInHours?: number }) {
  const res = await apiClient.post<ApiResponse<FeePaymentLink>>("/tenant/createpaymentlink", values);
  return unwrap(res);
}

export async function cancelPaymentLink(id: string) {
  const res = await apiClient.put<ApiResponse<unknown>>(`/tenant/cancelpaymentlink/${id}`);
  return unwrap(res);
}

// ---------------- Summaries ----------------
export async function getStudentFeeSummary(studentId: string): Promise<StudentFeeSummary | undefined> {
  const res = await apiClient.get<ApiResponse<StudentFeeSummary>>(`/tenant/getstudentfeesummary/${studentId}`);
  return unwrap(res);
}

export async function getPendingFeesBreakdown(): Promise<{
  items: PendingFeeBreakdownItem[];
  totals: PendingFeeTotals;
}> {
  const res = await apiClient.get<ApiResponse<PendingFeeBreakdownItem[]>>("/tenant/getallpendingsummary");
  const raw: unknown = res.data;
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const arr = Array.isArray(raw) ? raw : Array.isArray(obj.data) ? (obj.data as PendingFeeBreakdownItem[]) : rowsOf<PendingFeeBreakdownItem>(res, ["items", "summary"]);
  return {
    items: arr,
    totals: {
      totalPendingAmount: Number(obj.totalPendingAmount ?? obj.totalPending ?? 0),
      totalStudents: Number(obj.totalStudents ?? (Array.isArray(obj.students) ? obj.students.length : 0)),
    },
  };
}