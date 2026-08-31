import * as SecureStore from "expo-secure-store";

const SESSION_KEY = "vidyatrack.session";

// SecureStore keys must be alphanumeric/./-/_ and are limited to ~2KB values
// on some platforms — the session payload here is small (token + a few
// identity fields), so a single JSON blob under one key is fine.
export async function saveSession(value: string): Promise<void> {
  await SecureStore.setItemAsync(SESSION_KEY, value);
}

export async function loadSession(): Promise<string | null> {
  return SecureStore.getItemAsync(SESSION_KEY);
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}
