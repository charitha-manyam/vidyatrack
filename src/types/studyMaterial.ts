// Mirrors the study material contract in school_2 + backend:
// list/filter endpoints attachRelated() the Class/Section/Subject/Staff rows
// into { id, name } refs; create/update sit behind uploadS3.any() so they
// only parse multipart/form-data (same contract as createStudent/createStaff).
export interface StudyMaterialRef {
  id: string;
  name: string;
}

export interface StudyMaterial {
  id: string;
  class?: StudyMaterialRef | null;
  section?: StudyMaterialRef | null;
  subject?: StudyMaterialRef | null;
  teacher?: StudyMaterialRef | null;
  title: string;
  description?: string | null;
  upload_date?: string | null;
  upload_type?: string | null;
  pdf?: string | null;
  createdAt?: string;
}

export interface StudyMaterialFormValues {
  class_id: string;
  section_id?: string;
  subject_id?: string;
  teacher_id?: string;
  title: string;
  description?: string;
  upload_date?: string;
  upload_type?: string;
}