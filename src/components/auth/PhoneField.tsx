import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";

import { alpha, COLORS, RADIUS, SPACING, typo } from "../../theme/tokens";

/**
 * flaminGO operates in Algeria only, so the dial code is a constant rather than
 * a picker. If the product crosses a border, THIS is the one place that has to
 * grow a country selector.
 */
const DIAL_CODE = "+213";
const FLAG = "\ud83c\udde9\ud83c\uddff";

/** Stitch `min-h-[56px]` on the field row. */
const FIELD_HEIGHT = 56;

/** Stitch `focus-within:shadow-[0_0_8px_rgba(255,77,141,0.2)]`. */
const GLOW_ALPHA = 0.2;
const GLOW_RADIUS = 8;

type Props = Omit<TextInputProps, "style"> & {
  containerStyle?: StyleProp<ViewStyle>;
};

/**
 * Stitch `phone_number_entry`: a fixed +213 block welded to the leading edge of
 * an LTR national-number field, inside one bordered box. Tokens only.
 *
 * THE FIELD IS DARKER THAN THE BLOCK BESIDE IT, ON PURPOSE
 * Stitch pairs `bg-surface` on the field with `bg-surface-container` on the
 * block, which makes the field the darker of the two.
 *
 * THE NUMBER STAYS LTR
 * A phone number reads left-to-right in Arabic, French and English alike, so
 * both the dial code and the input are pinned.
 */
export function PhoneField({ containerStyle, editable, ...rest }: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.glowWrap, focused && styles.glowOn, containerStyle]}>
      <View style={[styles.row, focused && styles.rowFocused]}>
        <View style={styles.country}>
          {/*
            No lineHeight on the flag: `leading-none` on a 24px emoji clips the
            glyph on some Android builds.
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
          autoComplete="tel"
          placeholderTextColor={alpha(COLORS.onSurfaceVariant, 0.5)}
          selectionColor={COLORS.primaryContainer}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /**
   * The glow lives on an OUTER view so the inner row can clip its children to
   * the corner radius without also clipping the shadow.
   */
  glowWrap: { width: "100%", borderRadius: RADIUS.lg },
  /**
   * Decoration only. The real focus signal is the border below, because Android
   * cannot tint elevation shadows.
   */
  glowOn: {
    shadowColor: alpha(COLORS.primaryContainer, GLOW_ALPHA),
    shadowOpacity: 1,
    shadowRadius: GLOW_RADIUS,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  row: {
    // Plain "row": the country block sits at the leading edge in every language.
    flexDirection: "row",
    alignItems: "stretch",
    minHeight: FIELD_HEIGHT,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    // Stitch `border-outline` - the STRONG outline, not the divider tint.
    borderColor: COLORS.outline,
    overflow: "hidden",
  },
  rowFocused: { borderColor: COLORS.primaryContainer },
  country: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.surfaceContainer,
    /**
     * Stitch `border-l border-outline-variant/50`. In an RTL document the
     * block's left edge is its TRAILING edge, so this is borderEnd.
     */
    borderEndWidth: 1,
    borderEndColor: alpha(COLORS.outlineVariant, 0.5),
  },
  flag: { fontSize: 24 },
  dial: {
    ...typo("titleMd"),
    color: COLORS.onSurface,
    writingDirection: "ltr",
  },
  input: {
    flex: 1,
    ...typo("titleMd"),
    color: COLORS.onSurface,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 0,
    // Pinned: the leading edge of an LTR run, not of the layout.
    textAlign: "left",
    writingDirection: "ltr",
    backgroundColor: "transparent",
  },
});
