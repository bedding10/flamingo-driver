import React, { useMemo } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
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
    label: {
      ...typography.caption,
      color: palette.textSecondary,
      marginBottom: spacing.xs,
      textAlign: "right",
      writingDirection: "rtl",
    },
    input: {
      minHeight: touchTarget.normal,
      borderRadius: radius.md,
      backgroundColor: palette.surfaceSunken,
      borderWidth: 1,
      borderColor: palette.border,
      paddingHorizontal: spacing.lg,
      color: palette.textPrimary,
    },
    text: { ...typography.body, textAlign: "right", writingDirection: "rtl" },
    numeric: {
      ...typography.numeric,
      textAlign: "center",
      letterSpacing: 2,
      writingDirection: "ltr",
    },
  });
