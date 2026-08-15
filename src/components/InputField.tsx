import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import {
  colors,
  radius,
  spacing,
  touchTarget,
  typography,
  withAlpha,
} from "../theme";

type Props = TextInputProps & {
  label: string;
  /** Phone numbers and OTP codes read left-to-right even in an Arabic UI. */
  numeric?: boolean;
};

/** Labelled text field on the dark theme, sized for one-handed use. */
export function InputField({ label, numeric = false, style, ...rest }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={withAlpha(colors.textOnDarkSecondary, 0.6)}
        selectionColor={colors.gold}
        style={[styles.input, numeric ? styles.numeric : styles.text, style]}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: "100%" },
  label: {
    ...typography.caption,
    color: colors.textOnDarkSecondary,
    marginBottom: spacing.xs,
    textAlign: "right",
    writingDirection: "rtl",
  },
  input: {
    minHeight: touchTarget.normal,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceDarkRaised,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingHorizontal: spacing.lg,
    color: colors.textOnDark,
  },
  text: { ...typography.body, textAlign: "right", writingDirection: "rtl" },
  numeric: {
    ...typography.numeric,
    textAlign: "center",
    letterSpacing: 2,
    writingDirection: "ltr",
  },
});
