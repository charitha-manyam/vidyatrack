import type { Permission } from "../types/auth";

// Port of admin-portal's src/config/rbac.ts — the single source of truth for
// "can this user do X" across the app. Mirrors the backend
// app/constants/tenantRbacCatalog.js EXACTLY, including the two real typos
// ("Libreray", "Accountents"), since those are the literal strings stored in
// the tenant Permissions table and returned verbatim in the `permissions`
// array from login/otpverify. Do not "fix" the spelling here without fixing
// it in the backend catalog first.
export const MODULES = {
  TEACHING_STAFF: "TeachingStaff",
  NON_TEACHING_STAFF: "NonTeachingStaff",
  STUDENTS: "Students",
  PARENTS: "Parents",
  FEES: "Fees",
  HOMEWORK: "Homework",
  CLASSES: "Classes",
  SUBJECTS: "Subjects",
  EXAMS: "Exams",
  ANNOUNCEMENTS: "Announcements",
  TUITIONS: "Tutions",
  TRANSPORT_FEES: "Transport Fees",
  STUDY_MATERIALS: "Study Materials",
  SUPPORT_TICKETS: "Support Tickets",
  NOTIFICATIONS: "Notifications",
  LIBRARY: "Libreray",
  RESULTS: "Results",
  ATTENDANCE: "Attendance",
  TRANSPORT: "Transport",
  STOCK: "Stock",
  ACCOUNTANTS: "Accountents",
  DEPARTMENTS: "Departments",
  DESIGNATIONS: "Designations",
  ROLES: "Roles",
} as const;

export type ModuleName = (typeof MODULES)[keyof typeof MODULES];

export type Action = "create" | "read" | "update" | "delete";

export function hasPermission(
  permissions: Permission[] | undefined | null,
  module: string,
  action: Action
): boolean {
  if (!permissions) return false;
  const entry = permissions.find((p) => p.module === module);
  return Boolean(entry?.actions.includes(action));
}

export interface NavItem {
  label: string;
  // The admin-portal route path for this item — kept identical so both apps
  // stay in sync; on mobile these paths are resolved to screens via a map.
  path: string;
  // null = always visible. An array means "visible if the user has this
  // action on ANY of these modules".
  module: ModuleName | ModuleName[] | null;
  action: Action;
}

function isNavItemVisible(item: NavItem, permissions: Permission[] | undefined | null): boolean {
  if (item.module === null) return true;
  const modules = Array.isArray(item.module) ? item.module : [item.module];
  return modules.some((m) => hasPermission(permissions, m, item.action));
}

export interface NavGroup {
  label: string;
  slug: string;
  items: NavItem[];
}

export function getVisibleNavGroups(permissions: Permission[] | undefined | null): NavGroup[] {
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => isNavItemVisible(item, permissions)),
  })).filter((group) => group.items.length > 0);
}

// Extend as new mobile screens are built — one entry per admin-portal nav
// path that has a native destination. Paths without an entry render the
// module placeholder screen instead.
export type MobileDestination =
  | { kind: "studentsList" }
  | { kind: "classesList" }
  | { kind: "feesTab" }
  | { kind: "more"; screen: MoreScreen }
  | { kind: "placeholder" };

export type MoreScreen =
  | "StaffDirectory"
  | "Roles"
  | "AcademicYears"
  | "MarkAttendance"
  | "AttendanceReport"
  | "ModulePlaceholder";

const DESTINATION_MAP: Record<string, MobileDestination> = {
  "/classes": { kind: "classesList" },
  "/academic-years": { kind: "more", screen: "AcademicYears" },
  "/students": { kind: "studentsList" },
  "/staff": { kind: "more", screen: "StaffDirectory" },
  "/roles": { kind: "more", screen: "Roles" },
  "/attendance": { kind: "more", screen: "MarkAttendance" },
  "/fees/pending": { kind: "feesTab" },
  "/fees/summary": { kind: "feesTab" },
};

export function resolveMobileDestination(path: string): MobileDestination {
  return DESTINATION_MAP[path] ?? { kind: "placeholder" };
}

// Same grouping/order as the admin-portal sidebar — the More tab renders
// these groups verbatim after filtering by the user's permissions.
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Academics",
    slug: "academics",
    items: [
      { label: "Classes & Sections", path: "/classes", module: MODULES.CLASSES, action: "read" },
      { label: "Academic Years", path: "/academic-years", module: MODULES.CLASSES, action: "create" },
      { label: "Subjects", path: "/subjects", module: MODULES.SUBJECTS, action: "read" },
      { label: "School Working Days", path: "/school-working-days", module: MODULES.CLASSES, action: "create" },
      { label: "Timetable", path: "/timetable", module: MODULES.CLASSES, action: "read" },
      { label: "Exams", path: "/exams", module: MODULES.EXAMS, action: "read" },
      { label: "Exams Timetable", path: "/exams-timetable", module: MODULES.EXAMS, action: "read" },
      { label: "Marks", path: "/marks", module: MODULES.RESULTS, action: "read" },
      { label: "Homework", path: "/homework", module: MODULES.HOMEWORK, action: "read" },
    ],
  },
  {
    label: "People & Access",
    slug: "people",
    items: [
      { label: "Students", path: "/students", module: MODULES.STUDENTS, action: "read" },
      { label: "Staff", path: "/staff", module: [MODULES.TEACHING_STAFF, MODULES.NON_TEACHING_STAFF], action: "read" },
      { label: "Departments", path: "/departments", module: MODULES.DEPARTMENTS, action: "read" },
      { label: "Designations", path: "/designations", module: MODULES.DESIGNATIONS, action: "read" },
      { label: "Roles & Permissions", path: "/roles", module: MODULES.ROLES, action: "read" },
    ],
  },
  {
    label: "Attendance & Leaves",
    slug: "attendance",
    items: [
      { label: "Attendance", path: "/attendance", module: MODULES.ATTENDANCE, action: "read" },
      { label: "Staff Attendance", path: "/staff-attendance", module: MODULES.ATTENDANCE, action: "read" },
      { label: "Leaves", path: "/leaves", module: [MODULES.TEACHING_STAFF, MODULES.NON_TEACHING_STAFF], action: "read" },
      {
        label: "Staff Leave Allocations",
        path: "/leave-allocations",
        module: [MODULES.TEACHING_STAFF, MODULES.NON_TEACHING_STAFF],
        action: "read",
      },
    ],
  },
  {
    label: "Payroll",
    slug: "payroll",
    items: [
      { label: "Payroll", path: "/payroll", module: MODULES.ACCOUNTANTS, action: "read" },
      { label: "Payslips", path: "/payslips", module: MODULES.ACCOUNTANTS, action: "read" },
    ],
  },
  {
    label: "Fees",
    slug: "fees",
    items: [
      { label: "Fee Heads", path: "/fees/heads", module: MODULES.FEES, action: "read" },
      { label: "Fee Structures", path: "/fees/structures", module: MODULES.FEES, action: "read" },
      { label: "Student Fee Assignments", path: "/fees/assignments", module: MODULES.FEES, action: "read" },
      { label: "Concessions", path: "/fees/concessions", module: MODULES.FEES, action: "read" },
      { label: "Fee Payments", path: "/fees/payments", module: MODULES.FEES, action: "read" },
      { label: "Fee Payment Links", path: "/fees/payment-links", module: MODULES.FEES, action: "read" },
      { label: "Student Fee Summary", path: "/fees/summary", module: MODULES.FEES, action: "read" },
      { label: "Pending Fees", path: "/fees/pending", module: MODULES.FEES, action: "read" },
      { label: "Payment Settings", path: "/fees/payment-settings", module: MODULES.FEES, action: "update" },
    ],
  },
  {
    label: "Transport",
    slug: "transport",
    items: [
      { label: "Transport Routes", path: "/transport/routes", module: MODULES.TRANSPORT, action: "read" },
      { label: "Student Transport", path: "/transport/assignments", module: MODULES.TRANSPORT, action: "read" },
      { label: "Vehicles", path: "/transport/vehicles", module: MODULES.TRANSPORT, action: "read" },
      { label: "Vehicle Assignments", path: "/transport/vehicle-assignments", module: MODULES.TRANSPORT, action: "read" },
      { label: "Live Tracking", path: "/transport/live-tracking", module: MODULES.TRANSPORT, action: "read" },
      { label: "Transport Fees", path: "/transport/fees", module: MODULES.TRANSPORT_FEES, action: "read" },
    ],
  },
  {
    label: "Reports",
    slug: "reports",
    items: [
      { label: "Reports", path: "/reports", module: MODULES.ACCOUNTANTS, action: "read" },
      { label: "Accountant Reports", path: "/reports/accountant", module: MODULES.ACCOUNTANTS, action: "read" },
    ],
  },
  {
    label: "Communication",
    slug: "communication",
    items: [
      { label: "Study Materials", path: "/study-materials", module: MODULES.STUDY_MATERIALS, action: "read" },
      { label: "Announcements", path: "/announcements", module: MODULES.ANNOUNCEMENTS, action: "read" },
      { label: "Complaints", path: "/complaints", module: MODULES.SUPPORT_TICKETS, action: "read" },
      { label: "Holidays", path: "/holidays", module: MODULES.CLASSES, action: "read" },
    ],
  },
  {
    label: "Admissions",
    slug: "admissions",
    items: [
      { label: "Admissions", path: "/admissions", module: MODULES.STUDENTS, action: "read" },
      { label: "Confirm Admissions", path: "/confirm-admissions", module: MODULES.STUDENTS, action: "read" },
    ],
  },
];
