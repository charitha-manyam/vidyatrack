import type { NavigatorScreenParams } from "@react-navigation/native";

export type AuthStackParamList = {
  RoleSelect: undefined;
  SchoolLogin: undefined;
  SchoolOtp: { schoolcode: string; email?: string; phonenumber?: string; userId: string | number; otp?: string };
  MarketingLogin: undefined;
  SuperAdminLogin: undefined;
};

export type StudentsStackParamList = {
  StudentsList: undefined;
  StudentDetail: { studentId: string };
  StudentForm: { studentId?: string } | undefined;
};

export type ClassesStackParamList = {
  ClassesList: undefined;
  ClassDetail: { classId: string; className?: string };
  ClassForm: { classId?: string; className?: string } | undefined;
  SectionForm: {
    classId: string;
    className?: string;
    sectionId?: string;
    sectionName?: string;
    totalStrength?: number;
  };
};

export type MoreStackParamList = {
  MoreMenu: undefined;
  Roles: undefined;
  RoleForm: { roleId?: string } | undefined;
  AcademicYears: undefined;
  AcademicYearForm:
    | { yearId?: string; yearName?: string; startDate?: string; endDate?: string }
    | undefined;
  AcademicYearPromotion: { kind: "students" | "staff" };
  ModulePlaceholder: { title: string };
  ResourceList: { resourceId: string };
  ResourceForm: { resourceId: string; itemId?: string };
  MarkAttendance: undefined;
  AttendanceReport: undefined;
  StaffAttendance: undefined;
  Leaves: undefined;
  LeaveAllocations: undefined;
  Payslips: undefined;
  StaffDirectory: undefined;
  StaffForm: { staffId?: string } | undefined;
  Profile: undefined;
};

export type ParentMoreStackParamList = {
  MoreMenu: undefined;
  Children: undefined;
  Holidays: undefined;
  Announcements: undefined;
  Marks: undefined;
  Timetable: undefined;
  Complaints: undefined;
};

export type ParentTabParamList = {
  Home: undefined;
  Fees: undefined;
  Attendance: undefined;
  Homework: undefined;
  More: NavigatorScreenParams<ParentMoreStackParamList>;
  Profile: undefined;
};

export type FeesStackParamList = {
  FeesMenu: undefined;
  FeeHeads: undefined;
  FeeHeadForm: { feeHeadId?: string } | undefined;
  FeeStructures: undefined;
  FeeStructureForm: { feeStructureId?: string } | undefined;
  FeeAssignments: undefined;
  FeeAssignmentForm: { assignmentId?: string } | undefined;
  Concessions: undefined;
  ConcessionForm: { concessionId?: string } | undefined;
  FeePayments: undefined;
  FeePaymentForm: { paymentId?: string } | undefined;
  FeePaymentLinks: undefined;
  StudentFeeSummary: undefined;
  PendingFees: undefined;
};

export type StaffTabParamList = {
  Home: undefined;
  Students: NavigatorScreenParams<StudentsStackParamList>;
  Classes: NavigatorScreenParams<ClassesStackParamList>;
  Fees: NavigatorScreenParams<FeesStackParamList>;
  More: NavigatorScreenParams<MoreStackParamList>;
};
