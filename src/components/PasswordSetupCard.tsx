import React, { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { InputField } from "./InputField";
import { PrimaryButton } from "./PrimaryButton";
import { SectionCard } from "./SectionCard";
import { authApi } from "../api";
import { toApiError } from "../api/client";
import { strings } from "../i18n/strings";
import { pw } from "../i18n/strings.password";
import { colors, spacing, typography } from "../theme";

/** Mirrors ChangePasswordDto on the server: MinLength(6), MaxLength(72). */
const MIN_LENGTH = 6;
/** bcrypt truncates past 72 bytes, so the server refuses longer secrets. */
const MAX_LENGTH = 72;

/**
 * PHASE 1 — optional password for a phone-authenticated driver.
 *
 * Sign-in stays Firebase phone verification: this card does not create a second
 * account, does not touch the phone number, and does not issue tokens. It only
 * fills User.passwordHash so the driver can LATER return through
 * POST /auth/login with the same phone number.
 *
 * The "current password" field is optional by design: an account created by the
 * Firebase flow has no hash yet, and the server accepts the first set without
 * one. Once a password exists the server requires it again — the client does
 * not decide that, it only sends what it has.
 */
export function PasswordSetupCard() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async () => {
    setError(null);
    setDone(false);

    if (next.length < MIN_LENGTH) {
      setError(pw.setup.tooShort);
      return;
    }
    if (next.length > MAX_LENGTH) {
      setError(pw.setup.tooLong);
      return;
    }
    if (next !== confirm) {
      setError(pw.setup.mismatch);
      return;
    }

    setBusy(true);
    try {
      await authApi.setPassword({
        newPassword: next,
        // Empty string would be sent as a wrong current password; undefined is
        // the difference between "first time" and "wrong secret".
        currentPassword: current.trim() ? current : undefined,
      });
      setDone(true);
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (saveError) {
      const apiError = toApiError(saveError);
      setError(apiError.offline ? strings.errors.network : pw.setup.failed);
    } finally {
      setBusy(false);
    }
  };

  const ready = next.length >= MIN_LENGTH && confirm.length >= MIN_LENGTH;

  return (
    <SectionCard title={pw.setup.title} hint={pw.setup.hint}>
      <InputField
        label={pw.setup.currentLabel}
        placeholder={pw.setup.placeholder}
        value={current}
        onChangeText={setCurrent}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        editable={!busy}
        maxLength={MAX_LENGTH}
      />
      <Text style={styles.hint}>{pw.setup.currentHint}</Text>

      <InputField
        label={pw.setup.newLabel}
        placeholder={pw.setup.placeholder}
        value={next}
        onChangeText={setNext}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="newPassword"
        editable={!busy}
        maxLength={MAX_LENGTH}
      />
      <InputField
        label={pw.setup.confirmLabel}
        placeholder={pw.setup.placeholder}
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        editable={!busy}
        maxLength={MAX_LENGTH}
      />

      <Text style={styles.hint}>{pw.setup.sessionsWarning}</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {done && !error ? (
        <Text style={styles.success}>{pw.setup.saved}</Text>
      ) : null}

      <PrimaryButton
        label={pw.setup.submit}
        onPress={() => void submit()}
        loading={busy}
        disabled={!ready}
        style={styles.action}
      />
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  hint: {
    ...typography.caption,
    color: colors.textOnDarkSecondary,
    textAlign: "right",
    writingDirection: "rtl",
  },
  error: {
    ...typography.caption,
    color: colors.danger,
    textAlign: "right",
    writingDirection: "rtl",
  },
  success: {
    ...typography.caption,
    color: colors.online,
    textAlign: "right",
    writingDirection: "rtl",
  },
  action: { marginTop: spacing.sm },
});
