import type { Action } from "./rbac";

// Config-driven CRUD registry: every admin-portal module that doesn't have a
// bespoke mobile screen gets a real native list+form wired to the SAME tenant
// endpoints the web portal calls. Mirrors backend/app/routes/tenant.routes.js.

export interface SelectOption {
  label: string;
  value: string;
}

export interface FieldDef {
  key: string;
  label: string;
  type?: "text" | "number" | "date" | "time" | "textarea" | "select";
  required?: boolean;
  options?: SelectOption[];
  source?: "years" | "classes" | "sections" | "staff" | "students" | "subjects" | "exams" | "feeHeads" | "vehicles";
}

export interface RowAction {
  label: string;
  path: string; // supports "{id}" placeholder
  method?: "put" | "post" | "patch";
  confirm?: string;
  destructive?: boolean;
  visible?: (row: Record<string, unknown>) => boolean;
}

export interface ResourceConfig {
  id: string;
  title: string;
  description: string;
  module: string;
  readAction?: Action;
  createAction?: Action;
  updateAction?: Action;
  deleteAction?: Action;
  deleteMethod?: "delete" | "post" | "put" | "patch";
  listPath: string;
  // Resources whose backend list endpoint requires a :student_id segment
  studentFiltered?: boolean;
  createPath?: string;
  updatePath?: (id: string) => string;
  deletePath?: (id: string) => string;
  // Use a non-"id" row key for delete/update calls (e.g. announcement_id)
  mutationIdKey?: string;
  titleKey?: string;
  subtitleKeys?: string[];
  fields: FieldDef[];
  rowActions?: RowAction[];
}

const DAY_OPTIONS: SelectOption[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map(
  (d) => ({ label: d, value: d })
);
const STATUS_OPTIONS: SelectOption[] = [
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
];
const AUDIENCE_OPTIONS: SelectOption[] = [
  { label: "Parents", value: "parent" },
  { label: "Teachers", value: "teacher" },
  { label: "Students", value: "student" },
  { label: "Accountants", value: "accountant" },
];
const CONCESSION_TYPES: SelectOption[] = [
  { label: "Scholarship", value: "SCHOLARSHIP" },
  { label: "Sibling", value: "SIBLING" },
  { label: "Staff Child", value: "STAFF_CHILD" },
  { label: "Special", value: "SPECIAL" },
];
const DISCOUNT_TYPES: SelectOption[] = [
  { label: "Percentage", value: "PERCENTAGE" },
  { label: "Fixed", value: "FIXED" },
];

export const RESOURCES: Record<string, ResourceConfig> = {
  subjects: {
    id: "subjects",
    title: "Subjects",
    description: "Subjects taught across classes",
    module: "Subjects",
    listPath: "/tenant/getallsubjects",
    createPath: "/tenant/subjects",
    updatePath: (id) => `/tenant/updatesubjectById/${id}`,
    deletePath: (id) => `/tenant/deletesubjectById/${id}`,
    titleKey: "subject_name",
    fields: [
      { key: "subject_name", label: "Subject name", required: true },
      { key: "class_id", label: "Class", type: "select", required: true, source: "classes" },
      { key: "sectionid", label: "Section", type: "select", required: true, source: "sections" },
      { key: "teacher_id", label: "Teacher", type: "select", required: true, source: "staff" },
    ],
  },

  "school-working-days": {
    id: "school-working-days",
    title: "School Working Days",
    description: "Daily schedule and periods",
    module: "Classes",
    createAction: "create",
    listPath: "/tenant/getallschoolworkingdays",
    createPath: "/tenant/createschoolworkingday",
    updatePath: (id) => `/tenant/updateschoolworkingday/${id}`,
    deletePath: (id) => `/tenant/deleteschoolworkingday/${id}`,
    subtitleKeys: ["no_of_periods"],
    fields: [
      { key: "academicYearId", label: "Academic year", type: "select", source: "years" },
      { key: "start_time", label: "Start time", type: "time" },
      { key: "end_time", label: "End time", type: "time" },
      { key: "no_of_periods", label: "No. of periods", type: "number" },
      { key: "duration_of_period", label: "Period duration (min)", type: "number" },
    ],
  },

  timetable: {
    id: "timetable",
    title: "Timetable",
    description: "Class-wise weekly timetable",
    module: "Classes",
    listPath: "/tenant/getalltimetable",
    createPath: "/tenant/createtimetable",
    updatePath: (id) => `/tenant/updatetimetableById/${id}`,
    deletePath: (id) => `/tenant/deletetimetableById/${id}`,
    fields: [
      { key: "day_of_week", label: "Day", type: "select", required: true, options: DAY_OPTIONS },
      { key: "class_id", label: "Class", type: "select", required: true, source: "classes" },
      { key: "section_id", label: "Section", type: "select", required: true, source: "sections" },
      { key: "teacher_id", label: "Teacher", type: "select", required: true, source: "staff" },
      { key: "subject_id", label: "Subject", type: "select", source: "subjects" },
      { key: "period_no", label: "Period number", type: "number" },
      { key: "time_sloat", label: "Time slot" },
      { key: "room_no", label: "Room" },
    ],
  },

  exams: {
    id: "exams",
    title: "Exams",
    description: "Exam definitions per year",
    module: "Exams",
    listPath: "/tenant/getallexams",
    createPath: "/tenant/createexam",
    updatePath: (id) => `/tenant/updateexamById/${id}`,
    deletePath: (id) => `/tenant/deleteexamById/${id}`,
    titleKey: "exam_name",
    fields: [
      { key: "exam_name", label: "Exam name", required: true },
      { key: "academicYearId", label: "Academic year", type: "select", required: true, source: "years" },
    ],
  },

  "exams-timetable": {
    id: "exams-timetable",
    title: "Exams Timetable",
    description: "Subject-wise exam schedule",
    module: "Exams",
    listPath: "/tenant/exams-timetable",
    createPath: "/tenant/createexams-timetable",
    updatePath: (id) => `/tenant/updateexams-timetableById/${id}`,
    deletePath: (id) => `/tenant/deleteexams-timetableById/${id}`,
    fields: [
      { key: "examnameid", label: "Exam", type: "select", required: true, source: "exams" },
      { key: "class_id", label: "Class", type: "select", required: true, source: "classes" },
      { key: "section_id", label: "Section", type: "select", required: true, source: "sections" },
      { key: "subject_id", label: "Subject", type: "select", required: true, source: "subjects" },
      { key: "exam_date", label: "Exam date", type: "date", required: true },
      { key: "start_time", label: "Start time", type: "time", required: true },
      { key: "end_time", label: "End time", type: "time", required: true },
      { key: "room_no", label: "Room" },
      { key: "teacher_id", label: "Invigilator", type: "select", source: "staff" },
      { key: "syllabus", label: "Syllabus", type: "textarea" },
    ],
  },

  marks: {
    id: "marks",
    title: "Marks",
    description: "Recorded exam marks",
    module: "Results",
    listPath: "/tenant/getallmarks",
    deletePath: (id) => `/tenant/deletemarkById/${id}`,
    fields: [],
  },

  homework: {
    id: "homework",
    title: "Homework",
    description: "Homework assigned to classes",
    module: "Homework",
    listPath: "/tenant/getallhomework",
    createPath: "/tenant/createhomework",
    updatePath: (id) => `/tenant/updatehomeworkById/${id}`,
    deletePath: (id) => `/tenant/deletehomeworkById/${id}`,
    titleKey: "title",
    rowActions: [
      {
        label: "Publish",
        path: "/tenant/homework/{id}/publish",
        method: "put",
        confirm: "Publish this homework?",
        visible: (row) => !row.is_published,
      },
    ],
    fields: [
      { key: "title", label: "Title", required: true },
      { key: "description", label: "Description", type: "textarea", required: true },
      { key: "class_id", label: "Class", type: "select", required: true, source: "classes" },
      { key: "section_id", label: "Section", type: "select", source: "sections" },
      { key: "subject_id", label: "Subject", type: "select", source: "subjects" },
      { key: "teacher_id", label: "Teacher", type: "select", required: true, source: "staff" },
      { key: "submission_date", label: "Submission date", type: "date", required: true },
    ],
  },

  departments: {
    id: "departments",
    title: "Departments",
    description: "Staff departments",
    module: "Departments",
    listPath: "/tenant/getalldepartments",
    createPath: "/tenant/createdepartments",
    updatePath: (id) => `/tenant/updatedepartmentById/${id}`,
    deletePath: (id) => `/tenant/deletedepartmentById/${id}`,
    titleKey: "departmentName",
    fields: [
      { key: "departmentName", label: "Department name", required: true },
      { key: "academicYearId", label: "Academic year", type: "select", required: true, source: "years" },
    ],
  },

  designations: {
    id: "designations",
    title: "Designations",
    description: "Staff designations",
    module: "Designations",
    listPath: "/tenant/getalldesignations",
    createPath: "/tenant/createdesignations",
    updatePath: (id) => `/tenant/updatedesignationById/${id}`,
    deletePath: (id) => `/tenant/deletedesignationById/${id}`,
    titleKey: "name",
    fields: [
      { key: "name", label: "Designation name", required: true },
      { key: "academicYearId", label: "Academic year", type: "select", required: true, source: "years" },
    ],
  },

  "staff-attendance": {
    id: "staff-attendance",
    title: "Staff Attendance",
    description: "Daily staff attendance records",
    module: "Attendance",
    listPath: "/tenant/getallstaffattendance",
    fields: [],
  },

  leaves: {
    id: "leaves",
    title: "Leaves",
    description: "Staff leave requests",
    module: "TeachingStaff",
    listPath: "/tenant/getallleaves",
    createPath: "/tenant/createleaves",
    deletePath: (id) => `/tenant/deleteleaveById/${id}`,
    titleKey: "leave_type",
    subtitleKeys: ["start_date", "end_date", "status"],
    rowActions: [
      {
        label: "Approve",
        path: "/tenant/leaves/{id}/approve",
        method: "put",
        confirm: "Approve this leave request?",
        visible: (row) => String(row.status ?? "").toLowerCase() === "pending",
      },
      {
        label: "Reject",
        path: "/tenant/leaves/{id}/reject",
        method: "put",
        confirm: "Reject this leave request?",
        destructive: true,
        visible: (row) => String(row.status ?? "").toLowerCase() === "pending",
      },
    ],
    fields: [
      { key: "staff_id", label: "Staff member", type: "select", required: true, source: "staff" },
      { key: "leave_type", label: "Leave type", required: true },
      { key: "start_date", label: "Start date", type: "date", required: true },
      { key: "end_date", label: "End date", type: "date", required: true },
      { key: "reason", label: "Reason", type: "textarea", required: true },
    ],
  },

  "leave-allocations": {
    id: "leave-allocations",
    title: "Staff Leave Allocations",
    description: "Leave days allocated per staff",
    module: "NonTeachingStaff",
    listPath: "/tenant/getallleaveallocations",
    deletePath: (id) => `/tenant/deleteleaveallocation/${id}`,
    titleKey: "leave_type",
    subtitleKeys: ["allocated_days"],
    // Create is a bulk-array API on the backend — edit existing rows instead.
    fields: [{ key: "allocated_days", label: "Allocated days", type: "number" }],
  },

  payroll: {
    id: "payroll",
    title: "Payroll",
    description: "Salary structures per staff",
    module: "Accountents",
    listPath: "/tenant/getallpayroll",
    createPath: "/tenant/createpayroll",
    updatePath: (id) => `/tenant/updatepayrollById/${id}`,
    deletePath: (id) => `/tenant/deletepayrollById/${id}`,
    rowActions: [
      {
        label: "Process",
        path: "/tenant/payroll/{id}/process",
        method: "put",
        confirm: "Process payroll for this salary structure?",
      },
    ],
    fields: [
      { key: "staff_id", label: "Staff member", type: "select", required: true, source: "staff" },
      { key: "salary", label: "Basic salary", type: "number", required: true },
      { key: "hra", label: "HRA", type: "number" },
      { key: "pf_percentage", label: "PF %", type: "number" },
      { key: "professional_tax", label: "Professional tax", type: "number" },
      { key: "transport_allowance", label: "Transport allowance", type: "number" },
      { key: "tds_monthly", label: "TDS (monthly)", type: "number" },
      { key: "other_allowance", label: "Other allowance", type: "number" },
      { key: "effective_from", label: "Effective from", type: "date" },
    ],
  },

  payslips: {
    id: "payslips",
    title: "Payslips",
    description: "Generated payslips",
    module: "Accountents",
    listPath: "/tenant/getallpayslips",
    deletePath: (id) => `/tenant/deletepayslipById/${id}`,
    fields: [],
  },

  "fee-heads": {
    id: "fee-heads",
    title: "Fee Heads",
    description: "Fee categories",
    module: "Fees",
    listPath: "/tenant/getallfeeheads",
    createPath: "/tenant/addfeehead",
    updatePath: (id) => `/tenant/updatefeeheadById/${id}`,
    deletePath: (id) => `/tenant/deletefeeheadById/${id}`,
    titleKey: "feeName",
    fields: [
      { key: "feeName", label: "Fee head name", required: true },
      { key: "displayOrder", label: "Display order", type: "number" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
    ],
  },

  "fee-structures": {
    id: "fee-structures",
    title: "Fee Structures",
    description: "Class-wise fee mapping",
    module: "Fees",
    listPath: "/tenant/getallfeeheadmappings",
    createPath: "/tenant/addfee",
    updatePath: (id) => `/tenant/updatefeeheadmappingById/${id}`,
    deletePath: (id) => `/tenant/deletefeeheadmappingById/${id}`,
    subtitleKeys: ["amount", "dueDate"],
    fields: [
      { key: "feeHeadId", label: "Fee head", type: "select", required: true, source: "feeHeads" },
      { key: "academicYearId", label: "Academic year", type: "select", required: true, source: "years" },
      { key: "classId", label: "Class", type: "select", required: true, source: "classes" },
      { key: "sectionId", label: "Section", type: "select", source: "sections" },
      { key: "amount", label: "Amount", type: "number", required: true },
      { key: "dueDate", label: "Due date", type: "date" },
      { key: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
    ],
  },

  "fee-assignments": {
    id: "fee-assignments",
    title: "Student Fee Assignments",
    description: "Fees assigned to students",
    module: "Fees",
    listPath: "/tenant/getallassignments",
    createPath: "/tenant/createassignment",
    updatePath: (id) => `/tenant/updateassignment/${id}`,
    deletePath: (id) => `/tenant/deleteAssignment/${id}`,
    fields: [
      { key: "studentId", label: "Student", type: "select", required: true, source: "students" },
      { key: "originalAmount", label: "Original amount", type: "number", required: true },
      { key: "discountAmount", label: "Discount amount", type: "number" },
      { key: "paidAmount", label: "Paid amount", type: "number" },
    ],
  },

  concessions: {
    id: "concessions",
    title: "Concessions",
    description: "Fee concessions per student",
    module: "Fees",
    listPath: "/tenant/getallconcessions",
    createPath: "/tenant/addconcession",
    updatePath: (id) => `/tenant/updateconcessionById/${id}`,
    deletePath: (id) => `/tenant/deleteconcessionById/${id}`,
    fields: [
      { key: "studentId", label: "Student", type: "select", required: true, source: "students" },
      { key: "concessionType", label: "Type", type: "select", required: true, options: CONCESSION_TYPES },
      { key: "discountType", label: "Discount type", type: "select", options: DISCOUNT_TYPES },
      { key: "discountValue", label: "Discount value", type: "number", required: true },
      { key: "reason", label: "Reason", type: "textarea" },
    ],
  },

  payments: {
    id: "payments",
    title: "Fee Payments",
    description: "Collected fee payments",
    module: "Fees",
    listPath: "/tenant/getallpayments",
    createPath: "/tenant/createpayment",
    updatePath: (id) => `/tenant/updatepaymentById/${id}`,
    deletePath: (id) => `/tenant/deletepaymentById/${id}`,
    subtitleKeys: ["receipt_no", "amount"],
    fields: [
      { key: "class_id", label: "Class", type: "select", required: true, source: "classes" },
      { key: "section_id", label: "Section", type: "select", source: "sections" },
      { key: "student_id", label: "Student", type: "select", required: true, source: "students" },
      { key: "payment_mode", label: "Payment mode", required: true },
      { key: "topay", label: "To pay", type: "number", required: true },
      { key: "amount", label: "Amount paid", type: "number", required: true },
      { key: "receipt_no", label: "Receipt no." },
      { key: "transaction_id", label: "Transaction ID" },
      { key: "payment_date", label: "Payment date", type: "date", required: true },
    ],
  },

  "payment-links": {
    id: "payment-links",
    title: "Fee Payment Links",
    description: "Online payment links sent to parents",
    module: "Fees",
    listPath: "/tenant/getpaymentlinksbystudent",
    studentFiltered: true,
    createPath: "/tenant/createpaymentlink",
    rowActions: [
      {
        label: "Cancel link",
        path: "/tenant/cancelpaymentlink/{id}",
        method: "put",
        confirm: "Cancel this payment link?",
        destructive: true,
      },
    ],
    subtitleKeys: ["amount", "status"],
    fields: [
      { key: "student_id", label: "Student", type: "select", required: true, source: "students" },
      { key: "amount", label: "Amount", type: "number", required: true },
    ],
  },

  "transport-routes": {
    id: "transport-routes",
    title: "Transport Routes",
    description: "Routes and fare slabs",
    module: "Transport",
    listPath: "/tenant/getalltransportroutes",
    createPath: "/tenant/addtransportroute",
    updatePath: (id) => `/tenant/updatetransportrouteById/${id}`,
    deletePath: (id) => `/tenant/deletetransportrouteById/${id}`,
    titleKey: "name",
    subtitleKeys: ["monthlyfee", "annuallyfee"],
    fields: [
      { key: "name", label: "Route name", required: true },
      { key: "fromkm", label: "From (km)", type: "number" },
      { key: "tokm", label: "To (km)", type: "number" },
      { key: "monthlyfee", label: "Monthly fee", type: "number" },
      { key: "annuallyfee", label: "Annual fee", type: "number" },
    ],
  },

  "student-transport": {
    id: "student-transport",
    title: "Student Transport",
    description: "Students assigned to routes",
    module: "Transport",
    listPath: "/tenant/getstudenttransportbystudent",
    studentFiltered: true,
    createPath: "/tenant/assignstudenttransport",
    deletePath: () => `/tenant/removestudenttransport`,
    mutationIdKey: "studentId",
    fields: [
      { key: "studentId", label: "Student", type: "select", required: true, source: "students" },
      { key: "slabId", label: "Route slab ID", required: true },
    ],
  },

  vehicles: {
    id: "vehicles",
    title: "Vehicles",
    description: "School transport fleet",
    module: "Transport",
    listPath: "/tenant/getallvehicles",
    createPath: "/tenant/createvehicle",
    updatePath: (id) => `/tenant/updatevehicleById/${id}`,
    deletePath: (id) => `/tenant/deletevehicleById/${id}`,
    titleKey: "vehicle_number",
    fields: [
      { key: "vehicle_number", label: "Vehicle number", required: true },
      { key: "vehicle_type", label: "Vehicle type" },
      { key: "capacity", label: "Capacity", type: "number" },
      { key: "model", label: "Model" },
      { key: "driver_name", label: "Driver name" },
    ],
  },

  "vehicle-assignments": {
    id: "vehicle-assignments",
    title: "Vehicle Assignments",
    description: "Vehicles assigned to routes",
    module: "Transport",
    listPath: "/tenant/getvehicleassignments",
    createPath: "/tenant/assignvehicle",
    deletePath: (id) => `/tenant/removevehicleassignment/${id}`,
    fields: [
      { key: "vehicleId", label: "Vehicle", type: "select", required: true, source: "vehicles" },
      { key: "slabId", label: "Route slab ID", required: true },
      { key: "driverStaffId", label: "Driver (staff)", type: "select", required: true, source: "staff" },
    ],
  },

  "live-tracking": {
    id: "live-tracking",
    title: "Live Tracking",
    description: "Current vehicle locations",
    module: "Transport",
    listPath: "/tenant/getallvehiclelocations",
    fields: [],
  },

  "transport-fees": {
    id: "transport-fees",
    title: "Transport Fees",
    description: "Route fee collections",
    module: "Transport Fees",
    listPath: "/tenant/getalltransportfees",
    fields: [],
  },

  reports: {
    id: "reports",
    title: "Reports",
    description: "Generated school reports",
    module: "Accountents",
    listPath: "/tenant/getallreports",
    deletePath: (id) => `/tenant/deletereportById/${id}`,
    fields: [],
  },

  "accountant-reports": {
    id: "accountant-reports",
    title: "Accountant Reports",
    description: "Outstanding fee reports",
    module: "Accountents",
    listPath: "/tenant/getreports",
    deletePath: (id) => `/tenant/deletereport/${id}`,
    fields: [],
  },

  "study-materials": {
    id: "study-materials",
    title: "Study Materials",
    description: "Shared study material",
    module: "Study Materials",
    listPath: "/tenant/getallstudymaterials",
    deletePath: (id) => `/tenant/deletestudymaterial/${id}`,
    fields: [],
  },

  announcements: {
    id: "announcements",
    title: "Announcements",
    description: "Notices by audience",
    module: "Announcements",
    listPath: "/tenant/getallannouncements",
    createPath: "/tenant/createannouncements",
    updatePath: (id) => `/tenant/updateannouncements/${id}`,
    deletePath: (id) => `/tenant/deleteannouncements/${id}`,
    mutationIdKey: "announcement_id",
    titleKey: "title",
    fields: [
      { key: "title", label: "Title", required: true },
      { key: "message", label: "Message", type: "textarea", required: true },
      { key: "audience", label: "Audience", type: "select", options: AUDIENCE_OPTIONS },
      { key: "visible_until", label: "Visible until", type: "date" },
    ],
  },

  complaints: {
    id: "complaints",
    title: "Complaints",
    description: "Support tickets from parents",
    module: "Support Tickets",
    listPath: "/tenant/getallcomplaints",
    titleKey: "subject",
    rowActions: [
      {
        label: "Resolve",
        path: "/tenant/resolvecomplaint/{id}",
        method: "put",
        confirm: "Mark this complaint as resolved?",
        visible: (row) => String(row.status ?? "").toLowerCase() !== "resolved",
      },
      {
        label: "Reject",
        path: "/tenant/rejectcomplaint/{id}",
        method: "put",
        confirm: "Reject this complaint?",
        destructive: true,
        visible: (row) => String(row.status ?? "").toLowerCase() !== "resolved",
      },
    ],
    fields: [],
  },

  holidays: {
    id: "holidays",
    title: "Holidays",
    description: "Holiday calendar",
    module: "Classes",
    listPath: "/tenant/getallholidays",
    createPath: "/tenant/createholidays",
    updatePath: (id) => `/tenant/updateholidayById/${id}`,
    deletePath: (id) => `/tenant/deleteholidayById/${id}`,
    titleKey: "holidayname",
    subtitleKeys: ["start_date", "end_date"],
    fields: [
      { key: "holidayname", label: "Holiday name", required: true },
      { key: "start_date", label: "Start date", type: "date", required: true },
      { key: "end_date", label: "End date", type: "date" },
    ],
  },

  admissions: {
    id: "admissions",
    title: "Admissions",
    description: "Admission enquiries",
    module: "Students",
    listPath: "/tenant/getalladmissions",
    createPath: "/tenant/createadmissions",
    updatePath: (id) => `/tenant/updateadmissionById/${id}`,
    deletePath: (id) => `/tenant/deleteadmissionById/${id}`,
    titleKey: "student_name",
    subtitleKeys: ["class", "phone", "enquiry_status"],
    rowActions: [
      {
        label: "Call interview",
        path: "/tenant/shortlist-to-interview/{id}",
        method: "put",
        confirm: "Shortlist this enquiry to interview?",
      },
      {
        label: "Docs stage",
        path: "/tenant/shortlist-to-docs/{id}",
        method: "put",
        confirm: "Move to document verification?",
      },
      {
        label: "Confirm",
        path: "/tenant/confirm-admission/{id}",
        method: "put",
        confirm: "Confirm this admission?",
      },
      {
        label: "Decline",
        path: "/tenant/decline-admission/{id}",
        method: "put",
        confirm: "Decline this admission?",
        destructive: true,
      },
    ],
    fields: [
      { key: "student_name", label: "Student name", required: true },
      { key: "class", label: "Class applying for", required: true },
      { key: "phone", label: "Phone", required: true },
      { key: "parent_name", label: "Parent name" },
      { key: "email", label: "Email" },
      { key: "date_of_birth", label: "Date of birth", type: "date" },
      { key: "enquire_date", label: "Enquiry date", type: "date" },
      { key: "enquire_source", label: "Enquiry source" },
      { key: "referred_by", label: "Referred by" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },

  "confirm-admissions": {
    id: "confirm-admissions",
    title: "Confirm Admissions",
    description: "Confirmed student intakes",
    module: "Students",
    listPath: "/tenant/getallconfirmadmissions",
    createPath: "/tenant/createconfirmadmission",
    updatePath: (id) => `/tenant/updateconfirmadmissionById/${id}`,
    deletePath: (id) => `/tenant/deleteconfirmadmissionById/${id}`,
    titleKey: "student_name",
    subtitleKeys: ["adm_no", "class"],
    fields: [
      { key: "student_name", label: "Student name", required: true },
      { key: "adm_no", label: "Admission number", required: true },
      { key: "class", label: "Class", required: true },
      { key: "section", label: "Section" },
      { key: "roll_no", label: "Roll number" },
      { key: "annual_fee", label: "Annual fee", type: "number" },
      { key: "first_day_of_school", label: "First day of school", type: "date" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },
};

export function getResource(id: string): ResourceConfig | undefined {
  return RESOURCES[id];
}
