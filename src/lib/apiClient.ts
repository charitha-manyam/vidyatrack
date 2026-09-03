import axios from "axios";

export type ApiRole = "superadmin" | "school" | "parent" | "marketing";

// EXPO_PUBLIC_-prefixed vars are inlined at build time by Expo's babel
// config — same convention as VITE_-prefixed vars in the three web portals.
// NOTE: "localhost" only resolves to the dev machine itself when running
// `expo start --web` or an Android emulator with `adb reverse` set up — on
// a real phone over Expo Go this must be the dev machine's LAN IP instead.
const FALLBACK_API_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://api.vidyatrack.com";

const API_URL_BY_ROLE: Record<ApiRole, string> = {
  superadmin: process.env.EXPO_PUBLIC_SUPERADMIN_API_URL ?? FALLBACK_API_URL,
  school: process.env.EXPO_PUBLIC_SCHOOL_API_URL ?? FALLBACK_API_URL,
  parent: process.env.EXPO_PUBLIC_PARENT_API_URL ?? FALLBACK_API_URL,
  marketing: process.env.EXPO_PUBLIC_MARKETING_API_URL ?? FALLBACK_API_URL,
};

export const apiClient = axios.create({ baseURL: FALLBACK_API_URL });

export function getApiBaseUrlForRole(role?: ApiRole) {
  return role ? API_URL_BY_ROLE[role] : FALLBACK_API_URL;
}

export function setApiBaseUrl(url: string) {
  apiClient.defaults.baseURL = url;
}

export function setApiBaseUrlForRole(role?: ApiRole) {
  setApiBaseUrl(getApiBaseUrlForRole(role));
}

// Set once at app boot (restored session) and again on every login/logout —
// simpler than threading the token through every screen, and axios
// interceptors have no access to React context/hooks.
let currentToken: string | null = null;

export function setAuthToken(token: string | null) {
  currentToken = token;
}

apiClient.interceptors.request.use((config) => {
  if (currentToken) {
    config.headers.Authorization = `Bearer ${currentToken}`;
  }
  return config;
});
