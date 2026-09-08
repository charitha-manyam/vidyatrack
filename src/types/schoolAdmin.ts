export type SubscriptionStatus =
  | "TRIAL"
  | "PENDING"
  | "PAID"
  | "DUE"
  | "OVERDUE"
  | "SUSPENDED"
  | "CANCELLED";

export interface School {
  id: string;
  school_name: string;
  school_code: string;
  email: string;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  board?: string | null;
  address?: string | null;
  whatsappNumber?: string | null;
  website?: string | null;
  PrincipalName?: string | null;
  establishedYear?: number | null;
  totalSchoolstrength?: number | null;
  db_name: string;
  subscription_status: SubscriptionStatus;
  last_payment_date?: string | null;
  next_due_date?: string | null;
  grace_period_days?: number;
  is_active: boolean;
  locked_at?: string | null;
  locked_reason?: string | null;
  createdAt?: string;
}

export interface SchoolSubscriptionStatusRow {
  schoolId: string;
  schoolName: string;
  email: string;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  subscriptionStatus: string;
  planName?: string | null;
  billingCycle?: string | null;
  lastPaymentDate?: string | null;
  nextDueDate?: string | null;
  isActive: boolean;
  lockedAt?: string | null;
  lockedReason?: string | null;
}
