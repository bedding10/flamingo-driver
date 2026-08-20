import React, { useMemo } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { textAlignStart } from "../i18n";
import {
  radius,
  spacing,
  touchTarget,
  typography,
  usePalette,
  withAlpha,
  type Palette,
} from "../theme";

type Props = TextInputProps & {
  label: string;
  /** Phone numbers and OTP codes read left-to-right even in an Arabic UI. */
  numeric?: boolean;
};

/** Labelled text field, sized for one-handed use, correct in both themes. */
export function InputField({ label, numeric = false, style, ...rest }: Props) {
  const palette = usePalette();
  const styles = useMemo(() => makeStyles(palette), [palette]);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={withAlpha(palette.textSecondary, 0.6)}
        selectionColor={palette.primary}
        style={[styles.input, numeric ? styles.numeric : styles.text, style]}
        {...rest}
      />
    </View>
  );
}

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    wrapper: { width: "100%" },
    /**
     * PHASE 1: was hardcoded to the right, which mis-aligned French and
     * English. Follows the layout direction now.
     */
    label: {
      ...typography.caption,
      color: palette.textSecondary,
      marginBottom: spacing.xs,
      textAlign: textAlignStart(),
    },
    input: {
      minHeight: touchTarget.normal,
      /** Stitch spec: inputs are 8px, not the 12px card radius. */
      borderRadius: radius.input,
      backgroundColor: palette.surfaceSunken,
      borderWidth: 1,
      borderColor: palette.border,
      paddingHorizontal: spacing.lg,
      color: palette.textPrimary,
    },
    text: { ...typography.body, textAlign: textAlignStart() },
    /**
     * Correct as it was: a phone number, OTP or plate reads left-to-right in
     * every language, so this one stays explicitly LTR and centred.
     */
    numeric: {
      ...typography.numeric,
      textAlign: "center",
      letterSpacing: 2,
      writingDirection: "ltr",
    },
  });
