// Port of admin-portal's src/types/mark.ts — shapes match the tenant
// endpoints in backend/app/controllers/tenant/marks.js exactly.

export interface RosterStudent {
  student_id: string;
  admission_number?: string | null;
  // backend returns this under the aliased key `rollNumber`
  rollNumber?: string | number | null;
  student_name: string;
  class?: { id: string; name?: string | null } | null;
  section?: { id: string; name?: string | null } | null;
  subject?: { id: string; name?: string | null } | null;
  exam_id?: string | null;
}

export interface EnteredStudent {
  studentId: string;
  admissionNo?: string | null;
  studentName?: string | null;
  marksObtained: number;
  isPublished: boolean;
}

export type MarksReportStatus = "NOT_PUBLISHED" | "PARTIALLY_PUBLISHED" | "PUBLISHED";

export interface MarksReport {
  marksEntered: number;
  totalStudents: number;
  averageMarks: number;
  completionPercentage: number;
  status: MarksReportStatus;
  enteredStudents: EnteredStudent[];
}

export interface MarkEntry {
  student_id: string;
  exam_id: string;
  subject_id: string;
  marks_obtained: number;
  max_marks: number;
  school_code: string;
  class_id?: string;
  section_id?: string;
  is_absent?: boolean;
  remarks?: string;
}

export type PublishScope = "STUDENT" | "CLASS_SECTION" | "CLASS" | "ENTIRE_EXAM";

export interface PublishResultsPayload {
  exam_id: string;
  academicYearId: string;
  student_id?: string;
  class_id?: string;
  section_id?: string;
}