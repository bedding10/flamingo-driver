import React, { useCallback, useRef } from "react";
import {
  StyleSheet,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type StyleProp,
  type TextInputKeyPressEventData,
  type ViewStyle,
} from "react-native";

import { rowNeverMirrored } from "../../i18n";
import { COLORS, RADIUS, SPACING, typo } from "../../theme/tokens";

/** Stitch `w-12 h-14` per box, `gap-3` between them. */
const BOX_WIDTH = 48;
const BOX_HEIGHT = 56;
const DEFAULT_LENGTH = 6;

type Props = {
  /** The whole code. Box `i` shows `value[i]`. */
  value: string;
  onChange: (next: string) => void;
  length?: number;
  editable?: boolean;
  autoFocus?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Stitch `otp_verification`: six single-character boxes, on tokens.
 *
 * WHY THIS IS NOT A STRAIGHT PORT OF STITCH'S SCRIPT
 * iOS one-time-code autofill and Android SMS autofill hand over the WHOLE code
 * at once, into whichever field is focused. Stitch's script only ever advances
 * one character, so a literal port would BREAK autofill. Any multi-character
 * string arriving in any box is DISTRIBUTED across the remaining boxes.
 */
export function OtpBoxes({
  value,
  onChange,
  length = DEFAULT_LENGTH,
  editable = true,
  autoFocus = false,
  accessibilityLabel,
  style,
}: Props) {
  const inputs = useRef<Array<TextInput | null>>([]);

  const focusAt = useCallback((index: number) => {
    inputs.current[index]?.focus();
  }, []);

  const handleChange = useCallback(
    (index: number, text: string) => {
      const digits = text.replace(/\D/g, "");

      // Empty means the driver cleared this box: drop that character only.
      if (digits.length === 0) {
        onChange(value.slice(0, index) + value.slice(index + 1));
        return;
      }

      /**
       * A controlled box already displays `value[index]`, so typing over a
       * filled box arrives as "old" + "new". Stripping the character that is
       * already there makes that a REPLACE instead of an insert, while a real
       * autofill of six digits into an empty box passes through untouched.
       */
      const current = value[index] ?? "";
      const incoming =
        current && digits.startsWith(current) ? digits.slice(1) : digits;
      if (incoming.length === 0) return;

      const next = (
        value.slice(0, index) +
        incoming +
        value.slice(index + incoming.length)
      ).slice(0, length);
      onChange(next);

      const landed = Math.min(index + incoming.length, length - 1);
      if (next.length >= length) {
        // Complete: get the keyboard off the confirm button.
        inputs.current[landed]?.blur();
      } else {
        focusAt(landed);
      }
    },
    [focusAt, length, onChange, value],
  );

  /**
   * Backspace on an EMPTY box has to delete the previous character and step
   * back. onChangeText never fires for it, so the key event is the only place
   * this can be detected.
   */
  const handleKeyPress = useCallback(
    (index: number, event: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      if (event.nativeEvent.key !== "Backspace") return;
      if (value[index]) return;
      if (index === 0) return;
      onChange(value.slice(0, index - 1) + value.slice(index));
      focusAt(index - 1);
    },
    [focusAt, onChange, value],
  );

  const renderBox = (index: number) => (
    <TextInput
      key={index}
      ref={(node) => {
        inputs.current[index] = node;
      }}
      value={value[index] ?? ""}
      onChangeText={(text) => handleChange(index, text)}
      onKeyPress={(event) => handleKeyPress(index, event)}
      editable={editable}
      autoFocus={autoFocus && index === 0}
      style={styles.box}
      keyboardType="number-pad"
      maxLength={length}
      textContentType={index === 0 ? "oneTimeCode" : "none"}
      autoComplete={index === 0 ? "sms-otp" : "off"}
      accessibilityLabel={index === 0 ? accessibilityLabel : undefined}
      selectionColor={COLORS.primaryContainer}
    />
  );

  return (
    /**
     * rowNeverMirrored(): digit positions are absolute, and Stitch pins this
     * container to dir="ltr" for the same reason.
     */
    <View style={[styles.row, style]}>
      {Array.from({ length }, (_, index) => renderBox(index))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: rowNeverMirrored(),
    justifyContent: "center",
    gap: SPACING.md,
  },
  box: {
    width: BOX_WIDTH,
    height: BOX_HEIGHT,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.outline,
    backgroundColor: COLORS.surface,
    color: COLORS.onSurface,
    ...typo("headlineXl"),
    // A single centred glyph: the 44px line box would push it off centre.
    lineHeight: undefined,
    letterSpacing: 0,
    paddingVertical: 0,
    paddingHorizontal: 0,
    textAlign: "center",
    textAlignVertical: "center",
  },
});
