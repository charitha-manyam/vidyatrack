export type HolidayType = "public" | "optional" | "restricted";

export const HOLIDAY_TYPE_OPTIONS: { value: HolidayType; label: string }[] = [
  { value: "public", label: "Public" },
  { value: "optional", label: "Optional" },
  { value: "restricted", label: "Restricted" },
];

export interface Holiday {
  id: string;
  holidayname: string;
  date: string;
  type: HolidayType;
  note?: string | null;
  school_code: string;
  academicYearId?: string | null;
  createdAt?: string;
}

// /createholidays accepts either a single `date` or a `from_date`/`to_date`
// range (one holiday name expanded across every day in the range) — both
// shapes are supported here via optional fields.
export interface HolidayFormValues {
  holidayname: string;
  date?: string;
  from_date?: string;
  to_date?: string;
  type: HolidayType;
  note?: string;
  school_code: string;
  academicYearId?: string;
}

export interface BulkHolidayRow {
  holidayname: string;
  date?: string;
  from_date?: string;
  to_date?: string;
  type: HolidayType;
  note?: string;
  school_code: string;
  academicYearId?: string;
}