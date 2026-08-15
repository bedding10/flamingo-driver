import { toApiError } from "../api/client";
import { strings } from "../i18n/strings";

/**
 * Turns anything thrown during sign-in into one Arabic sentence a driver can
 * act on.
 *
 * A driver at the roadside cannot use "Request failed with status code 401".
 * Every branch below maps to a real Firebase code or a real server response;
 * nothing is invented.
 */

const FIREBASE_MESSAGES: Record<string, string> = {
  "auth/invalid-phone-number": strings.errors.invalidPhone,
  "auth/missing-phone-number": strings.errors.invalidPhone,
  "auth/invalid-verification-code": strings.errors.invalidCode,
  "auth/invalid-verification-id": strings.errors.expiredCode,
  "auth/code-expired": strings.errors.expiredCode,
  "auth/session-expired": strings.errors.expiredCode,
  "auth/too-many-requests": strings.errors.tooManyRequests,
  "auth/quota-exceeded": strings.errors.tooManyRequests,
  "auth/network-request-failed": strings.errors.network,
  "auth/user-disabled": strings.errors.accountInactive,
  // Region not enabled, reCAPTCHA/Play Integrity refused, SHA-1 missing.
  "auth/operation-not-allowed": strings.errors.smsFailed,
  "auth/app-not-authorized": strings.errors.configMissing,
  "auth/unknown": strings.errors.smsFailed,
};

function firebaseCodeOf(error: unknown): string | null {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = String((error as { code?: unknown }).code ?? "");
    if (code.startsWith("auth/")) return code;
  }
  return null;
}

export function authErrorMessage(error: unknown): string {
  const firebaseCode = firebaseCodeOf(error);
  if (firebaseCode) {
    return FIREBASE_MESSAGES[firebaseCode] ?? strings.errors.smsFailed;
  }

  // Thrown by our own helpers before any network call.
  if (error instanceof Error) {
    if (error.message === "INVALID_PHONE") return strings.errors.invalidPhone;
    if (error.message === "OTP_FAILED") return strings.errors.invalidCode;
    // The native Firebase module is missing (no google-services.json in the
    // build). Worth its own message: no amount of retrying fixes it.
    if (/no firebase app|default app|native module/i.test(error.message)) {
      return strings.errors.configMissing;
    }
  }

  const apiError = toApiError(error);
  if (apiError.offline) return strings.errors.network;
  if (apiError.status === 429) return strings.errors.tooManyRequests;
  if (apiError.status === 403) return strings.errors.accountInactive;
  if (apiError.status === 401) {
    // POST /auth/firebase rejects an ID token with no verified identity.
    return strings.errors.invalidCode;
  }
  // The backend already answers in Arabic; prefer its wording when it gave one.
  if (apiError.message && /[\u0600-\u06FF]/.test(apiError.message)) {
    return apiError.message;
  }
  return strings.errors.generic;
}
