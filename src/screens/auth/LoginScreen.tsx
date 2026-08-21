import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { BlurView } from "expo-blur";
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

import { authApi } from "../../api";
import { toApiError } from "../../api/client";
import { authErrorMessage } from "../../auth/auth-errors";
import { useAuthStore } from "../../auth/auth.store";
import {
  confirmPhoneCode,
  normalizeE164,
  requestPhoneCode,
  type PhoneConfirmation,
} from "../../auth/firebase";
import { AuthProgress } from "../../components/auth/AuthProgress";
import { OtpBoxes } from "../../components/auth/OtpBoxes";
import { PhoneField } from "../../components/auth/PhoneField";
import { InputField } from "../../components/InputField";
import { textAlignStart, useTranslation } from "../../i18n";
import { pw } from "../../i18n/strings.password";
import {
  alpha,
  BLUR,
  COLORS,
  RADIUS,
  SHADOW_CARD,
  SPACING,
  TOUCH_TARGET,
  typo,
} from "../../theme/tokens";
import { HEADER_HEIGHT, PillButton, StickyHeader } from "../../ui";
import type { AuthStackParamList } from "../../navigation/types";

const CODE_LENGTH = 6;
const RESEND_SECONDS = 60;
const MIN_PASSWORD_LENGTH = 6;
const MIN_PHONE_DIGITS = 8;
const MAX_PASSWORD_LENGTH = 72;
const SECONDS_PER_MINUTE = 60;
const SAFE_BOTTOM_MIN = 32;

/** Tailwind `max-w-md`, which is what Stitch centres these cards inside. */
const MAX_CARD_WIDTH = 448;

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

/** Stitch prints the countdown as 00:59, not as a raw second count. */
function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Phone -> SMS code -> backend session, on `src/theme/tokens.ts` and the shared
 * UI kit. No colour, radius or type literal lives in this file.
 *
 * Firebase verifies the number, then POST /auth/firebase exchanges the ID token
 * for the backend JWTs. There is a SECOND door to the SAME account, not a
 * second account: once a password is set, POST /auth/login accepts the same
 * phone plus that password. Account CREATION stays Firebase-only, because the
 * server's local OTP routes are disabled.
 *
 * STITCH GEOMETRY, ONE COMPONENT, TWO SCREENS
 * The reference is two designs: `phone_number_entry` and `otp_verification`.
 * They are NOT two navigator routes, deliberately: the Firebase
 * ConfirmationResult is a live object with a method on it, and navigation params
 * must be serialisable. Each STEP renders its own layout, progress position and
 * header behaviour, while one component owns the handle.
 *
 * `route.params.mode` decides which door opens, read as a lazy initial value so
 * switching doors afterwards is not undone by a re-render.
 *
 * NOT BUILT, ON PURPOSE: Stitch layers a dimmed map under both screens.
 * Mounting a map here would request location permission before the driver even
 * has an account. Recorded as a visual delta rather than quietly dropped.
 */
export function LoginScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const signIn = useAuthStore((state) => state.signIn);

  const [mode, setMode] = useState<"sms" | "password">(
    route.params?.mode ?? "sms",
  );
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  // Not state: never rendered, and a re-render here would remount the code
  // boxes mid-typing.
  const confirmationRef = useRef<PhoneConfirmation | null>(null);
  // Guards every setState after an await: the screen unmounts the moment the
  // session is stored.
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
      // Validated locally first so an obviously wrong number does not burn one
      // of the SMS attempts Firebase rate-limits per device.
      const normalized = normalizeE164(phone);
      confirmationRef.current = await requestPhoneCode(normalized);
      if (!mountedRef.current) return;
      setSentTo(normalized);
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
   * Returning driver, no SMS. Normalised with the same helper the Firebase flow
   * uses, because the stored User.phone came from a Firebase token.
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
          ? t("errors.network")
          : loginError instanceof Error && loginError.message === "INVALID_PHONE"
            ? authErrorMessage(loginError)
            : pw.login.failed,
      );
      setBusy(false);
    }
  }, [password, phone, signIn, t]);

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

  /**
   * On the code step, back means "wrong number" - it returns to the field and
   * drops the pending confirmation rather than leaving the flow. Only on the
   * phone step does it pop to Welcome, and only if there is something to pop.
   */
  const onBack = useCallback(() => {
    if (step === "code") {
      backToPhone();
      return;
    }
    if (navigation.canGoBack()) navigation.goBack();
  }, [backToPhone, navigation, step]);

  const canGoBack = step === "code" || navigation.canGoBack();

  const phoneReady = phone.replace(/\D/g, "").length >= MIN_PHONE_DIGITS;
  const codeReady = code.trim().length === CODE_LENGTH;
  const passwordReady = phoneReady && password.length >= MIN_PASSWORD_LENGTH;

  const modeRow = (
    <View style={styles.modeRow}>
      <Pressable
        onPress={() => switchMode("sms")}
        disabled={busy}
        style={[styles.mode, mode === "sms" && styles.modeActive]}
        accessibilityRole="button"
        accessibilityState={{ selected: mode === "sms" }}
      >
        <Text style={[styles.modeText, mode === "sms" && styles.modeTextOn]}>
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
          style={[styles.modeText, mode === "password" && styles.modeTextOn]}
        >
          {pw.login.modePassword}
        </Text>
      </Pressable>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + HEADER_HEIGHT + SPACING.xl,
            paddingBottom: Math.max(insets.bottom, SAFE_BOTTOM_MIN),
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.centre}>
          {mode === "password" ? (
            <View style={[styles.cardWrap, SHADOW_CARD]}>
              <BlurView
                intensity={BLUR.overlay}
                tint={BLUR.tint}
                style={styles.card}
              >
                <Text style={styles.titleSm}>{t("login.passwordTitle")}</Text>
                <Text style={styles.subtitle}>
                  {t("login.passwordSubtitle")}
                </Text>
                {modeRow}
                <PhoneField
                  value={phone}
                  onChangeText={setPhone}
                  editable={!busy}
                  placeholder={t("login.phonePlaceholder")}
                  accessibilityLabel={t("login.phoneLabel")}
                />
                <View style={styles.gap} />
                <InputField
                  label={t("login.passwordLabel")}
                  placeholder={pw.login.passwordPlaceholder}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="password"
                  editable={!busy}
                  maxLength={MAX_PASSWORD_LENGTH}
                />
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <PillButton
                  label={t("login.signIn")}
                  onPress={() => void passwordSignIn()}
                  loading={busy}
                  disabled={!passwordReady}
                  style={styles.action}
                />
                <Text style={styles.helper}>{pw.login.noPasswordHint}</Text>
              </BlurView>
            </View>
          ) : step === "phone" ? (
            <View style={[styles.cardWrap, SHADOW_CARD]}>
              <BlurView
                intensity={BLUR.overlay}
                tint={BLUR.tint}
                style={styles.card}
              >
                {/* Absolute, so the wrapper must clip - see styles.cardWrap. */}
                <AuthProgress step={1} variant="bar" />
                <Text style={styles.titleSm}>{t("login.phoneTitle")}</Text>
                <Text style={styles.subtitle}>{t("login.phoneSubtitle")}</Text>
                {modeRow}
                <PhoneField
                  value={phone}
                  onChangeText={setPhone}
                  editable={!busy}
                  placeholder={t("login.phonePlaceholder")}
                  accessibilityLabel={t("login.phoneLabel")}
                  returnKeyType="send"
                  onSubmitEditing={() => {
                    if (phoneReady && !busy) void sendCode();
                  }}
                />
                <Text style={styles.helper}>{t("login.phoneHelper")}</Text>
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <PillButton
                  label={t("login.sendCode")}
                  onPress={() => void sendCode()}
                  loading={busy}
                  disabled={!phoneReady}
                  trailingIcon="arrow-forward"
                  style={styles.action}
                />
              </BlurView>
            </View>
          ) : (
            <>
              {/* Stitch puts the OTP indicator ABOVE the panel, and lights the
                  MIDDLE segment. */}
              <AuthProgress step={2} variant="dashes" style={styles.dashes} />
              <View style={[styles.cardWrap, SHADOW_CARD]}>
                <BlurView
                  intensity={BLUR.overlay}
                  tint={BLUR.tint}
                  style={styles.card}
                >
                  <Text style={styles.titleLg}>{t("login.codeTitle")}</Text>
                  <Text style={styles.subtitleLg}>
                    {t("login.codeSubtitle")}
                  </Text>
                  {/* The number that was actually texted, pinned LTR. */}
                  <Text style={styles.echo}>{sentTo}</Text>
                  <OtpBoxes
                    value={code}
                    onChange={setCode}
                    length={CODE_LENGTH}
                    editable={!busy}
                    autoFocus
                    accessibilityLabel={t("login.codeLabel")}
                    style={styles.boxes}
                  />
                  <View style={styles.resendRow}>
                    <Text style={styles.resendAsk}>
                      {t("login.resendQuestion")}
                    </Text>
                    {secondsLeft > 0 ? (
                      <Text style={styles.resendWait}>
                        {t("login.resendIn", { time: formatClock(secondsLeft) })}
                      </Text>
                    ) : (
                      <Pressable
                        onPress={() => void sendCode()}
                        disabled={busy}
                        hitSlop={12}
                        accessibilityRole="button"
                      >
                        <Text style={styles.resendLink}>
                          {t("login.resend")}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                  {error ? <Text style={styles.error}>{error}</Text> : null}
                </BlurView>
              </View>
              <PillButton
                label={t("login.verify")}
                onPress={() => void verifyCode()}
                loading={busy}
                disabled={!codeReady}
                style={styles.verify}
              />
            </>
          )}
        </View>
      </ScrollView>

      {/* Rendered LAST so it paints over the scrolling content, like Stitch's
          fixed header. */}
      <StickyHeader onBackPress={canGoBack ? onBack : undefined} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  /**
   * NOT REPRODUCED: Stitch's `mesh-gradient` body. The class name is in the
   * reference but its stops are not, and inventing a gradient is a redesign.
   */
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: SPACING.container,
  },
  centre: { width: "100%", maxWidth: MAX_CARD_WIDTH, alignSelf: "center" },
  /**
   * `overflow: hidden` is REQUIRED, not cosmetic: AuthProgress's bar variant is
   * absolutely positioned at top 0 and its square ends would cross this radius
   * without it. The blur also needs a clipping parent to keep its corners.
   */
  cardWrap: {
    width: "100%",
    borderRadius: RADIUS.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: alpha(COLORS.outlineVariant, 0.3),
    overflow: "hidden",
  },
  card: {
    padding: SPACING.xl,
    backgroundColor: alpha(COLORS.surfaceContainer, 0.6),
  },
  dashes: { marginBottom: SPACING.xxl },
  /** phone_number_entry heads with headline-lg-mobile. */
  titleSm: {
    ...typo("headlineLgMobile"),
    color: COLORS.onSurface,
    textAlign: textAlignStart(),
    marginBottom: SPACING.sm,
  },
  /** otp_verification heads a size larger, with headline-xl. */
  titleLg: {
    ...typo("headlineXl"),
    color: COLORS.onSurface,
    textAlign: textAlignStart(),
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...typo("bodyMd"),
    color: COLORS.onSurfaceVariant,
    textAlign: textAlignStart(),
    marginBottom: SPACING.xl,
  },
  subtitleLg: {
    ...typo("bodyLg"),
    color: COLORS.onSurfaceVariant,
    textAlign: textAlignStart(),
  },
  /**
   * A pinned Latin-content exception, same list as the brand wordmark and the
   * plate field: a leading "+" inside an Arabic paragraph can be reordered by
   * the bidi algorithm and land at the wrong end.
   */
  echo: {
    ...typo("titleMd"),
    color: COLORS.onSurface,
    textAlign: textAlignStart(),
    writingDirection: "ltr",
    marginTop: SPACING.xs,
  },
  boxes: { marginTop: SPACING.lg },
  // Plain "row": mirrored by React Native, so it reads correctly in all three.
  modeRow: { flexDirection: "row", gap: SPACING.xs, marginBottom: SPACING.lg },
  mode: {
    flex: 1,
    minHeight: TOUCH_TARGET,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surfaceContainerLow,
  },
  modeActive: {
    borderColor: COLORS.primaryContainer,
    backgroundColor: alpha(COLORS.primaryContainer, 0.16),
  },
  modeText: { ...typo("labelSm"), color: COLORS.onSurfaceVariant },
  modeTextOn: { color: COLORS.primary },
  resendRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  resendAsk: { ...typo("labelMd"), color: COLORS.onSurfaceVariant },
  /** Brand LETTERING, so `primary` rather than the filled primary-container. */
  resendLink: { ...typo("labelMd"), color: COLORS.primary },
  /** Stitch renders the waiting state as the same button, disabled. */
  resendWait: {
    ...typo("labelMd"),
    color: COLORS.onSurfaceVariant,
    writingDirection: "ltr",
  },
  gap: { height: SPACING.md },
  helper: {
    ...typo("labelSm"),
    color: COLORS.onSurfaceVariant,
    textAlign: textAlignStart(),
    marginTop: SPACING.sm,
  },
  error: {
    ...typo("labelSm"),
    color: COLORS.error,
    textAlign: textAlignStart(),
    marginTop: SPACING.md,
  },
  action: { marginTop: SPACING.xl },
  /** Stitch pins the confirm button BELOW the panel, after a 16px spacer. */
  verify: { marginTop: SPACING.lg },
});
