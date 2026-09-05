export const MONTH_OPTIONS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

export type PaymentStatus = "Pending" | "Paid";

export interface Payslip {
  id: string;
  staff_id: string;
  staff_name?: string | null;
  academicYearId?: string | null;
  month: number;
  year: number;
  base_salary?: number;
  present_days?: number;
  absent_days?: number;
  bonus?: number;
  overtime?: number;
  extra_class_payment?: number;
  total_earnings?: number;
  gross_salary: number;
  total_deductions: number;
  net_salary: number;
  payment_status: PaymentStatus | string;
}

export interface MonthlyPayrollSummary {
  total_staff: number;
  total_gross_salary: number;
  total_deductions: number;
  total_net_salary: number;
  total_paid: number;
  total_pending: number;
}