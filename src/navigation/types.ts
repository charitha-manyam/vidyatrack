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
  Fees: NavigatorScreenParams<FeesStackParamList>;
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
  TransportRoutes: undefined;
  TransportRouteForm: { routeId?: string } | undefined;
  StudentTransport: undefined;
  StudentAssignForm: undefined;
  Vehicles: undefined;
  VehicleForm: { vehicleId?: string } | undefined;
  VehicleAssignments: undefined;
  VehicleAssignmentForm: undefined;
  TransportFees: undefined;
  TransportFeeForm: { transportFeeId?: string } | undefined;
  LiveTracking: undefined;
  Reports: undefined;
  AccountantReports: undefined;
  StudyMaterials: undefined;
  Announcements: undefined;
  Complaints: undefined;
  Holidays: undefined;
  Admissions: undefined;
  ConfirmAdmissions: undefined;
  Homeworks: undefined;
  HomeworkForm: { homeworkId?: string; title?: string } | undefined;
  HomeworkSubmissions: { homeworkId: string; title: string };
  Marks: undefined;
  Exams: undefined;
  ExamsTimetable: undefined;
  Timetable: undefined;
};

export type ParentMoreStackParamList = {
  MoreMenu: undefined;
  Children: undefined;
  Holidays: undefined;
  Announcements: undefined;
  Marks: undefined;
  Timetable: undefined;
  PaymentHistory: undefined;
  TrackMyBus: undefined;
  Complaints: undefined;
  Profile: undefined;
};

export type ParentTabParamList = {
  Home: undefined;
  Fees: undefined;
  Attendance: undefined;
  Homework: undefined;
  More: NavigatorScreenParams<ParentMoreStackParamList>;
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
  PaymentSettings: undefined;
};

export type StaffStackParamList = {
  StaffDirectory: undefined;
  StaffForm: { staffId?: string } | undefined;
};

export type StaffTabParamList = {
  Home: undefined;
  Students: NavigatorScreenParams<StudentsStackParamList>;
  Classes: NavigatorScreenParams<ClassesStackParamList>;
  Staff: NavigatorScreenParams<StaffStackParamList>;
  More: NavigatorScreenParams<MoreStackParamList>;
};

export type SuperAdminMoreStackParamList = {
  SuperAdminMoreMenu: undefined;
  Schools: undefined;
  Subscriptions: undefined;
  BillingPlans: undefined;
  SubscriptionPayments: undefined;
  PromoCodes: undefined;
  PricingPlans: undefined;
  Profile: undefined;
};

export type SuperAdminTabParamList = {
  Dashboard: undefined;
  More: NavigatorScreenParams<SuperAdminMoreStackParamList>;
};
