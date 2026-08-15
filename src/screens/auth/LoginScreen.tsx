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
import { strings } from "../../i18n/strings";
import { colors, spacing, typography } from "../../theme";
import { authErrorMessage } from "../../auth/auth-errors";
import {
  confirmPhoneCode,
  normalizeE164,
  requestPhoneCode,
  type PhoneConfirmation,
} from "../../auth/firebase";
import { useAuthStore } from "../../auth/auth.store";

const CODE_LENGTH = 6;
const RESEND_SECONDS = 60;

/**
 * Phone -> SMS code -> backend session.
 *
 * Firebase verifies the number, then POST /auth/firebase exchanges the ID token
 * for the backend JWTs, which go straight into secure storage. There is no local
 * OTP path: the server's own OTP endpoints are disabled.
 *
 * The screen holds no token and no user object; it hands the tokens to the auth
 * store and unmounts when the root tree switches to the signed-in stack.
 */
export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const signIn = useAuthStore((state) => state.signIn);

  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
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

  const backToPhone = useCallback(() => {
    confirmationRef.current = null;
    setStep("phone");
    setCode("");
    setError(null);
  }, []);

  const phoneReady = phone.replace(/\D/g, "").length >= 8;
  const codeReady = code.trim().length === CODE_LENGTH;

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

        {step === "phone" ? (
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
  card: { width: "100%" },
  title: {
    ...typography.title,
    color: colors.textOnDark,
    textAlign: "right",
    writingDirection: "rtl",
  },
  subtitle: {
    ...typography.body,
    color: colors.textOnDarkSecondary,
    textAlign: "right",
    writingDirection: "rtl",
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  phoneEcho: {
    ...typography.numeric,
    color: colors.gold,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
    textAlign: "right",
    writingDirection: "rtl",
    marginTop: spacing.md,
  },
  action: { marginTop: spacing.xl },
  footer: {
    marginTop: spacing.xl,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  link: { ...typography.label, color: colors.gold, writingDirection: "rtl" },
  timer: {
    ...typography.caption,
    color: colors.textOnDarkSecondary,
    writingDirection: "rtl",
  },
});
