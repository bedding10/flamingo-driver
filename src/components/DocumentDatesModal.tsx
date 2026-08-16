import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { colors, radius, spacing, touchTarget, typography, withAlpha } from "../theme";
import { strings } from "../i18n/strings";
import { DOC_LABELS, p1 } from "../i18n/strings.phase1";
import { formatDateInput, parseIsoDay } from "../utils/documentDates";
import { DOC_DATE_RULES, type DocumentType } from "../types/driver";

/** What POST /driver/me/documents accepts alongside the object key. */
export type DocumentDates = {
  issuedAt?: string;
  expiresAt?: string;
};

type Props = {
  type: DocumentType | null;
  onCancel: () => void;
  onConfirm: (type: DocumentType, dates: DocumentDates) => void;
};

/**
 * Asks for the dates printed on the document BEFORE the camera opens.
 *
 * Order matters. Asking afterwards means the driver has already taken the photo
 * and any validation failure throws that photo away; asking first costs nothing
 * if they abandon the flow.
 *
 * The expiry rule is the strict one: a document that expires today or earlier
 * is refused outright rather than uploaded and rejected by an operator days
 * later. That is not the app inventing policy - a technical inspection past its
 * date is simply not a valid document, and the server would mark it EXPIRED on
 * the very next read.
 */
export function DocumentDatesModal({ type, onCancel, onConfirm }: Props) {
  const [issued, setIssued] = useState("");
  const [expires, setExpires] = useState("");
  const [error, setError] = useState<string | null>(null);

  // A fresh modal for every document: leftover text from the previous one
  // would be the wrong date on the wrong paper.
  useEffect(() => {
    setIssued("");
    setExpires("");
    setError(null);
  }, [type]);

  if (!type) return null;

  const rule = DOC_DATE_RULES[type];

  const confirm = () => {
    setError(null);
    const dates: DocumentDates = {};

    if (rule.issued) {
      if (!issued.trim()) {
        setError(p1.documents.issuedRequired);
        return;
      }
      const issuedDate = parseIsoDay(issued);
      if (!issuedDate) {
        setError(p1.documents.dateInvalid);
        return;
      }
      if (issuedDate.getTime() > Date.now()) {
        setError(p1.documents.issuedInFuture);
        return;
      }
      dates.issuedAt = issuedDate.toISOString();
    }

    if (rule.expires) {
      if (!expires.trim()) {
        setError(p1.documents.expiresRequired);
        return;
      }
      const expiryDate = parseIsoDay(expires);
      if (!expiryDate) {
        setError(p1.documents.dateInvalid);
        return;
      }
      if (expiryDate.getTime() <= Date.now()) {
        setError(p1.documents.expiresInPast);
        return;
      }
      if (dates.issuedAt && expiryDate.getTime() <= Date.parse(dates.issuedAt)) {
        setError(p1.documents.expiresBeforeIssued);
        return;
      }
      dates.expiresAt = expiryDate.toISOString();
    }

    onConfirm(type, dates);
  };

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.sheet}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>{p1.documents.datesTitle}</Text>
            <Text style={styles.docName}>{DOC_LABELS[type]}</Text>
            <Text style={styles.subtitle}>{p1.documents.datesSubtitle}</Text>

            {rule.issued ? (
              <DateField
                label={p1.documents.issuedAtLabel}
                value={issued}
                onChange={setIssued}
              />
            ) : null}

            {rule.expires ? (
              <DateField
                label={p1.documents.expiresAtLabel}
                value={expires}
                onChange={setExpires}
              />
            ) : null}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              accessibilityRole="button"
              onPress={confirm}
              style={({ pressed }) => [
                styles.primary,
                pressed ? styles.pressed : null,
              ]}
            >
              <Text style={styles.primaryLabel}>
                {p1.documents.continueToPhoto}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={onCancel}
              style={({ pressed }) => [
                styles.secondary,
                pressed ? styles.pressed : null,
              ]}
            >
              <Text style={styles.secondaryLabel}>{strings.common.cancel}</Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={(text) => onChange(formatDateInput(text))}
        placeholder={p1.documents.datePlaceholder}
        placeholderTextColor={colors.textOnDarkSecondary}
        keyboardType="number-pad"
        maxLength={10}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: withAlpha(colors.ink, 0.8),
    justifyContent: "center",
    padding: spacing.xl,
  },
  sheet: {
    maxHeight: "85%",
    backgroundColor: colors.surfaceDark,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: spacing.xl,
  },
  title: {
    ...typography.title,
    color: colors.textOnDark,
    textAlign: "right",
    writingDirection: "rtl",
  },
  docName: {
    ...typography.label,
    color: colors.gold,
    textAlign: "right",
    writingDirection: "rtl",
    marginTop: spacing.xs,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textOnDarkSecondary,
    textAlign: "right",
    writingDirection: "rtl",
    marginTop: spacing.xs,
  },
  field: { marginTop: spacing.lg },
  fieldLabel: {
    ...typography.caption,
    color: colors.textOnDarkSecondary,
    textAlign: "right",
    writingDirection: "rtl",
    marginBottom: spacing.xs,
  },
  input: {
    minHeight: touchTarget.normal,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: withAlpha(colors.offWhite, 0.06),
    paddingHorizontal: spacing.lg,
    color: colors.textOnDark,
    // The value is always YYYY-MM-DD, which is a Latin-digit sequence: forcing
    // LTR here stops RTL layout from displaying it back to front.
    textAlign: "left",
    writingDirection: "ltr",
    ...typography.body,
  },
  error: {
    ...typography.body,
    color: colors.danger,
    textAlign: "right",
    writingDirection: "rtl",
    marginTop: spacing.lg,
  },
  primary: {
    minHeight: touchTarget.critical,
    borderRadius: radius.md,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xl,
  },
  primaryLabel: {
    ...typography.label,
    color: colors.ink,
    writingDirection: "rtl",
  },
  secondary: {
    minHeight: touchTarget.normal,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
  },
  secondaryLabel: {
    ...typography.body,
    color: colors.textOnDarkSecondary,
    writingDirection: "rtl",
  },
  pressed: { opacity: 0.75 },
});
