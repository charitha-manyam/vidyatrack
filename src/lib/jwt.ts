// Tiny JWT payload decoder — no crypto or Node APIs needed since JWTs are
// only base64url here and we only ever read unverified claims like
// organization_id (the backend's auth middleware does real verification).
//
// The base64 decode is implemented from first principles (no atob/Buffer) so
// it behaves identically on Hermes and web.
const BASE64_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const BASE64_LOOKUP: Record<string, number> = Object.fromEntries(
  [...BASE64_ALPHABET].map((ch, i) => [ch, i])
);

function base64UrlToUtf8(input: string): string {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  let out = "";
  for (let i = 0; i < b64.length; i += 4) {
    const c0 = BASE64_LOOKUP[b64[i]];
    const c1 = BASE64_LOOKUP[b64[i + 1]];
    const c2 = b64[i + 2] === "=" ? undefined : BASE64_LOOKUP[b64[i + 2]];
    const c3 = b64[i + 3] === "=" ? undefined : BASE64_LOOKUP[b64[i + 3]];
    out += String.fromCharCode((c0 << 2) | (c1 >> 4));
    if (c2 !== undefined) out += String.fromCharCode(((c1 & 15) << 4) | (c2 >> 2));
    if (c3 !== undefined) out += String.fromCharCode(((c2! & 3) << 6) | c3);
  }
  return out;
}

export function decodeJwtPayload<T extends Record<string, unknown>>(token: string): T | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    return JSON.parse(base64UrlToUtf8(parts[1])) as T;
  } catch {
    return null;
  }
}