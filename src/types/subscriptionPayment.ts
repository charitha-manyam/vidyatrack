export type SubscriptionPaymentStatus = "PAID" | "UNPAID" | "DUE" | "OVERDUE" | (string & {});

export interface SubscriptionPaymentSchool {
  id: string;
  school_name: string;
  email: string;
  school_code: string;
}

export interface SubscriptionPayment {
  id: string;
  amount: string;
  schoolId: string;
  paymentDate?: string | null;
  paymentMode: string;
  razorpayPaymentId?: string | null;
  razorpayOrderId?: string | null;
  razorpaySubscriptionId?: string | null;
  description?: string | null;
  renewed?: boolean | null;
  status?: SubscriptionPaymentStatus | null;
  planName?: string | null;
  billingCycle?: string | null;
  promoCodeId?: string | null;
  discountApplied?: string | null;
  school?: SubscriptionPaymentSchool | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubscriptionPaymentFormValues {
  amount: string;
  schoolId: string;
  paymentDate?: string;
  paymentMode: string;
  razorpayPaymentId?: string;
  description?: string;
  renewed?: boolean;
}
