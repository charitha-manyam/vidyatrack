import { apiClient } from "../lib/apiClient";
import type { ApiResponse } from "../types/api";
import type {
  AbsenteeItem,
  AttendanceStatus,
  BulkStaffAttendanceResult,
  MarkAttendancePayload,
  MarkAttendanceResult,
  MonthlyAttendanceResponse,
  PendingFeeSummaryResponse,
  SchoolClass,
  Section,
  StaffAttendanceRecord,
  StaffListItem,
  StaffMember,
  StaffStats,
  Student,
  Subject,
} from "../types/school";

export interface StudentListParams {
  class_id?: string;
  sectionId?: string;
  status?: string;
  academicYearId?: string;
}

export async function getStudents(params?: StudentListParams) {
  const { data } = await apiClient.get<ApiResponse<Student[]>>("/tenant/getallstudents", { params });
  return data.data ?? [];
}

export async function getStudentById(id: string) {
  const { data } = await apiClient.get<ApiResponse<Student>>(`/tenant/getstudentsById/${id}`);
  return data.data;
}

export interface StudentFormValues {
  first_name: string;
  last_name?: string;
  gender: "male" | "female" | "other";
  roll_number: string;
  school_code: string;
  class_id?: string;
  sectionId?: string;
  admission_number?: string;
  date_of_birth?: string;
  address?: string;
  father_name?: string;
  mother_name?: string;
  father_email?: string;
  mother_email?: string;
  father_phone?: string;
  mother_phone?: string;
}

// POST /createstudents sits behind an S3-upload middleware on the backend, so
// it only parses multipart/form-data — same contract as the web portal.
export async function createStudent(values: StudentFormValues) {
  const formData = new FormData();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      formData.append(key, String(value));
    }
  });
  const { data } = await apiClient.post<ApiResponse<Student>>("/tenant/createstudents", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function updateStudent(id: string, values: Partial<StudentFormValues>) {
  const { data } = await apiClient.put<ApiResponse<Student>>(`/tenant/updatestudentById/${id}`, values);
  return data;
}

export async function deleteStudent(id: string) {
  const { data } = await apiClient.delete<ApiResponse>(`/tenant/deletestudentById/${id}`);
  return data;
}

export async function getClasses(academicYearId?: string) {
  const { data } = await apiClient.get<ApiResponse<SchoolClass[]>>("/tenant/getallclasses", {
    params: academicYearId ? { academicYearId } : undefined,
  });
  return data.data ?? [];
}

export interface ClassFormValues {
  class_name: string;
  academicYearId?: string;
}

export async function createClass(payload: ClassFormValues) {
  const { data } = await apiClient.post<ApiResponse<SchoolClass>>("/tenant/class", payload);
  return data;
}

export async function updateClass(id: string, payload: Partial<ClassFormValues>) {
  const { data } = await apiClient.put<ApiResponse<SchoolClass>>(`/tenant/updateclassById/${id}`, payload);
  return data;
}

export async function deleteClass(id: string) {
  const { data } = await apiClient.delete<ApiResponse>(`/tenant/deleteclassById/${id}`);
  return data;
}

export async function getSectionsByClass(classId: string) {
  const { data } = await apiClient.get<ApiResponse<Section[]>>(`/tenant/getsectionsbyclassId/${classId}`);
  return data.data ?? [];
}

export interface SectionFormValues {
  sectionName: string;
  classId: string;
  classTeacherId?: string;
  academicYearId?: string;
  totalStrength: number;
}

export async function createSection(payload: SectionFormValues) {
  const { data } = await apiClient.post<ApiResponse<Section>>("/tenant/createsections", payload);
  return data;
}

export async function updateSection(id: string, payload: Partial<SectionFormValues>) {
  const { data } = await apiClient.put<ApiResponse<Section>>(`/tenant/updatesection/${id}`, payload);
  return data;
}

export async function deleteSection(id: string) {
  const { data } = await apiClient.delete<ApiResponse>(`/tenant/deletesection/${id}`);
  return data;
}

export interface SubjectListParams {
  class_id?: string;
  sectionid?: string;
  teacher_id?: string;
  search?: string;
}

export async function getSubjects(params?: SubjectListParams) {
  const { data } = await apiClient.get<ApiResponse<Subject[]>>("/tenant/getallsubjects", { params });
  return data.data ?? [];
}

export interface StaffListParams {
  role?: string;
  search?: string;
  academicYearId?: string;
}

export async function getStaff(params?: StaffListParams) {
  const { data } = await apiClient.get<ApiResponse<StaffMember[]>>("/tenant/getallstaff", { params });
  return data.data ?? [];
}

export async function getStaffStats() {
  const { data } = await apiClient.get<ApiResponse<StaffStats>>("/tenant/staffstats");
  return data.data!;
}

export async function getStaffById(id: string) {
  const { data } = await apiClient.get<ApiResponse<StaffMember>>(`/tenant/getstaffById/${id}`);
  return data.data;
}

export async function getPendingFeeSummary() {
  const { data } = await apiClient.get<ApiResponse<unknown> & PendingFeeSummaryResponse>(
    "/tenant/getallpendingsummary"
  );
  return {
    totalStudentsWithPendingFees: data.totalStudentsWithPendingFees ?? 0,
    totalPendingAmount: data.totalPendingAmount ?? 0,
    items: data.data ?? [],
  };
}

export async function getAbsentMoreThan5Days(params?: { class_id?: string; section_id?: string }) {
  const { data } = await apiClient.get<ApiResponse<AbsenteeItem[]>>("/tenant/absentmorethan5days", { params });
  return data.data ?? [];
}

export async function markAttendance(payload: MarkAttendancePayload) {
  const { data } = await apiClient.post<MarkAttendanceResult>("/tenant/createattendance", payload);
  return data;
}

export async function getMonthlyAttendance(studentId: string, month: number, year: number) {
  const { data } = await apiClient.get<MonthlyAttendanceResponse>("/tenant/getMonthlyAttendanceByStudentId", {
    params: { studentId, month, year },
  });
  return data;
}

export async function getStaffList() {
  const { data } = await apiClient.get<ApiResponse<StaffListItem[]>>("/tenant/getallstaff");
  return data.data ?? [];
}

export async function bulkMarkStaffAttendance(records: StaffAttendanceRecord[], school_code: string) {
  const { data } = await apiClient.post<BulkStaffAttendanceResult>("/tenant/bulkaddstaffattendance", {
    attendance_records: records,
    school_code,
  });
  return data;
}

export type { AttendanceStatus };
