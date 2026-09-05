// Mirrors the fee-related models/request shapes used by admin-portal's
// features/fees module and the backend_2 tenant controllers. Field names
// match what the backend returns / expects (mostly camelCase with a few
// snake_case holdovers, kept exactly as the API sends them).

export const BILLING_CYCLE_OPTIONS = [
  { value: "ONE_TIME", label: "One time" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "ANNUAL", label: "Annual" },
];

export const APPLICABLE_TO_OPTIONS = [
  { value: "ALL_STUDENTS", label: "All students in this class/section" },
  { value: "SELECTED_STUDENTS", label: "Selected students only" },
];

export const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

export const PAYMENT_MODE_OPTIONS = [
  { value: "counter", label: "Counter" },
  { value: "online", label: "Online" },
  { value: "cash", label: "Cash" },
  { value: "cheque", label: "Cheque" },
  { value: "upi", label: "UPI" },
];

export const CONCESSION_TYPE_OPTIONS = [
  { value: "PERCENTAGE_OF_FEE", label: "% of total fee" },
  { value: "FLAT_AMOUNT", label: "Flat amount" },
  { value: "SIBLING_DISCOUNT", label: "Sibling discount" },
  { value: "OTHER", label: "Other" },
];

export const DISCOUNT_TYPE_OPTIONS = [
  { value: "PERCENTAGE", label: "Percentage (%)" },
  { value: "AMOUNT", label: "Fixed amount (Rs)" },
];

export const ASSIGNMENT_STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "PARTIAL", label: "Partial paid" },
  { value: "PAID", label: "Paid" },
];

export interface FeeHead {
  id: string;
  feeName: string;
  status?: string;
  displayOrder?: string | number;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FeeStructure {
  id: string;
  feeHeadId: string;
  academicYearId?: string;
  classId?: string;
  sectionId?: string;
  amount: number;
  dueDate: string;
  isMandatory: boolean;
  applicableTo: string;
  allowConcession: boolean;
  billingCycle: string;
  status: string;
  selectedStudentIds?: string[];
  feeName?: string;
  className?: string;
  sectionName?: string;
  yearName?: string;
}

export interface StudentFeeAssignment {
  id: string;
  studentId: string;
  feeStructureId: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: string;
  studentName?: string;
  feeHeadName?: string;
  createdAt?: string;
}

export interface Concession {
  id: string;
  studentId: string;
  feeStructureId: string;
  concessionType: string;
  discountType: string;
  discountValue: number;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  status?: string;
  reason?: string;
  effectiveFrom: string;
  effectiveUntil: string;
  studentName?: string;
  feeHeadName?: string;
  createdAt?: string;
}

export interface FeePayment {
  id: string;
  studentId?: string;
  student_id?: string;
  class_id?: string;
  section_id?: string;
  className?: string;
  sectionName?: string;
  studentName?: string;
  payment_mode: string;
  amount: number;
  topay: number;
  receipt_no?: string;
  transaction_id?: string;
  payment_date?: string;
  createdAt?: string;
}

export interface FeePaymentLink {
  id?: string;
  link_id?: string;
  studentName?: string;
  className?: string;
  sectionName?: string;
  feeHeadName?: string;
  assignmentId?: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  status: string;
  url?: string;
  expiresInHours?: number;
  created_at?: string;
  expires_at?: string;
  qr_code_url?: string;
}

export interface FeeSummaryDetail {
  fee_structure?: string;
  fee_name?: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status?: string;
  billingCycle?: string;
  dueDate?: string;
}

export interface StudentFeeSummary {
  student_name?: string;
  class_name?: string;
  section_name?: string;
  totalOriginalAmount: number;
  totalDiscountAmount: number;
  totalPaidAmount: number;
  totalBalanceAmount: number;
  details?: FeeSummaryDetail[];
}

export interface PendingFeeBreakdownItem {
  studentId: string;
  studentName: string;
  className?: string;
  sectionName?: string;
  feeHeadName?: string;
  feeStructureId?: string;
  originalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  dueDate?: string;
}

export interface PendingFeeTotals {
  totalPendingAmount: number;
  totalStudents: number;
}