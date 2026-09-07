import { apiClient } from "../lib/apiClient";
import type { ApiResponse } from "../types/api";
import type {
  Concession,
  FeeHead,
  FeePayment,
  FeePaymentLink,
  FeeStructure,
  FeeSummaryDetail,
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

export async function createPaymentLink(values: { studentId: string; fee_type_id: string; expiresInHours?: number; amount?: number }) {
  const res = await apiClient.post<ApiResponse<FeePaymentLink>>("/tenant/createpaymentlink", {
    student_id: values.studentId,
    feeHeadMappingId: values.fee_type_id,
    expiresInHours: values.expiresInHours,
    amount: values.amount,
  });
  return unwrap(res);
}

export async function cancelPaymentLink(id: string) {
  const res = await apiClient.put<ApiResponse<unknown>>(`/tenant/cancelpaymentlink/${id}`);
  return unwrap(res);
}

// ---------------- Summaries ----------------
function numOf(v: unknown): number {
  const n = Number(v ?? 0);
  return isFinite(n) ? n : 0;
}

// The backend wraps the summary as { student, summary: { totalOriginal,
// totalDiscount, totalFinal, totalPaid, totalDue, overallStatus }, details }
// but the field names vary across versions. Normalise into the local shape the
// UI expects so stat cards and the fee-details table always render.
export async function getStudentFeeSummary(studentId: string): Promise<StudentFeeSummary | undefined> {
  const res = await apiClient.get<ApiResponse<unknown>>(`/tenant/getstudentfeesummary/${studentId}`);
  const raw: unknown = res.data?.data;
  if (!raw || typeof raw !== "object") return undefined;
  const obj = raw as Record<string, unknown>;
  const summaryObj =
    obj.summary && typeof obj.summary === "object" ? (obj.summary as Record<string, unknown>) : obj;

  const detailList: Record<string, unknown>[] = Array.isArray(obj.details)
    ? (obj.details as Record<string, unknown>[])
    : Array.isArray(obj.feeDetails)
      ? (obj.feeDetails as Record<string, unknown>[])
      : [];

  const details: FeeSummaryDetail[] = detailList.map((d) => ({
    fee_structure:
      (d.fee_structure as string) ?? (d.feeMappingId as string) ?? (d.feeStructureId as string) ?? undefined,
    fee_name: (d.fee_name as string) ?? (d.feeHeadName as string) ?? (d.feeName as string) ?? undefined,
    type: (d.type as string) ?? undefined,
    originalAmount: numOf(d.originalAmount),
    discountAmount: numOf(d.discountAmount),
    finalAmount: numOf(d.finalAmount),
    paidAmount: numOf(d.paidAmount),
    dueAmount: numOf(d.dueAmount),
    status: (d.status as string) ?? undefined,
    billingCycle: (d.billingCycle as string) ?? undefined,
    dueDate: (d.dueDate as string) ?? (d.due_date as string) ?? undefined,
  }));

  return {
    student_name: (obj.student_name as string) ?? ((obj.student as Record<string, unknown>)?.name as string) ?? undefined,
    class_name: (obj.class_name as string) ?? ((obj.student as Record<string, unknown>)?.className as string) ?? undefined,
    section_name: (obj.section_name as string) ?? ((obj.student as Record<string, unknown>)?.sectionName as string) ?? undefined,
    totalOriginalAmount: numOf(summaryObj.totalOriginalAmount ?? summaryObj.totalOriginal),
    totalDiscountAmount: numOf(summaryObj.totalDiscountAmount ?? summaryObj.totalDiscount),
    totalPaidAmount: numOf(summaryObj.totalPaidAmount ?? summaryObj.totalPaid),
    totalBalanceAmount: numOf(summaryObj.totalBalanceAmount ?? summaryObj.totalDue),
    details,
  };
}

export async function getPendingFeesBreakdown(): Promise<{
  items: PendingFeeBreakdownItem[];
  totals: PendingFeeTotals;
}> {
  const res = await apiClient.get<Record<string, unknown>>("/tenant/getallpendingsummary");
  const raw: unknown = res.data;
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const students = Array.isArray(obj.data) ? (obj.data as Record<string, unknown>[]) : [];
  const items: PendingFeeBreakdownItem[] = [];
  for (const student of students) {
    const breakdown = Array.isArray(student.feeBreakdown)
      ? (student.feeBreakdown as Record<string, unknown>[])
      : [];
    const base = {
      studentId: (student.studentId as string) ?? "",
      studentName: (student.studentName as string) ?? "Student",
      className: (student.className as string) ?? undefined,
      sectionName: (student.sectionName as string) ?? undefined,
    };
    for (const line of breakdown) {
      items.push({
        ...base,
        feeHeadName: (line.feeHeadName as string) ?? undefined,
        feeStructureId:
          (line.feeStructureId as string) ??
          (line.feeMappingId as string) ??
          (line.feeHeadMappingId as string) ??
          undefined,
        originalAmount: numOf(line.originalAmount),
        paidAmount: numOf(line.paidAmount),
        balanceAmount: numOf(line.dueAmount ?? line.balanceAmount),
        dueDate: (line.dueDate as string) ?? undefined,
        status: (line.status as string) ?? "PENDING",
      });
    }
  }
  return {
    items,
    totals: {
      totalPendingAmount: numOf(obj.totalPendingAmount),
      totalStudents: numOf(obj.totalStudentsWithPendingFees),
    },
  };
}