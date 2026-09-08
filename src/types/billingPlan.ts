// Legacy manual billing-record log — NOT Razorpay-integrated. Backend fields
// are PascalCase because that's how this legacy table is actually shaped.
export interface BillingPlan {
  id: string;
  School: string;
  Amount: string;
  PaymentDate: string;
  PaymentMode: string;
  Description?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface BillingPlanFormValues {
  School: string;
  Amount: string;
  PaymentDate: string;
  PaymentMode: string;
  Description?: string;
}
