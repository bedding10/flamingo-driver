import React, { useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import {
  radius,
  spacing,
  stitchType,
  touchTarget,
  usePalette,
  withAlpha,
  type Palette,
} from "../../theme";

/**
 * flaminGO operates in Algeria only (sections 11 and 62), so the dial code is a
 * constant rather than a picker. If the product ever crosses a border, THIS is
 * the one place that has to grow a country selector - the field itself already
 * holds the national number, and `normalizeE164` already takes a country.
 */
const DIAL_CODE = "+213";
const FLAG = "\ud83c\udde9\ud83c\uddff";

/** Stitch `focus-within:shadow-[0_0_8px_rgba(255,77,141,0.2)]`. */
const GLOW_ALPHA = 0.2;
const GLOW_RADIUS = 8;

type Props = Omit<TextInputProps, "style"> & {
  containerStyle?: StyleProp<ViewStyle>;
};

/**
 * PHASE 2 - Stitch `phone_number_entry`: a fixed +213 block welded to the
 * leading edge of an LTR national-number field, inside one bordered box.
 *
 * WHY NOT InputField
 * That component is one label over one TextInput with no adornment slot and no
 * focus state, and it is used by profile, vehicle, documents, wallet and
 * negotiation. Growing it to serve two auth screens would put a regression risk
 * on all of them for no gain.
 *
 * THE FIELD IS DARKER THAN THE BLOCK BESIDE IT, ON PURPOSE
 * Stitch pairs `bg-surface` on the field with `bg-surface-container` on the
 * block, and in its own token ladder that makes the FIELD the darker of the two.
 * `surfaceSunken` and `surface` preserve that relationship while reusing the
 * recessed-well role every other input in this app already uses, so the field
 * still reads as an input in light mode instead of vanishing into the panel.
 *
 * THE NUMBER STAYS LTR
 * A phone number reads left-to-right in Arabic, French and English alike. Both
 * the dial code and the input are pinned, joining the same short list of
 * deliberate Latin-content exceptions as the brand wordmark, the plate field and
 * the fare input.
 */
export function PhoneField({ containerStyle, editable, ...rest }: Props) {
  const palette = usePalette();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.glowWrap, focused && styles.glowOn, containerStyle]}>
      <View style={[styles.row, focused && styles.rowFocused]}>
        <View style={styles.country}>
          {/*
            No lineHeight is set on the flag: `leading-none` on a 24px emoji
            clips the glyph on some Android builds, and letting the platform
            pick the line box costs nothing here.
            HONEST LIMITATION: very old Android builds with no regional-indicator
            support render this as the letters "DZ". Still readable, so it is not
            worth shipping a bitmap for.
          */}
          <Text style={styles.flag} accessible={false}>
            {FLAG}
          </Text>
          <Text style={styles.dial}>{DIAL_CODE}</Text>
        </View>

        <TextInput
          {...rest}
          editable={editable}
          onFocus={(event) => {
            setFocused(true);
            rest.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            rest.onBlur?.(event);
          }}
          style={styles.input}
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          // Stitch asks for "tel-national"; this is the value React Native is
          // certain to accept, and there is no compiler here to check the other.
          autoComplete="tel"
          placeholderTextColor={withAlpha(palette.textSecondary, 0.5)}
          selectionColor={palette.primary}
        />
      </View>
    </View>
  );
}

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    /**
     * The glow lives on an OUTER view so the inner row can clip its children to
     * the corner radius without also clipping the shadow.
     */
    glowWrap: { width: "100%", borderRadius: radius.input },
    /**
     * Decoration only. The real focus signal is the border below, because
     * Android draws elevation shadows black under API 28 and a focus state that
     * only exists as a shadow would silently disappear there.
     */
    glowOn: {
      shadowColor: withAlpha(palette.primary, GLOW_ALPHA),
      shadowOpacity: 1,
      shadowRadius: GLOW_RADIUS,
      shadowOffset: { width: 0, height: 0 },
      elevation: 4,
    },
    row: {
      // Plain "row", so the country block sits at the leading edge in every
      // language exactly as Stitch places it.
      flexDirection: "row",
      alignItems: "stretch",
      minHeight: touchTarget.normal,
      backgroundColor: palette.surfaceSunken,
      borderRadius: radius.input,
      borderWidth: 1,
      // Stitch `border-outline` - the STRONG outline, not the divider tint.
      borderColor: palette.borderStrong,
      overflow: "hidden",
    },
    rowFocused: { borderColor: palette.primary },
    country: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      backgroundColor: palette.surface,
      /**
       * Stitch `border-l border-outline-variant/50`. In an RTL document the
       * block's left edge is its TRAILING edge, so this is borderEnd - a logical
       * property, which keeps the divider between block and field in every
       * direction instead of jumping to the outside in French.
       */
      borderEndWidth: 1,
      borderEndColor: withAlpha(palette.border, 0.5),
    },
    flag: { fontSize: 24 },
    dial: {
      ...stitchType.titleMd,
      color: palette.textPrimary,
      writingDirection: "ltr",
    },
    input: {
      flex: 1,
      ...stitchType.titleMd,
      color: palette.textPrimary,
      paddingHorizontal: spacing.lg,
      paddingVertical: 0,
      // Pinned: the leading edge of an LTR run, not of the layout.
      textAlign: "left",
      writingDirection: "ltr",
      backgroundColor: "transparent",
    },
  });
