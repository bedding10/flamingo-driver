import {
  getAuth,
  signInWithPhoneNumber as signInWithPhoneNumberModular,
  signOut as signOutModular,
  getIdToken,
  FirebaseAuthTypes,
} from "@react-native-firebase/auth";
import { firebaseLogin, type Tokens } from "../api/auth.api";

/**
 * Firebase Phone Auth is the only sign-in channel.
 *
 * The server's local OTP routes are disabled by design (requestOtp throws and
 * verifyOtp issues no tokens), and POST /auth/firebase rejects any ID token that
 * carries no verified phone number. So the flow is: Firebase verifies the SMS,
 * then the backend trusts only what Firebase signed.
 */

export type PhoneConfirmation = FirebaseAuthTypes.ConfirmationResult;

/**
 * Forces E.164 with an explicit country code.
 *
 * Firebase decides the SMS region from the country parsed out of the number.
 * A national format like "0555..." cannot be mapped to Algeria, and Firebase
 * then fails with error 17006 ("SMS unable to be sent until this region enabled
 * by the app developer") EVEN WHEN Algeria is allow-listed. Same helper as the
 * passenger app, deliberately identical behaviour.
 */
export function normalizeE164(input: string, defaultCountry = "213"): string {
  const digitsAndPlus = input.replace(/[^\d+]/g, "");
  let value: string;
  if (digitsAndPlus.startsWith("+")) {
    value = digitsAndPlus;
  } else if (digitsAndPlus.startsWith("00")) {
    value = "+" + digitsAndPlus.slice(2);
  } else if (digitsAndPlus.startsWith(defaultCountry)) {
    value = "+" + digitsAndPlus;
  } else if (digitsAndPlus.startsWith("0")) {
    // National trunk format: 0 + subscriber -> +<country><subscriber>.
    value = "+" + defaultCountry + digitsAndPlus.slice(1);
  } else {
    value = "+" + defaultCountry + digitsAndPlus;
  }
  if (!/^\+\d{8,15}$/.test(value)) throw new Error("INVALID_PHONE");
  return value;
}

/** Sends the SMS. Returns the confirmation handle needed to verify the code. */
export async function requestPhoneCode(
  phone: string,
): Promise<PhoneConfirmation> {
  return signInWithPhoneNumberModular(getAuth(), normalizeE164(phone));
}

/**
 * Verifies the SMS code and exchanges the resulting Firebase ID token for
 * backend JWTs.
 *
 * `getIdToken(user, true)` forces a fresh token: a cached one can be minutes old
 * and the server verifies it strictly.
 */
export async function confirmPhoneCode(
  confirmation: PhoneConfirmation,
  code: string,
): Promise<Tokens> {
  const credential = await confirmation.confirm(code.trim());
  if (!credential) throw new Error("OTP_FAILED");
  const idToken = await getIdToken(credential.user, true);
  return firebaseLogin(idToken);
}

/**
 * Clears the Firebase session.
 *
 * Called on sign-out so the next driver on the same phone is not silently
 * signed in as the previous one when a fresh ID token is requested.
 */
export async function signOutFirebase(): Promise<void> {
  try {
    await signOutModular(getAuth());
  } catch {
    // Nothing to sign out of, or native module unavailable: never block a
    // local sign-out on this.
  }
}
