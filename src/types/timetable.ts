export interface TimetableEntry {
  id: string;
  day_of_week: string;
  class_id: string;
  section_id: string;
  teacher_id: string;
  subject_id?: string | null;
  period_no?: number | null;
  time_sloat?: string | null;
  room_no?: string | null;
  academicYearId?: string | null;
  class?: { id: string; class_name: string } | null;
  section?: { id: string; sectionName: string } | null;
  subject?: { id: string; subject_name: string } | null;
  teacher?: { id: string; name: string } | null;
}

export const DAYS_OF_WEEK = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

export interface TimetableFormValues {
  day_of_week: string;
  class_id: string;
  section_id: string;
  teacher_id: string;
  subject_id?: string;
  period_no?: number;
  time_sloat?: string;
  room_no?: string;
  academicYearId?: string;
}

export interface BulkTimetableError {
  row: number;
  day?: string;
  teacher_id?: string;
  message: string;
}

export interface BulkTimetableResult {
  inserted: number;
  failed: number;
  skipped: number;
  errors: BulkTimetableError[];
}