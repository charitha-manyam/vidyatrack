export type LeaveStatus = "pending" | "approved" | "rejected";

export interface Leave {
  id: string;
  staff_id: string;
  staff_name?: string | null;
  leave_type: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: LeaveStatus;
  approved_by?: string | null;
  approved_at?: string | null;
  remarks?: string | null;
}

export interface LeaveFormValues {
  staff_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  school_code: string;
  academicYearId?: string;
}

export const LEAVE_TYPES = ["casual", "sick", "personal", "emergency"] as const;
export type LeaveType = (typeof LEAVE_TYPES)[number];

export interface StaffLeaveAllocation {
  id: string;
  leave_type: LeaveType;
  allocated_days: number;
  academicYearId: string;
  school_code: string;
}