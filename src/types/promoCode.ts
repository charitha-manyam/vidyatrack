export type PromoCodeDiscountType = "PERCENT" | "FLAT";

export interface PromoCode {
  id: string;
  code: string;
  description?: string | null;
  discountType: PromoCodeDiscountType;
  discountValue: number;
  schoolId?: string | null;
  maxRedemptions?: number | null;
  redemptionsUsed: number;
  validFrom?: string | null;
  validUntil?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface PromoCodeFormValues {
  code: string;
  description?: string;
  discountType: PromoCodeDiscountType;
  discountValue: number;
  schoolId?: string;
  maxRedemptions?: number;
  validFrom?: string;
  validUntil?: string;
  isActive: boolean;
}
