export type ReportRange = "this_month" | "last_month" | "custom";

export const REPORT_RANGE_OPTIONS: { value: ReportRange; label: string }[] = [
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "custom", label: "Custom range" },
];

export type ReportFormat = "json" | "pdf" | "excel";

export interface ReportRangeFilters {
  report_range: ReportRange;
  from_date?: string;
  to_date?: string;
}

// POST /tenant/attendance-report is registered twice on the same router — the
// standalone attendanceReportController handler wins (registration order). Its
// contract is used here, not reports.js's dead version of the same path.
// class_id, section_id and academic_year_id are all mandatory (400 if any is
// missing).
export interface AttendanceReportRequest extends ReportRangeFilters {
  class_id: string;
  section_id: string;
  academic_year_id: string;
  format?: ReportFormat;
  emailreport?: boolean;
  email?: string;
}

export interface StudentReportSections {
  student_list?: boolean;
  admission_report?: boolean;
  transfer_report?: boolean;
  class_strength?: boolean;
  student_attendance?: boolean;
  student_attendance_by_id?: boolean;
}

export const STUDENT_REPORT_SECTIONS: { key: keyof StudentReportSections; label: string }[] = [
  { key: "student_list", label: "Student list" },
  { key: "admission_report", label: "Admissions in period" },
  { key: "transfer_report", label: "Transfers in period" },
  { key: "class_strength", label: "Class strength" },
  { key: "student_attendance", label: "Attendance summary" },
  { key: "student_attendance_by_id", label: "Attendance for student" },
];

export interface StudentReportRequest extends ReportRangeFilters {
  academic_year_id: string;
  class_id?: string;
  section_id?: string;
  student_id?: string;
  include_sections: StudentReportSections;
}

export interface StaffReportSections {
  staff_list?: boolean;
  staff_attendance?: boolean;
  leave_utilization?: boolean;
  payroll_report?: boolean;
  staff_attendance_by_id?: boolean;
}

export const STAFF_REPORT_SECTIONS: { key: keyof StaffReportSections; label: string }[] = [
  { key: "staff_list", label: "Staff list" },
  { key: "staff_attendance", label: "Attendance summary" },
  { key: "leave_utilization", label: "Leave utilization" },
  { key: "payroll_report", label: "Payroll report" },
  { key: "staff_attendance_by_id", label: "Attendance for staff" },
];

export interface StaffReportRequest extends ReportRangeFilters {
  academic_year_id: string;
  staff_id?: string;
  include_sections: StaffReportSections;
}

export interface MonthlyFeeCollectionReportSections {
  monthly_collection_summary?: boolean;
  student_overdue_list?: boolean;
  fee_breakdown?: boolean;
  partial_payments?: boolean;
  late_fee_report?: boolean;
}

export const MONTHLY_FEE_COLLECTION_REPORT_SECTIONS: {
  key: keyof MonthlyFeeCollectionReportSections;
  label: string;
}[] = [
  { key: "monthly_collection_summary", label: "Monthly collection summary" },
  { key: "student_overdue_list", label: "Student overdue list" },
  { key: "fee_breakdown", label: "Fee breakdown" },
  { key: "partial_payments", label: "Partial payments" },
  { key: "late_fee_report", label: "Late fee report" },
];

export interface MonthlyFeeCollectionReportRequest extends ReportRangeFilters {
  academic_year_id: string;
  class_id?: string;
  section_id?: string;
  student_id?: string;
  include_sections: MonthlyFeeCollectionReportSections;
}

// The four report-generation endpoints all resolve to a `status`-first object
// (attendance spreads the sections onto the top level; student/staff/fee wrap
// the modules under `data`). This shape captures just the common receipt.
export interface ReportGenerationResult {
  status: boolean;
  message?: string;
  report_id?: string;
  report_type?: string;
  report_period?: { from: string | null; to: string | null };
  generated_at?: string | null;
  download_url?: string | null;
  email_sent?: boolean;
  data?: Record<string, unknown> | null;
}

export interface RecentReport {
  report_id: string;
  report_type: string;
  report_period: { from: string | null; to: string | null };
  format?: string | null;
  email_report?: boolean;
  generated_on: string;
}

// Accountant Reports (controller: accountantReport.js under /tenant/reports)
export const ACCOUNTANT_REPORT_TYPES = [
  "monthly",
  "defaulters",
  "reconciliation",
  "annual",
  "payroll",
  "ledger",
] as const;
export type AccountantReportType = (typeof ACCOUNTANT_REPORT_TYPES)[number];

export const ACCOUNTANT_REPORT_TYPE_OPTIONS: { value: AccountantReportType; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "defaulters", label: "Defaulters" },
  { value: "reconciliation", label: "Reconciliation" },
  { value: "annual", label: "Annual" },
  { value: "payroll", label: "Payroll" },
  { value: "ledger", label: "Ledger" },
];

export const ACCOUNTANT_REPORT_MIN_OVERDUE_OPTIONS = ["7+ Days", "15+ Days", "30+ Days"] as const;
export type AccountantReportMinOverdue = (typeof ACCOUNTANT_REPORT_MIN_OVERDUE_OPTIONS)[number];

export const ACCOUNTANT_REPORT_FORMATS = ["PDF", "Excel"] as const;
export type AccountantReportFormat = (typeof ACCOUNTANT_REPORT_FORMATS)[number];

// generateReport only ever creates a row recording the requested parameters —
// there is nothing computed to view or download afterwards.
export interface AccountantReport {
  id: string;
  reportType: AccountantReportType;
  asOfDate: string;
  classFilter?: string | null;
  minOverdue?: AccountantReportMinOverdue | null;
  includeColumns?: string[] | null;
  format: AccountantReportFormat;
  sendTo?: string[] | null;
  school_code: string;
  academicYearId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AccountantReportFormValues {
  reportType: AccountantReportType;
  asOfDate: string;
  classFilter?: string;
  minOverdue?: AccountantReportMinOverdue;
  includeColumns?: string[];
  format: AccountantReportFormat;
  sendTo?: string[];
  school_code: string;
  academicYearId?: string;
}