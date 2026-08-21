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
import { AuthProgress } from "../../components/auth/AuthProgress";
import { OtpBoxes } from "../../components/auth/OtpBoxes";
import { PhoneField } from "../../components/auth/PhoneField";
import { BrandMark } from "../../components/BrandMark";
import { Icon } from "../../components/Icon";
import { InputField } from "../../components/InputField";
import { PrimaryButton } from "../../components/PrimaryButton";
import { textAlignStart, useTranslation } from "../../i18n";
import { pw } from "../../i18n/strings.password";
import {
  iconSize,
  layout,
  radius,
  shadows,
  spacing,
  stitchType,
  touchTarget,
  usePalette,
  withAlpha,
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
const MIN_PHONE_DIGITS = 8;
const MAX_PASSWORD_LENGTH = 72;
const SECONDS_PER_MINUTE = 60;

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
 * Phone -> SMS code -> backend session.
 *
 * Firebase verifies the number, then POST /auth/firebase exchanges the ID token
 * for the backend JWTs, which go straight into secure storage. There is a SECOND
 * door to the SAME account, not a second account: once a password is set, POST
 * /auth/login accepts the same phone plus that password. Account CREATION is
 * still Firebase-only, because the server's local OTP routes are disabled.
 *
 * The screen holds no token and no user object; it hands the tokens to the auth
 * store and unmounts when the root tree switches to the signed-in stack.
 *
 * PHASE 2 - STITCH GEOMETRY, ONE COMPONENT, TWO SCREENS
 * The reference is two designs: `phone_number_entry` and `otp_verification`.
 * They are NOT two navigator routes here, and that is deliberate. The Firebase
 * ConfirmationResult is a live object with a method on it, and React Navigation
 * params must be serialisable - so a route split would force either a
 * non-serialisable param or Firebase state hoisted into a store, both to serve a
 * purely visual boundary. Instead each STEP renders its own layout, progress
 * position and header behaviour, while one component owns the handle.
 *
 * `route.params.mode` decides which door opens, because the Welcome screen's two
 * buttons mean different things: registration must land on SMS, signing in on
 * the password form. Read as a lazy initial value only, so switching doors
 * afterwards is not undone by a re-render.
 *
 * NOT BUILT, ON PURPOSE: Stitch layers a dimmed map under both screens. Mounting
 * a map here would request location permission before the driver even has an
 * account, and burn battery and map loads on the one screen that needs neither.
 * Recorded as a visual delta rather than quietly dropped.
 */
export function LoginScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const palette = usePalette();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(palette), [palette]);
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
      // of the SMS attempts Firebase rate-limits per device. The normalised
      // value is what gets sent AND what gets echoed on the next step, so the
      // driver sees the number that was actually texted.
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
   * Returning driver, no SMS.
   *
   * Normalised with the same helper the Firebase flow uses, because the stored
   * User.phone came from a Firebase token: sending "0555..." would look up a row
   * that does not exist.
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
   * phone step does it pop to Welcome, and only if there is something to pop:
   * a deep link straight to Login must not dead-end on a dead button.
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
            paddingTop: insets.top + touchTarget.stitchMin + spacing.xl,
            paddingBottom: Math.max(insets.bottom, layout.safeAreaBottomMin),
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.centre}>
          {mode === "password" ? (
            <View style={styles.card}>
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
              <PrimaryButton
                label={t("login.signIn")}
                onPress={() => void passwordSignIn()}
                loading={busy}
                disabled={!passwordReady}
                size="compact"
                style={styles.action}
              />
              <Text style={styles.helper}>{pw.login.noPasswordHint}</Text>
            </View>
          ) : step === "phone" ? (
            <View style={styles.card}>
              {/* Absolute, so the card must clip - see styles.card. */}
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
              <PrimaryButton
                label={t("login.sendCode")}
                onPress={() => void sendCode()}
                loading={busy}
                disabled={!phoneReady}
                size="compact"
                style={styles.action}
              />
            </View>
          ) : (
            <>
              {/* Stitch puts the OTP indicator ABOVE the panel, and lights the
                  MIDDLE segment. */}
              <AuthProgress step={2} variant="dashes" style={styles.dashes} />
              <View style={styles.card}>
                <Text style={styles.titleLg}>{t("login.codeTitle")}</Text>
                <Text style={styles.subtitleLg}>{t("login.codeSubtitle")}</Text>
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
                      <Text style={styles.resendLink}>{t("login.resend")}</Text>
                    </Pressable>
                  )}
                </View>
                {error ? <Text style={styles.error}>{error}</Text> : null}
              </View>
              <PrimaryButton
                label={t("login.verify")}
                onPress={() => void verifyCode()}
                loading={busy}
                disabled={!codeReady}
                size="compact"
                style={styles.verify}
              />
            </>
          )}
        </View>
      </ScrollView>

      {/*
        Rendered LAST so it paints over the scrolling content, which is what
        Stitch's fixed header does. Three children with space-between keeps the
        wordmark optically centred without a transform.
      */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top,
            height: insets.top + touchTarget.stitchMin,
          },
        ]}
      >
        {canGoBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={8}
            style={styles.headerSlot}
            accessibilityRole="button"
            accessibilityLabel={t("common.back")}
          >
            {/*
              Stitch draws `arrow_forward` here: under RTL the back affordance
              points RIGHT. Icon resolves that from the layout direction, and
              section 48 forbids rendering the ligature name as text.
            */}
            <Icon name="back" size={iconSize.lg} color={palette.primaryText} />
          </Pressable>
        ) : (
          <View style={styles.headerSlot} />
        )}
        <BrandMark compact size={20} />
        <View style={styles.headerSlot} />
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: palette.background },
    /**
     * NOT REPRODUCED: Stitch's `mesh-gradient` body. The class name is in the
     * reference but its stops are not, and inventing a gradient is a redesign.
     */
    content: {
      flexGrow: 1,
      justifyContent: "center",
      paddingHorizontal: layout.containerPadding,
    },
    centre: {
      width: "100%",
      maxWidth: MAX_CARD_WIDTH,
      alignSelf: "center",
    },
    header: {
      position: "absolute",
      top: 0,
      // Symmetric physical insets: direction-neutral, deliberately not logical.
      left: 0,
      right: 0,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: layout.gutter,
      // The app's stand-in for `backdrop-blur`: its alpha is already raised
      // because Android has no backdrop blur.
      backgroundColor: palette.overlay,
      ...shadows.soft,
    },
    /** Stitch reserves a touch-target-wide slot on BOTH sides to centre the
     *  wordmark, including where there is no button to put in it. */
    headerSlot: {
      width: touchTarget.stitchMin,
      height: touchTarget.stitchMin,
      alignItems: "center",
      justifyContent: "center",
    },
    /**
     * `overflow: hidden` is REQUIRED, not cosmetic: AuthProgress's bar variant
     * is absolutely positioned at top 0 and its square ends would cross this
     * radius without it.
     */
    card: {
      width: "100%",
      borderRadius: radius.card,
      padding: spacing["2xl"],
      backgroundColor: palette.overlay,
      borderWidth: 1,
      borderColor: withAlpha(palette.border, 0.3),
      overflow: "hidden",
      ...shadows.floating,
    },
    dashes: { marginBottom: spacing["3xl"] },
    /** phone_number_entry heads with headline-lg-mobile. */
    titleSm: {
      ...stitchType.headlineLgMobile,
      color: palette.textPrimary,
      textAlign: textAlignStart(),
      marginBottom: spacing.sm,
    },
    /** otp_verification heads a size larger, with headline-xl. */
    titleLg: {
      ...stitchType.headlineXl,
      color: palette.textPrimary,
      textAlign: textAlignStart(),
      marginBottom: spacing.sm,
    },
    subtitle: {
      ...stitchType.bodyMd,
      color: palette.textSecondary,
      textAlign: textAlignStart(),
      marginBottom: spacing["2xl"],
    },
    subtitleLg: {
      ...stitchType.bodyLg,
      color: palette.textSecondary,
      textAlign: textAlignStart(),
    },
    /**
     * A pinned Latin-content exception, same list as the brand wordmark and the
     * plate field: a leading "+" inside an Arabic paragraph can be reordered by
     * the bidi algorithm and land at the wrong end, which would mean rendering
     * the one string that proves we texted the right number incorrectly.
     */
    echo: {
      ...stitchType.titleMd,
      color: palette.textPrimary,
      textAlign: textAlignStart(),
      writingDirection: "ltr",
      marginTop: spacing.xs,
    },
    boxes: { marginTop: spacing.lg },
    // Plain "row": mirrored by React Native, so it reads correctly in all three.
    modeRow: {
      flexDirection: "row",
      gap: spacing.xs,
      marginBottom: spacing.xl,
    },
    mode: {
      flex: 1,
      minHeight: touchTarget.stitchMin,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.surfaceSunken,
    },
    modeActive: {
      borderColor: palette.primary,
      backgroundColor: palette.primaryWash,
    },
    // Centred inside its own Pressable, so it needs no alignment of its own.
    modeText: { ...stitchType.labelSm, color: palette.textSecondary },
    modeTextOn: { color: palette.primaryText },
    resendRow: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: spacing.sm,
      marginTop: spacing.lg,
    },
    resendAsk: { ...stitchType.labelMd, color: palette.textSecondary },
    /** Brand LETTERING, so primaryText rather than the filled primary. */
    resendLink: { ...stitchType.labelMd, color: palette.primaryText },
    /** Stitch renders the waiting state as the same button, disabled. */
    resendWait: {
      ...stitchType.labelMd,
      color: palette.textMuted,
      writingDirection: "ltr",
    },
    gap: { height: spacing.md },
    helper: {
      ...stitchType.labelSm,
      color: palette.textSecondary,
      textAlign: textAlignStart(),
      marginTop: spacing.sm,
    },
    error: {
      ...stitchType.labelSm,
      color: palette.danger,
      textAlign: textAlignStart(),
      marginTop: spacing.md,
    },
    action: { marginTop: spacing["2xl"] },
    /** Stitch pins the confirm button BELOW the panel, after a 16px spacer. */
    verify: { marginTop: spacing.lg },
  });
