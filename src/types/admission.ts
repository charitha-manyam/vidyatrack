export type AdmissionStage = "enquiry" | "interview" | "docs_verification" | "confirmed" | "declined";

export const ADMISSION_STAGES: { value: AdmissionStage; label: string }[] = [
  { value: "enquiry", label: "Enquiry" },
  { value: "interview", label: "Interview" },
  { value: "docs_verification", label: "Docs verification" },
  { value: "confirmed", label: "Confirmed" },
  { value: "declined", label: "Declined" },
];

export interface Admission {
  id: string;
  parent_name?: string | null;
  class: string;
  phone: string;
  email?: string | null;
  enquire_date?: string | null;
  enquire_source?: string | null;
  student_name: string;
  referred_by?: string | null;
  date_of_birth?: string | null;
  notes?: string | null;
  school_code: string;
  status: AdmissionStage;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdmissionFormValues {
  parent_name?: string;
  class: string;
  phone: string;
  email?: string;
  enquire_date?: string;
  enquire_source?: string;
  student_name: string;
  referred_by?: string;
  date_of_birth?: string;
  notes?: string;
  school_code: string;
}

export interface AdmissionStageCounts {
  enquiry: number;
  interview: number;
  docs_verification: number;
  confirmed: number;
  declined: number;
}

// Stage-list endpoints respond with the rows under `data` plus optional `counts`.
export interface AdmissionStageList {
  data: Admission[];
  counts?: AdmissionStageCounts;
}

// A genuinely separate table from Admission — supplementary enrollment details
// captured once a confirmed admission is actually being enrolled.
export interface ConfirmAdmission {
  id: string;
  student_name: string;
  parent?: string | null;
  class: string;
  adm_no?: string | null;
  annual_fee?: number | null;
  enquire_date?: string | null;
  section?: string | null;
  roll_no?: string | null;
  first_day_of_school?: string | null;
  notes?: string | null;
  school_code: string;
  createdAt?: string;
}

export interface ConfirmAdmissionFormValues {
  student_name: string;
  parent?: string;
  class: string;
  adm_no?: string;
  annual_fee?: number;
  enquire_date?: string;
  section?: string;
  roll_no?: string;
  first_day_of_school?: string;
  notes?: string;
  school_code: string;
}