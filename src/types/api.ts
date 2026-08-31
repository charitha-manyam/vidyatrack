export interface ApiResponse<T = unknown> {
  status: boolean;
  message?: string;
  data?: T;
}
