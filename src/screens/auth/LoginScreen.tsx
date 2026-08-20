import React, { useCallback, useEffect, useRef, useState } from "react";
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
import { InputField } from "../../components/InputField";
import { PrimaryButton } from "../../components/PrimaryButton";
import { textAlignStart } from "../../i18n";
import { strings } from "../../i18n/strings";
import { pw } from "../../i18n/strings.password";
import { colors, radius, spacing, typography, withAlpha } from "../../theme";
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

const CODE_LENGTH = 6;
const RESEND_SECONDS = 60;
const MIN_PASSWORD_LENGTH = 6;

/**
 * Phone -> SMS code -> backend session.
 *
 * Firebase verifies the number, then POST /auth/firebase exchanges the ID token
 * for the backend JWTs, which go straight into secure storage.
 *
 * PHASE 1 adds a SECOND door to the SAME account, not a second account: once the
 * driver has set a password from the profile screen, POST /auth/login accepts
 * the same phone number plus that password and returns the same kind of tokens.
 * Account CREATION still happens only through Firebase — the local OTP routes
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
 * STILL OUTSTANDING (PHASE 2): this screen reads the legacy flat `colors` bag
 * rather than the palette, so it is dark-only and ignores light mode. PHASE 2
 * rebuilds this flow against the Stitch auth screens and will migrate it.
 */
export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const signIn = useAuthStore((state) => state.signIn);

  const [mode, setMode] = useState<"sms" | "password">("sms");
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
   * PHASE 1 — returning driver, no SMS.
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
              placeholder={pw.login.passwordPlaceholder}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="password"
              editable={!busy}
              maxLength={72}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <PrimaryButton
              label={pw.login.submit}
              onPress={() => void passwordSignIn()}
              loading={busy}
              disabled={!passwordReady}
              style={styles.action}
            />
            <Text style={styles.footNote}>{pw.login.noPasswordHint}</Text>
          </View>
        ) : step === "phone" ? (
          <View style={styles.card}>
            <Text style={styles.title}>{strings.login.phoneTitle}</Text>
            <Text style={styles.subtitle}>{strings.login.phoneSubtitle}</Text>
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
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <PrimaryButton
              label={strings.login.sendCode}
              onPress={sendCode}
              loading={busy}
              disabled={!phoneReady}
              style={styles.action}
            />
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.title}>{strings.login.codeTitle}</Text>
            <Text style={styles.subtitle}>
              {strings.login.codeSubtitle}
            </Text>
            <Text style={styles.phoneEcho}>{phone}</Text>
            <InputField
              label={strings.login.codeLabel}
              placeholder={strings.login.codePlaceholder}
              value={code}
              onChangeText={(value) =>
                setCode(value.replace(/\D/g, "").slice(0, CODE_LENGTH))
              }
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
              maxLength={CODE_LENGTH}
              editable={!busy}
              autoFocus
              numeric
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <PrimaryButton
              label={strings.login.verify}
              onPress={verifyCode}
              loading={busy}
              disabled={!codeReady}
              style={styles.action}
            />
            <View style={styles.footer}>
              <Pressable onPress={backToPhone} disabled={busy} hitSlop={12}>
                <Text style={styles.link}>{strings.login.changeNumber}</Text>
              </Pressable>
              {secondsLeft > 0 ? (
                <Text style={styles.timer}>
                  {strings.login.resendIn} {secondsLeft}{" "}
                  {strings.login.seconds}
                </Text>
              ) : (
                <Pressable onPress={sendCode} disabled={busy} hitSlop={12}>
                  <Text style={styles.link}>{strings.login.resend}</Text>
                </Pressable>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: "center",
  },
  header: { alignItems: "center", marginBottom: spacing["3xl"] },
  brand: { ...typography.display, color: colors.gold },
  role: {
    ...typography.label,
    color: colors.textOnDarkSecondary,
    letterSpacing: 3,
    marginTop: spacing.xs,
  },
  // Plain "row": mirrored by React Native under RTL.
  modeRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginBottom: spacing.xl,
  },
  mode: {
    flex: 1,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: withAlpha(colors.offWhite, 0.06),
  },
  modeActive: {
    borderColor: colors.gold,
    backgroundColor: withAlpha(colors.gold, 0.16),
  },
  // Centred inside its own Pressable, so it needs no alignment of its own.
  modeText: {
    ...typography.caption,
    color: colors.textOnDarkSecondary,
  },
  modeTextActive: { color: colors.gold },
  card: { width: "100%" },
  spacer: { height: spacing.md },
  title: {
    ...typography.title,
    color: colors.textOnDark,
    textAlign: textAlignStart(),
  },
  subtitle: {
    ...typography.body,
    color: colors.textOnDarkSecondary,
    textAlign: textAlignStart(),
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  /**
   * Deliberately LTR, and one of the pinned Latin-content exceptions: this
   * echoes the number the driver just typed, normalised to E.164. A leading
   * "+" inside an Arabic paragraph can be reordered by the bidi algorithm and
   * land at the wrong end, so the one string that proves we are texting the
   * right phone would be the string we render wrong. Centre plus explicit LTR.
   */
  phoneEcho: {
    ...typography.numeric,
    color: colors.gold,
    textAlign: "center",
    writingDirection: "ltr",
    marginBottom: spacing.lg,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
    textAlign: textAlignStart(),
    marginTop: spacing.md,
  },
  footNote: {
    ...typography.caption,
    color: colors.textOnDarkSecondary,
    textAlign: textAlignStart(),
    marginTop: spacing.md,
  },
  action: { marginTop: spacing.xl },
  // Already correct: plain "row" with space-between mirrors on its own.
  footer: {
    marginTop: spacing.xl,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  link: { ...typography.label, color: colors.gold },
  timer: {
    ...typography.caption,
    color: colors.textOnDarkSecondary,
  },
});
