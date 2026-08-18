import React, { useMemo } from "react";
import {
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import {
  layout,
  radius,
  shadows,
  spacing,
  usePalette,
  type Palette,
} from "../theme";

/**
 * The docked sheet the map screens live in.
 *
 * 24px top corners, the 12px side margin from the Stitch metrics, and 32px of
 * bottom padding so the primary action never sits under the gesture bar.
 *
 * This is the presentation shell only - it does not drag. A draggable sheet
 * needs gesture-handler + reanimated wiring per screen, and the offer sheet in
 * particular must NOT be dismissible by accident, so movement is opted into by
 * the screen that wants it rather than granted to all of them here.
 */
export function BottomSheet({
  children,
  handle = true,
  floating = false,
  style,
}: {
  children: React.ReactNode;
  handle?: boolean;
  /** Detach from the bottom edge with the 12px reference margin. */
  floating?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const palette = usePalette();
  const styles = useMemo(() => makeStyles(palette), [palette]);

  return (
    <View style={[styles.sheet, floating ? styles.floating : null, style]}>
      {handle ? <View style={styles.handle} /> : null}
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    sheet: {
      backgroundColor: palette.surface,
      borderTopLeftRadius: radius.sheet,
      borderTopRightRadius: radius.sheet,
      paddingTop: spacing.md,
      paddingHorizontal: layout.containerPadding,
      paddingBottom: spacing["3xl"],
      ...shadows.sheet,
    },
    floating: {
      marginHorizontal: layout.sheetMargin,
      marginBottom: layout.sheetMargin,
      borderRadius: radius.sheet,
    },
    handle: {
      alignSelf: "center",
      width: 40,
      height: 4,
      borderRadius: radius.pill,
      backgroundColor: palette.borderStrong,
      marginBottom: spacing.md,
    },
    body: { gap: spacing.md },
  });
