import { isAxiosError } from "axios";

export function getErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (isAxiosError<{ message?: string }>(error)) {
    if (error.response) {
      return error.response.data?.message ?? `Server error (${error.response.status})`;
    }
    if (error.code === "ERR_NETWORK") {
      return "Cannot reach the server. Please check your internet connection and try again.";
    }
    if (error.code === "ECONNABORTED") {
      return "Server took too long to respond. Please try again.";
    }
    return error.message || fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
