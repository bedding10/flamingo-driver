import React, { useMemo } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useTranslation } from "../../i18n";
import { radius, spacing, usePalette, type Palette } from "../../theme";

/** Stitch: `h-1` bar on the phone screen, `h-1.5 w-8` dashes on the OTP one. */
const BAR_HEIGHT = 4;
const DASH_HEIGHT = 6;
const DASH_WIDTH = 32;

/** Phone -> code -> password/profile. Stitch draws three segments on both. */
const TOTAL_STEPS = 3;

type Props = {
  /** 1-based, so it reads the same way the accessible label does. */
  step: number;
  total?: number;
  /**
   * Stitch genuinely draws this indicator TWO ways: `phone_number_entry` pins a
   * full-width hairline bar to the top edge of the card, `otp_verification`
   * centres three rounded dashes above the heading. Both are reproduced rather
   * than unified into one treatment - unifying them would be a redesign, and
   * the reference is the reference.
   */
  variant?: "bar" | "dashes";
  style?: StyleProp<ViewStyle>;
};

/**
 * PHASE 2 - the three-step indicator on the Stitch auth screens.
 *
 * The ACTIVE segment is the current step only, not a cumulative fill: Stitch
 * lights segment 1 on the phone screen and the MIDDLE segment on the OTP screen,
 * leaving the others neutral. It is a position indicator, not a gauge.
 *
 * A bar of coloured rectangles carries no information to a screen reader, so the
 * same fact is exposed as a progressbar role with a translated label.
 */
export function AuthProgress({
  step,
  total = TOTAL_STEPS,
  variant = "bar",
  style,
}: Props) {
  const palette = usePalette();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(palette), [palette]);

  return (
    <View
      style={[variant === "bar" ? styles.bar : styles.dashes, style]}
      accessibilityRole="progressbar"
      accessibilityLabel={t("login.stepOf", { current: step, total })}
      accessibilityValue={{ min: 1, max: total, now: step }}
    >
      {Array.from({ length: total }, (_unused, index) => (
        <View
          key={index}
          style={[
            variant === "bar" ? styles.segment : styles.dash,
            index === step - 1 ? styles.on : styles.off,
          ]}
        />
      ))}
    </View>
  );
}

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    /**
     * Stitch `absolute top-0 left-0 right-0`. The physical insets are symmetric,
     * so they are direction-neutral and deliberately not converted to
     * start/end. NOTE: the card that holds this must clip its content, or these
     * square ends will cross its corner radius.
     */
    bar: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: BAR_HEIGHT,
      // Plain "row": React Native mirrors it, so step 1 sits at the leading edge.
      flexDirection: "row",
      gap: spacing.sm,
    },
    segment: { flex: 1, height: BAR_HEIGHT },
    dashes: {
      flexDirection: "row",
      justifyContent: "center",
      gap: spacing.sm,
    },
    dash: {
      height: DASH_HEIGHT,
      width: DASH_WIDTH,
      borderRadius: radius.pill,
    },
    /** A filled brand surface, so `primary` rather than the text-safe variant. */
    on: { backgroundColor: palette.primary },
    off: { backgroundColor: palette.surfaceVariant },
  });
