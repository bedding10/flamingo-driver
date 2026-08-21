import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { InputField } from "../../components/InputField";
import { PrimaryButton } from "../../components/PrimaryButton";
import { textAlignStart } from "../../i18n";
import { strings } from "../../i18n/strings";
import { pw } from "../../i18n/strings.password";
import {
  radius,
  spacing,
  typography,
  usePalette,
  type Palette,
} from "../../theme";
import { authErrorMessage } from "../../auth/auth-errors";
import {
  confirmPhoneCode,
  normalizeE164,
  requestPhoneCode,
  type PhoneConfirmation,
} from "../../auth/firebase";
import { authApi } from "../../api";
import { toApiError } from "../../api/client";
import { useAuthStore } from "../../auth/auth.store";
import type { AuthStackParamList } from "../../navigation/types";

const CODE_LENGTH = 6;
const RESEND_SECONDS = 60;
const MIN_PASSWORD_LENGTH = 6;

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

/**
 * Phone -> SMS code -> backend session.
 *
 * Firebase verifies the number, then POST /auth/firebase exchanges the ID token
 * for the backend JWTs, which go straight into secure storage.
 *
 * PHASE 1 adds a SECOND door to the SAME account, not a second account: once the
 * driver has set a password from the profile screen, POST /auth/login accepts
 * the same phone number plus that password and returns the same kind of tokens.
 * Account CREATION still happens only through Firebase - the local OTP routes
 * stay disabled, and an account with no password simply fails this path.
 *
 * The screen holds no token and no user object; it hands the tokens to the auth
 * store and unmounts when the root tree switches to the signed-in stack.
 *
 * PHASE 1 DESIGN FOUNDATION (R-11): `modeRow` was `"row-reverse"`, `title`,
 * `subtitle`, `error` and `footNote` were pinned `textAlign: "right"`, and
 * `modeText`, `link` and `timer` carried a bare `writingDirection: "rtl"` with
 * no alignment at all. All of that predates real RTL and now double-flips.
 *
 * PHASE 2: migrated off the legacy flat `colors` bag onto the palette, so the
 * screen finally answers to light mode instead of painting a near-black
 * background under dark-mode text. Brand pink for TEXT resolves through
 * `primaryText`, not `primary`: palettes.ts records that #FF4D8D on white fails
 * contrast at body sizes, so the filled pink stays the brand hex in both themes
 * while pink lettering darkens in light mode.
 *
 * PHASE 2: WHICH DOOR OPENS FIRST
 * `route.params.mode` decides the initial mode, because the Welcome screen has
 * two buttons that mean different things: "Start registration" must land on the
 * SMS flow (POST /auth/firebase is the only account-creating path the backend
 * has) and "Sign in" must land on the password flow. The param is optional, so
 * `navigate("Login")` from anywhere else still opens on SMS as before. It is
 * read as a lazy initial value only: the driver can still switch doors with the
 * mode row, and that choice must not be undone by a re-render.
 *
 * STILL OUTSTANDING (PHASE 2, visual rebuild): Stitch splits this into two
 * screens - phone_number_entry and otp_verification - each on a glass panel
 * over a dimmed map, with a three-segment progress bar, a fixed +213 country box
 * beside an LTR national-number field, and six single-character OTP boxes rather
 * than one six-digit input. None of that geometry is built yet. This commit
 * changed the initial mode only.
 */
export function LoginScreen({ route }: Props) {
  const insets = useSafeAreaInsets();
  const palette = usePalette();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const signIn = useAuthStore((state) => state.signIn);

  const [mode, setMode] = useState<"sms" | "password">(
    route.params?.mode ?? "sms",
  );
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  // The confirmation handle is not state: it is never rendered, and keeping it
  // in a ref avoids a re-render that would remount the code field mid-typing.
  const confirmationRef = useRef<PhoneConfirmation | null>(null);
  // Guards every setState after an await: the screen unmounts the moment the
  // session is stored, and writing state then is a leak warning at best.
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const sendCode = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      // Validate locally first so an obviously wrong number does not burn one
      // of the SMS attempts Firebase rate-limits per device.
      normalizeE164(phone);
      confirmationRef.current = await requestPhoneCode(phone);
      if (!mountedRef.current) return;
      setCode("");
      setStep("code");
      setSecondsLeft(RESEND_SECONDS);
    } catch (sendError) {
      if (!mountedRef.current) return;
      setError(authErrorMessage(sendError));
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  }, [phone]);

  const verifyCode = useCallback(async () => {
    const confirmation = confirmationRef.current;
    if (!confirmation) {
      setStep("phone");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const session = await confirmPhoneCode(confirmation, code);
      // From here the auth store owns everything; this screen will unmount.
      await signIn(session);
    } catch (verifyError) {
      if (!mountedRef.current) return;
      setError(authErrorMessage(verifyError));
      setBusy(false);
    }
  }, [code, signIn]);

  /**
   * PHASE 1 - returning driver, no SMS.
   *
   * The number is normalised to E.164 with the same helper the Firebase flow
   * uses, because the stored User.phone came from a Firebase token: sending
   * "0555..." would look up a row that does not exist.
   */
  const passwordSignIn = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      const normalized = normalizeE164(phone);
      const session = await authApi.passwordLogin({
        phone: normalized,
        password,
      });
      await signIn(session);
    } catch (loginError) {
      if (!mountedRef.current) return;
      const apiError = toApiError(loginError);
      setError(
        apiError.offline
          ? strings.errors.network
          : loginError instanceof Error && loginError.message === "INVALID_PHONE"
            ? authErrorMessage(loginError)
            : pw.login.failed,
      );
      setBusy(false);
    }
  }, [password, phone, signIn]);

  const backToPhone = useCallback(() => {
    confirmationRef.current = null;
    setStep("phone");
    setCode("");
    setError(null);
  }, []);

  const switchMode = useCallback((nextMode: "sms" | "password") => {
    confirmationRef.current = null;
    setMode(nextMode);
    setStep("phone");
    setCode("");
    setPassword("");
    setError(null);
  }, []);

  const phoneReady = phone.replace(/\D/g, "").length >= 8;
  const codeReady = code.trim().length === CODE_LENGTH;
  const passwordReady = phoneReady && password.length >= MIN_PASSWORD_LENGTH;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing["3xl"] },
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.brand}>{strings.login.brand}</Text>
          <Text style={styles.role}>{strings.login.role}</Text>
        </View>

        {/* PHASE 1: the two doors to the same account. Hidden while an SMS is
            being confirmed, so a mis-tap cannot drop a pending code. */}
        {step === "phone" ? (
          <View style={styles.modeRow}>
            <Pressable
              onPress={() => switchMode("sms")}
              disabled={busy}
              style={[styles.mode, mode === "sms" && styles.modeActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: mode === "sms" }}
            >
              <Text
                style={[
                  styles.modeText,
                  mode === "sms" && styles.modeTextActive,
                ]}
              >
                {pw.login.modeSms}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => switchMode("password")}
              disabled={busy}
              style={[styles.mode, mode === "password" && styles.modeActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: mode === "password" }}
            >
              <Text
                style={[
                  styles.modeText,
                  mode === "password" && styles.modeTextActive,
                ]}
              >
                {pw.login.modePassword}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {mode === "password" ? (
          <View style={styles.card}>
            <Text style={styles.title}>{pw.login.passwordTitle}</Text>
            <Text style={styles.subtitle}>{pw.login.passwordSubtitle}</Text>
            <InputField
              label={strings.login.phoneLabel}
              placeholder={strings.login.phonePlaceholder}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
              autoComplete="tel"
              editable={!busy}
              numeric
            />
            <View style={styles.spacer} />
            <InputField
              label={pw.login.passwordLabel}
              placeholder={pw.login.passwordPlacehol