import { apiClient } from "../lib/apiClient";
import type { ApiResponse } from "../types/api";
import type {
  SubscriptionPayment,
  SubscriptionPaymentFormValues,
} from "../types/subscriptionPayment";

export async function getAllSubscriptionPayments() {
  const { data } = await apiClient.get<ApiResponse<SubscriptionPayment[]> & { count?: number }>(
    "/organization/getallsubscriptionpayments"
  );
  return data.data ?? [];
}

export async function createSubscriptionPayment(values: SubscriptionPaymentFormValues) {
  const { data } = await apiClient.post<ApiResponse<SubscriptionPayment>>(
    "/organization/subscription-payment",
    values
  );
  return data;
}