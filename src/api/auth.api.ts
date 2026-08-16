import { api } from "./client";
import type { AuthUser } from "../types/driver";

export type Tokens = { accessToken: string; refreshToken: string };

/**
 * Exchanges a Firebase ID token for backend JWTs.
 * POST /auth/firebase  { idToken, role: "DRIVER" }
 *
 * This is the primary sign-in path and the ONLY one that can create an account:
 * the server's local OTP endpoints are disabled (requestOtp throws and
 * verifyOtp issues no tokens), so a driver is always born from a Firebase
 * phone verification.
 */
export async function firebaseLogin(idToken: string): Promise<Tokens> {
  const { data } = await api.post("/auth/firebase", {
    idToken,
    role: "DRIVER",
  });
  return data as Tokens;
}

/**
 * PHASE 1 — returning sign-in with phone + password.
 * POST /auth/login  { phone, password }
 *
 * This is NOT a second account system and it cannot create anything: the row it
 * authenticates is the same User the Firebase phone flow created, and it only
 * succeeds after the driver has set a password from the profile screen
 * (POST /auth/password/change). Until then the account has no passwordHash and
 * the server answers INVALID_CREDENTIALS, on purpose.
 *
 * `phone` must already be E.164 — normalizeE164() in auth/firebase.ts — so it
 * matches the number Firebase verified and stored.
 */
export async function passwordLogin(input: {
  phone: string;
  password: string;
}): Promise<Tokens> {
  const { data } = await api.post("/auth/login", {
    phone: input.phone,
    password: input.password,
  });
  return data as Tokens;
}

/**
 * PHASE 1 — sets or changes the local password of the signed-in driver.
 * POST /auth/password/change  { newPassword, currentPassword? }
 *
 * `currentPassword` is omitted the first time, when the Firebase-created
 * account still has no hash. The server enforces the rule; the client only
 * decides whether it has something to send.
 *
 * The server revokes the OTHER sessions and keeps the current one, so this call
 * never signs the driver out of the device performing it.
 */
export async function setPassword(input: {
  newPassword: string;
  currentPassword?: string;
}): Promise<void> {
  await api.post("/auth/password/change", {
    newPassword: input.newPassword,
    ...(input.currentPassword ? { currentPassword: input.currentPassword } : {}),
  });
}

/** POST /auth/me - note: the server exposes this as POST, not GET. */
export async function fetchMe(): Promise<AuthUser> {
  const { data } = await api.post("/auth/me", {});
  return data as AuthUser;
}

/** POST /auth/logout - revokes the current session server-side. */
export async function logout(): Promise<void> {
  await api.post("/auth/logout", {});
}
