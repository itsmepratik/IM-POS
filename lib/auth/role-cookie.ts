/**
 * Tamper-proof role cache for middleware.
 *
 * The role is cached in an httpOnly cookie to avoid a DB round-trip on every
 * request, but the value is HMAC-SHA256 signed and bound to the user id and an
 * expiry, so a client cannot forge or replay it for another account.
 *
 * Format: `<role>.<userId>.<expiresAtUnixSeconds>.<base64url(signature)>`
 *
 * Uses Web Crypto only, so it runs in the Edge runtime (middleware).
 */

export const ROLE_COOKIE_NAME = "user_role";
export const ROLE_COOKIE_TTL_SECONDS = 300;

export const USER_ROLES = ["admin", "shop"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export function isUserRole(value: unknown): value is UserRole {
  return (
    typeof value === "string" &&
    (USER_ROLES as readonly string[]).includes(value)
  );
}

const encoder = new TextEncoder();

function toBase64Url(bytes: ArrayBuffer): string {
  let binary = "";
  for (const byte of new Uint8Array(bytes)) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> | null {
  try {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
    const bytes = new Uint8Array(new ArrayBuffer(binary.length));
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function signRoleCookie(
  role: UserRole,
  userId: string,
  secret: string,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): Promise<string> {
  const payload = `${role}.${userId}.${nowSeconds + ROLE_COOKIE_TTL_SECONDS}`;
  const key = await importKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return `${payload}.${toBase64Url(signature)}`;
}

/**
 * Returns the role only if the signature is valid, the cookie belongs to
 * `userId`, and it has not expired. Any other case returns null.
 */
export async function verifyRoleCookie(
  value: string | undefined,
  userId: string,
  secret: string,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): Promise<UserRole | null> {
  if (!value) return null;

  const parts = value.split(".");
  if (parts.length !== 4) return null;

  const [role, cookieUserId, expiresAtRaw, signatureRaw] = parts;
  if (!isUserRole(role) || cookieUserId !== userId) return null;

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isInteger(expiresAt) || expiresAt <= nowSeconds) return null;

  const signature = fromBase64Url(signatureRaw);
  if (!signature) return null;

  const key = await importKey(secret);
  // crypto.subtle.verify performs a constant-time comparison.
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    signature,
    encoder.encode(`${role}.${cookieUserId}.${expiresAtRaw}`),
  );

  return valid ? role : null;
}
