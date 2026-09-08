// Mirror of admin-portal's src/types/homework.ts — same shape the tenant
// /homework endpoints return, so both portals render identical data.

export interface Homework {
  id: string;
  title: string;
  description: string;
  submission_date: string;
  class_id: string;
  section_id?: string | null;
  subject_id?: string | null;
  teacher_id: string;
  academicYearId?: string | null;
  attachments?: string[];
  is_published: boolean;
  class?: { id: string; name?: string; class_name?: string } | null;
  section?: { id: string; name?: string; sectionName?: string } | null;
  subject?: { id: string; name?: string; subject_name?: string } | null;
  teacher?: { id: string; name?: string } | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface HomeworkFormValues {
  class_id: string;
  section_id?: string;
  subject_id?: string;
  teacher_id: string;
  title: string;
  description: string;
  submission_date: string;
  is_published?: boolean;
}

// The DB enum on HomeworkSubmission.status (used when marking a submission
// reviewed). Distinct from the roster's computed presence status below.
export type SubmissionReviewStatus = "submitted" | "reviewed";

export interface HomeworkSubmissionRosterEntry {
  student_id: string;
  student_name: string | null;
  roll_number: string | null;
  // Computed by getSubmissionsByHomeworkId — "submitted" | "not submitted",
  // not the DB status enum.
  status: "submitted" | "not submitted";
  submission_id: string | null;
  submission_date: string | null;
  remarks: string | null;
  file_url: string | null;
  submittedAt: string | null;
}