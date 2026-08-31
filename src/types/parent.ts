export interface Child {
  id: string;
  name: string;
  rollNumber: string | null;
  status: string;
  className: string | null;
  sectionName: string | null;
}

export interface FeeSummary {
  student: { id: string; name: string };
  summary: {
    totalOriginal: number;
    totalDiscount: number;
    totalFinal: number;
    totalPaid: number;
    totalDue: number;
    overallStatus: "PAID" | "PARTIAL" | "PENDING";
  };
}

export interface FeeSummaryDetail {
  id: string;
  type: "fee" | "transport";
  feeHeadName: string | null;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  paidAmount: number;
  dueAmount: number;
  dueDate: string | null;
  status: "PAID" | "PARTIAL" | "PENDING";
}

// FeeSummary.details is optional on the wire — older backends omit it.
export interface FeeSummaryWithDetails extends FeeSummary {
  details?: FeeSummaryDetail[];
}

export type AttendanceStatus = "present" | "absent" | "late" | "half-day";

export interface AttendanceRecord {
  id: string;
  studentId: string;
  class_id: string;
  section_id: string;
  teacher_id: string;
  academicYearId?: string | null;
  date: string;
  status: AttendanceStatus;
}

// Flat response shape (not the usual {status, data} envelope).
export interface MonthlyAttendanceResponse {
  status: boolean;
  studentId: string;
  month: number;
  year: number;
  summary: {
    total: number;
    present: number;
    absent: number;
    present_dates?: string[];
    absent_dates?: string[];
  };
  records: AttendanceRecord[];
}

export type HomeworkSubmissionStatus = "not_submitted" | "submitted" | "reviewed";

export interface ChildHomeworkItem {
  id: string;
  title: string;
  description: string;
  submission_date: string;
  attachments?: string[] | null;
  subject: { id: string; name: string } | null;
  teacher: { id: string; name: string } | null;
  submission_status: HomeworkSubmissionStatus;
  submission_remarks: string | null;
  submitted_at: string | null;
}

export interface ChildMark {
  id: string;
  student_id: string;
  exam_id: string;
  exam_name: string | null;
  subject_id: string;
  subject_name: string | null;
  marks_obtained: number;
  max_marks: number;
  grade: string | null;
  remarks: string | null;
  is_absent: boolean;
  is_published: boolean;
}

export interface ChildTimetableEntry {
  id: string;
  period_no: number;
  // Real typo in the backend Timetable model — preserved.
  time_sloat: string;
  day_of_week: string;
  room_no?: string | null;
  subject: { id: string; subject_name: string } | null;
  teacher: { id: string; name: string } | null;
}

export interface Holiday {
  id: string;
  holidayname: string;
  date: string;
  type: "public" | "optional" | "restricted";
  note?: string | null;
}

export interface ParentAnnouncement {
  id: string;
  title: string;
  message: string;
  visible_until?: string | null;
  createdAt?: string;
}

export type ComplaintStatus = "pending" | "resolved" | "rejected";

export interface MyComplaint {
  id: string;
  subject: string;
  description: string;
  category: string;
  status: ComplaintStatus;
  resolution: string | null;
  createdAt: string;
}

export interface CreateComplaintPayload {
  subject: string;
  category: string;
  description: string;
}
