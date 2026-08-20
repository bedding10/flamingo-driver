import React, { useMemo } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { BrandMark } from "../components/BrandMark";
import { useTranslation } from "../i18n";
import {
  radius,
  spacing,
  stitchType,
  usePalette,
  withAlpha,
  type Palette,
} from "../theme";

/**
 * The splash, shown while the keystore is read.
 *
 * PHASE 1 - REBUILT. What was here before:
 *
 *   - the wordmark and the spinner were both `colors.gold`. Gold is not a
 *     flaminGO brand colour (section 7), and this was the very first screen a
 *     driver ever sees, so the app opened by contradicting its own identity.
 *   - the background was the hardcoded `colors.ink`, so the splash ignored the
 *     theme and flashed dark before a light-mode app finished booting.
 *   - the wordmark was plain text at the legacy `typography.display`, not the
 *     real BrandMark, so the logo here did not match the logo everywhere else.
 *
 * It now uses the palette, the Stitch type scale and the actual BrandMark, in
 * the brand pink, with the ambient pink glow the Stitch reference puts behind
 * the mark.
 *
 * HONEST LIMIT: this is the splash rebuilt on the new foundation. It is NOT a
 * verified pixel match against the Stitch reference screen (screen_29) - that
 * comparison is a Visual QA item, and Visual QA needs a running build, which
 * the environment this was written in cannot produce.
 *
 * Still deliberately cheap: no images, no network, no custom font required to
 * render. It has to be able to appear on the first frame.
 */
export function BootScreen() {
  const palette = usePalette();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(palette), [palette]);

  return (
    <View style={styles.root}>
      {/*
        The ambient glow, not a decoration: Stitch puts a soft pink halo behind
        the mark on the dark splash. Drawn as a large translucent circle because
        React Native has no box-shadow blur on Android.
      */}
      <View style={styles.glow} pointerEvents="none" />

      <BrandMark size={34} compact />

      <Text style={styles.tagline}>{t("splash.tagline")}</Text>

      <ActivityIndicator color={palette.primaryText} style={styles.spinner} />
    </View>
  );
}

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    root: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: palette.background,
    },
    glow: {
      position: "absolute",
      width: 320,
      height: 320,
      borderRadius: radius.pill,
      backgroundColor: withAlpha(palette.primary, 0.12),
    },
    tagline: {
      ...stitchType.labelMd,
      color: palette.textSecondary,
      marginTop: spacing.md,
      textAlign: "center",
    },
    spinner: { marginTop: spacing["3xl"] },
  });
