import React, { useEffect, useRef } from "react";
import { ActivityIndicator, Animated, Easing, StyleSheet, Text, View } from "react-native";

import { useTranslation } from "../i18n";
import { alpha, COLORS, MOTION, RADIUS, SPACING, typo } from "../theme/tokens";

/** Stitch draws the halo at `w-32 h-32` blurred out to roughly this radius. */
const GLOW_SIZE = 320;

/** `animate-pulse-glow` in the reference: opacity 0.3 -> 0.55 and back. */
const GLOW_MIN = 0.08;
const GLOW_MAX = 0.2;

/**
 * Stitch `splash_screen`, on `src/theme/tokens.ts`.
 *
 * The reference is a centred column: a pink halo behind the mark, the
 * "flamin" + "Go" wordmark at headline-xl with the second half in
 * primary-container, and a wide-tracked caption beneath it.
 *
 * Deliberately cheap: no images, no network, no custom font required to render.
 * It has to be able to appear on the first frame while the keystore is read.
 *
 * NOT REPRODUCED: the abstract flamingo SVG mark. There is no vector asset in
 * the repo for it, and hand-tracing the reference path into JSX would be a new
 * logo rather than the brand's. The halo plus wordmark is the same composition
 * minus that glyph, and it is recorded as a visual delta.
 */
export function BootScreen() {
  const { t } = useTranslation();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: MOTION.pulse,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: MOTION.pulse,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const glowStyle = {
    opacity: pulse.interpolate({
      inputRange: [0, 1],
      outputRange: [GLOW_MIN, GLOW_MAX],
    }),
  };

  return (
    <View style={styles.root}>
      {/*
        The ambient glow, not a decoration: the reference puts a blurred pink
        halo behind the mark. Drawn as a large translucent circle because React
        Native has no box-shadow blur on Android.
      */}
      <Animated.View
        style={[styles.glow, glowStyle]}
        pointerEvents="none"
      />

      <Text style={styles.wordmark}>
        flamin<Text style={styles.wordmarkAccent}>Go</Text>
      </Text>

      {/* Stitch: uppercase, wide tracking, tertiary, slightly dimmed. */}
      <Text style={styles.tagline}>{t("splash.tagline")}</Text>

      <ActivityIndicator color={COLORS.primary} style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },
  glow: {
    position: "absolute",
    width: GLOW_SIZE,
    height: GLOW_SIZE,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryContainer,
  },
  wordmark: { ...typo("headlineXl"), color: COLORS.onSurface },
  wordmarkAccent: { color: COLORS.primaryContainer },
  tagline: {
    ...typo("labelMd"),
    color: COLORS.tertiary,
    letterSpacing: 2,
    textTransform: "uppercase",
    opacity: 0.8,
    marginTop: SPACING.sm,
    textAlign: "center",
  },
  spinner: { marginTop: SPACING.xxl },
});
