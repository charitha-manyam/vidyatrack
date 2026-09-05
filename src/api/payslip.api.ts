import { apiClient } from "../lib/apiClient";
import type { ApiResponse } from "../types/api";
import type { MonthlyPayrollSummary, Payslip } from "../types/payslip";

export async function getPayslips(params?: {
  month?: number;
  year?: number;
  staff_id?: string;
  payment_status?: string;
  page?: number;
  limit?: number;
}) {
  const { data } = await apiClient.get<ApiResponse<Payslip[]>>("/tenant/getallpayslips", { params });
  return { data: data.data ?? [], totalRecords: (data as { totalRecords?: number }).totalRecords ?? 0 };
}

export async function getMonthlyPayrollSummary(month: number, year: number) {
  const { data } = await apiClient.get<ApiResponse<MonthlyPayrollSummary>>("/tenant/getmonthlypayrollsummary", {
    params: { month, year },
  });
  return data.data as MonthlyPayrollSummary;
}

export async function generatePayslip(values: {
  staff_id: string;
  month: number;
  year: number;
  academicYearId?: string;
  bonus?: number;
  overtime?: number;
  extra_class_payment?: number;
}) {
  const { data } = await apiClient.post<ApiResponse>("/tenant/createpayslips", values);
  return data;
}

export async function generateBulkPayslips(month: number, year: number) {
  const { data } = await apiClient.post<ApiResponse<{ generated_count: number }>>("/tenant/generatebulkpayslips", {
    month,
    year,
  });
  return data;
}