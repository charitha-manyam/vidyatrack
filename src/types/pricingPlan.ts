export interface PricingPlan {
  id: string;
  name: string;
  durationMonths: number;
  basePrice: number;
  discountPercent: number;
  isActive: boolean;
  razorpayPlanId?: string | null;
  price: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PricingPlanFormValues {
  basePrice: number;
  discountPercent: number;
  isActive: boolean;
}
