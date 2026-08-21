import React, { useCallback, useMemo, useRef } from "react";
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
import {
  radius,
  spacing,
  stitchType,
  usePalette,
  type Palette,
} from "../../theme";

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
 * PHASE 2 - Stitch `otp_verification`: six single-character boxes.
 *
 * WHY THIS IS NOT A STRAIGHT PORT OF STITCH'S SCRIPT
 * iOS one-time-code autofill and Android SMS autofill hand over the WHOLE code
 * at once, into whichever field is focused. Stitch's script only ever advances
 * one character, so a literal port would BREAK autofill on the single input a
 * driver uses most, and force six manual taps from a notification they can see.
 * So any multi-character string arriving in any box is DISTRIBUTED across the
 * remaining boxes. The geometry is Stitch's; the input handling is native.
 *
 * The value is kept packed - boxes fill from the leading edge and backspace
 * removes the last character - so `value` stays a plain digit string the parent
 * can length-check, instead of a sparse six-slot array.
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
  const palette = usePalette();
  const styles = useMemo(() => makeStyles(palette), [palette]);
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
   * back. onChangeText never fires for it - the text did not change - so the key
   * event is the only place this can be detected.
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

  return (
    /**
     * rowNeverMirrored(): digit positions are absolute, and Stitch pins this
     * container to dir="ltr" for the same reason. Mirroring would put digit 1 on
     * the right in Arabic while the code itself still reads left to right.
     */
    <View style={[styles.row, style]}>
      {Array.from({ length }, (_unused, index) => (
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
          /**
           * maxLength is the FULL length, not 1: capping every box at one
           * character is exactly what would truncate an autofilled code down to
           * its first digit. The controlled value keeps one digit on screen.
           */
          maxLength={length}
          textContentType={index === 0 ? "oneTimeCode" : "none"}
          autoComplete={index === 0 ? "sms-otp" : "off"}
          accessibilityLabel={index === 0 ? accessibilityLabel : undefined}
          selectionColor={palette.primary}
        />
      ))}
    </View>
  );
}

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    row: {
      flexDirection: rowNeverMirrored(),
      justifyContent: "center",
      gap: spacing.md,
    },
    box: {
      width: BOX_WIDTH,
      height: BOX_HEIGHT,
      borderRadius: radius.input,
      borderWidth: 1,
      borderColor: palette.borderStrong,
      backgroundColor: palette.surfaceSunken,
      color: palette.textPrimary,
      ...stitchType.headlineXl,
      /**
       * The headline-xl token carries -0.72 tracking and a 44px line box. Both
       * are wrong for ONE centred character in a 56px well: the tracking shifts
       * the glyph off centre and the fixed line box fights vertical centring on
       * Android.
       */
      lineHeight: undefined,
      letterSpacing: 0,
      paddingVertical: 0,
      paddingHorizontal: 0,
      /**
       * Centring lives HERE and not on a `textAlign` prop: it is certain to be
       * valid in a TextStyle, and there is no compiler here to confirm whether
       * TextInputProps declares it.
       */
      textAlign: "center",
      textAlignVertical: "center",
    },
  });
