export interface Student {
  id: string;
  first_name: string;
  last_name?: string | null;
  gender: "male" | "female" | "other";
  date_of_birth?: string | null;
  blood_group?: string | null;
  address?: string | null;
  photo?: string | null;
  class_id?: string | null;
  sectionId?: string | null;
  roll_number: string;
  admission_number?: string | null;
  admission_date?: string | null;
  status: "active" | "inactive" | "graduated" | "transferred";
  academicYearId?: string | null;
  school_id: string;
  school_code: string;
  parentId?: string | null;
  className?: string | null;
  sectionName?: string | null;
}

export interface SchoolClass {
  id: string;
  class_name: string;
  academicYearId: string;
  status: "active" | "inactive";
  total_strength?: number;
  sections_count?: number;
  class_strength?: number;
}

export interface Section {
  id: string;
  sectionName: string;
  classId: string;
  classTeacherId?: string | null;
  classTeacherName?: string | null;
  totalStrength: number;
  currentStrength?: number;
  availableSeats?: number;
  academicYearId: string;
  isDefault?: boolean;
  subjectCount?: number;
}

export interface Subject {
  id: string;
  subject_name?: string;
  name?: string;
  class_id?: string | null;
  sectionid?: string | null;
  teacher_id?: string | null;
  teacher_name?: string | null;
}

export interface StaffMember {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  role: string;
  emp_number: string;
  qualification?: string | null;
  salary?: number | null;
  status: "active" | "inactive" | "resigned" | "transferred";
  department?: { id: string; departmentName: string } | null;
  image?: string | null;
  date_of_join?: string | null;
}

export interface StaffStats {
  totalStaff: number;
  teacherCount: number;
  nonTeachingCount: number;
  pendingLeaves: number;
}

export interface PendingFeeBreakdownLine {
  feeHeadName: string | null;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: "PENDING" | "PARTIAL" | "PAID";
  dueDate: string | null;
  type: "fee" | "transport";
}

export interface PendingFeeSummaryItem {
  studentId: string;
  studentName: string;
  className: string | null;
  sectionName: string | null;
  totalAssignedAmount: number;
  totalPaidAmount: number;
  pendingAmount: number;
  feeBreakdown: PendingFeeBreakdownLine[];
}

export interface PendingFeeSummaryResponse {
  totalStudentsWithPendingFees: number;
  totalPendingAmount: number;
  data: PendingFeeSummaryItem[];
}

export const ATTENDANCE_STATUSES = ["present", "absent", "late", "half-day", "leave"] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export interface MarkAttendancePayload {
  class_id: string;
  section_id: string;
  teacher_id: string;
  date: string;
  academicYearId?: string;
  attendance: { studentId: string; status: AttendanceStatus }[];
}

export interface MarkAttendanceResult {
  status: boolean;
  total: number;
  present: number;
  absent: number;
  errors: { data: unknown; error: string }[];
}

export interface MonthlyAttendanceResponse {
  status: boolean;
  studentId: string;
  month: number;
  year: number;
  summary: {
    total: number;
    present: number;
    absent: number;
    present_dates: string[];
    absent_dates: string[];
  };
  records: unknown[];
}

export interface AbsenteeItem {
  student_id: string;
  student_name: string;
  absent_count: number;
}
