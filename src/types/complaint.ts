export type ComplaintStatus = "pending" | "resolved" | "rejected";

export const COMPLAINT_STATUS_OPTIONS: { value: ComplaintStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "resolved", label: "Resolved" },
  { value: "rejected", label: "Rejected" },
];

// regarding_type/category have no server-side enum validation (complaints.js
// accepts any string) — these are display presets, not an enforced contract.
export interface ComplaintFormValues {
  subject: string;
  category: string;
  description: string;
  regarding_id: string;
  regarding_type: string;
  school_code: string;
}

export interface Complaint {
  id: string;
  subject: string;
  category: string;
  description: string;
  regarding_id: string;
  regarding_type: string;
  school_code: string;
  status: ComplaintStatus;
  resolution?: string | null;
  resolved_by?: string | null;
  resolved_at?: string | null;
  createdAt?: string;
  updatedAt?: string;
}