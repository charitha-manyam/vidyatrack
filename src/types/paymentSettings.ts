// Mirrors admin-portal/src/types/paymentSettings.ts — the school's own
// Razorpay gateway config used for parent fee-payment links.
export interface RazorpayConfigStatus {
  configured: boolean;
  webhookConfigured: boolean;
  // The Razorpay public key id is the only non-secret value the backend
  // ever returns — secrets are encrypted at rest and never echoed.
  razorpayKeyId: string | null;
}

export interface RazorpayConfigFormValues {
  razorpayKeyId: string;
  razorpayKeySecret: string;
  razorpayWebhookSecret?: string;
}