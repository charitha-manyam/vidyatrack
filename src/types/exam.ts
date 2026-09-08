export interface Exam {
  id: string;
  exam_name: string;
  academicYearId: string;
  academicYear?: { id: string; yearName: string } | null;
}

export interface ExamFormValues {
  exam_name: string;
  academicYearId: string;
}

export interface ExamsTimetableEntry {
  id: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  room_no?: string | null;
  syllabus?: string | null;
  academicYearId?: string | null;
  class?: { id: string; class_name: string } | null;
  section?: { id: string; sectionName: string } | null;
  subject?: { id: string; subject_name: string } | null;
  exam?: { id: string; exam_name: string } | null;
  teacher?: { id: string; name: string } | null;
}

export interface ExamsTimetableFormValues {
  class_id: string;
  subject_id: string;
  section_id: string;
  examnameid: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  room_no?: string;
  teacher_id?: string;
  syllabus?: string;
  academicYearId?: string;
}