import { api } from "./client";
import type { AuthUser } from "../types/driver";

export type Tokens = { accessToken: string; refreshToken: string };

/**
 * Exchanges a Firebase ID token for backend JWTs.
 * POST /auth/firebase  { idToken, role: "DRIVER" }
 *
 * This is the only supported login path. The server's local OTP endpoints are
 * disabled (requestOtp throws) and verifyOtp issues no tokens, so they are not
 * wrapped here.
 */
export async function firebaseLogin(idToken: string): Promise<Tokens> {
  const { data } = await api.post("/auth/firebase", {
    idToken,
    role: "DRIVER",
  });
  return data as Tokens;
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
