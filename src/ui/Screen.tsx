import React, { useMemo } from "react";
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { layout, spacing, usePalette, type Palette } from "../theme";

/**
 * The page frame.
 *
 * Handles the three things every screen in the pack needs and no screen should
 * re-implement: the themed background, the status-bar inset (core SafeAreaView
 * only insets on iOS, so Android gets the measured bar height), and the
 * container padding of 20 from the Stitch config.
 *
 * `react-native-safe-area-context` is deliberately not used here - it is not a
 * direct dependency of this app, and the frame must not be the reason a build
 * fails to resolve a module.
 */
export function Screen({
  children,
  scroll = false,
  padded = true,
  edgeTop = true,
  bottomInset = false,
  refreshControl,
  contentStyle,
  style,
}: {
  children: React.ReactNode;
  /** Wrap the content in a ScrollView. Never do this on the map screen. */
  scroll?: boolean;
  padded?: boolean;
  /** Set false when a navigation header already covers the status bar. */
  edgeTop?: boolean;
  /** Adds the 32 bottom-sheet safe padding the pack uses above the nav bar. */
  bottomInset?: boolean;
  refreshControl?: React.ComponentProps<typeof ScrollView>["refreshControl"];
  contentStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
}) {
  const palette = usePalette();
  const styles = useMemo(() => makeStyles(palette), [palette]);

  const androidTop =
    edgeTop && Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0;

  const inner: StyleProp<ViewStyle> = [
    padded ? styles.padded : null,
    bottomInset ? styles.bottomInset : null,
    contentStyle,
  ];

  return (
    <SafeAreaView style={[styles.root, { paddingTop: androidTop }, style]}>
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={inner}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, inner]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: palette.background },
    flex: { flex: 1 },
    padded: {
      paddingHorizontal: layout.containerPadding,
      paddingVertical: spacing.lg,
      gap: spacing.lg,
    },
    bottomInset: { paddingBottom: spacing["3xl"] },
  });
