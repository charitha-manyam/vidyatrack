import { apiClient } from "../lib/apiClient";
import type { ApiResponse } from "../types/api";
import type { PromoCode, PromoCodeFormValues } from "../types/promoCode";

export async function getPromoCodes() {
  const { data } = await apiClient.get<ApiResponse<PromoCode[]>>("/organization/promo-codes");
  return data.data ?? [];
}

export async function createPromoCode(values: PromoCodeFormValues) {
  const { data } = await apiClient.post<ApiResponse<PromoCode>>("/organization/promo-codes", values);
  return data;
}

export async function updatePromoCode(id: string, values: Partial<Omit<PromoCodeFormValues, "code">>) {
  const { data } = await apiClient.put<ApiResponse<PromoCode>>(`/organization/promo-codes/${id}`, values);
  return data;
}

export async function deletePromoCode(id: string) {
  const { data } = await apiClient.delete<ApiResponse>(`/organization/promo-codes/${id}`);
  return data;
}
