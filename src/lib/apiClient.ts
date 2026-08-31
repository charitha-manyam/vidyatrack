import axios from "axios";

// EXPO_PUBLIC_-prefixed vars are inlined at build time by Expo's babel
// config — same convention as VITE_-prefixed vars in the three web portals.
// NOTE: "localhost" only resolves to the dev machine itself when running
// `expo start --web` or an Android emulator with `adb reverse` set up — on
// a real phone over Expo Go this must be the dev machine's LAN IP instead.
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://192.168.1.19:4000";

export const apiClient = axios.create({ baseURL: API_URL });

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
