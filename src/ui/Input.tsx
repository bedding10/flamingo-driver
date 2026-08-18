import React, { useState } from "react";
import {
  StyleSheet,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import {
  iconSize,
  radius,
  spacing,
  touchTarget,
  typography,
  usePalette,
  withAlpha,
} from "../theme";
import { Icon, type IconName } from "../components/Icon";
import { AppText } from "./AppText";
import { rtlRow } from "./rtl";

/**
 * The text field of the design system.
 *
 * The reference pack draws an unfilled field with a 1px border that turns
 * flamingo pink on focus, and that is what this is. Three rules are enforced
 * here rather than left to each screen:
 *
 *  - the field is at least 48pt tall, because it is tapped in a moving car;
 *  - the text is right aligned with an RTL writing direction, so an Arabic
 *    name and a Latin plate number both read correctly;
 *  - an error replaces the hint instead of appearing next to it, so the driver
 *    reads one line, not two competing ones.
 */
export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  hint,
  error,
  icon,
  keyboardType,
  secureTextEntry = false,
  maxLength,
  editable = true,
  multiline = false,
  autoFocus = false,
  onSubmitEditing,
  style,
}: {
  label?: string;
  value: string;
  onChangeText: (next: string) => void;
  placeholder?: string;
  hint?: string;
  /** Shown in place of the hint and turns the border red. */
  error?: string | null;
  icon?: IconName;
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
  maxLength?: number;
  editable?: boolean;
  multiline?: boolean;
  autoFocus?: boolean;
  onSubmitEditing?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const palette = usePalette();
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? palette.danger
    : focused
      ? palette.primary
      : palette.border;

  return (
    <View style={[styles.wrap, style]}>
      {label ? (
        <AppText variant="label" tone="secondary">
          {label}
        </AppText>
      ) : null}

      <View
        style={[
          styles.field,
          multiline ? styles.fieldMultiline : null,
          {
            borderColor,
            backgroundColor: editable
              ? palette.surface
              : palette.surfaceSunken,
          },
          focused ? { shadowColor: palette.primary } : null,
          focused ? styles.focusGlow : null,
        ]}
      >
        {icon ? (
          <Icon
            name={icon}
            size={iconSize.md}
            color={focused ? palette.primaryText : palette.textMuted}
          />
        ) : null}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={palette.textMuted}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          maxLength={maxLength}
          editable={editable}
          multiline={multiline}
          autoFocus={autoFocus}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            styles.input,
            { color: editable ? palette.textPrimary : palette.textSecondary },
            multiline ? styles.inputMultiline : null,
          ]}
        />
      </View>

      {error ? (
        <AppText variant="caption" tone="danger">
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" tone="muted">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  field: {
    ...rtlRow,
    alignItems: "center",
    gap: spacing.sm,
    minHeight: touchTarget.stitchMin,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  fieldMultiline: { alignItems: "flex-start", paddingVertical: spacing.md },
  // The reference focus state is a pink halo, not a thicker border.
  focusGlow: {
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  input: {
    ...typography.body,
    flex: 1,
    paddingVertical: spacing.sm,
    textAlign: "right",
    writingDirection: "rtl",
  },
  inputMultiline: { minHeight: 96, textAlignVertical: "top" },
});

/** Kept next to the field it belongs to. */
export const inputBorder = (focused: boolean, hasError: boolean) =>
  hasError ? "error" : focused ? "focus" : "idle";

/** Exported for screens that need the same wash behind a read-only value. */
export const readOnlyWash = (color: string) => withAlpha(color, 0.08);
