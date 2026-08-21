import React, { useEffect, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useTranslation } from "../i18n";
import { MOTION, RADIUS, SPACING, typo } from "../theme/tokens";
import { useTokens, type Tokens } from "../theme/useTokens";

/** Stitch draws the halo at `w-32 h-32` blurred out to roughly this radius. */
const GLOW_SIZE = 320;

/**
 * `animate-pulse-glow` in the reference: opacity 0.3 -> 0.55 and back.
 *
 * Split per scheme on purpose. A translucent pink circle over #101415 reads as
 * light coming off the mark; the same circle over #fff8f8 reads as a printed
 * smudge, because there is nothing darker for it to glow against. Light mode
 * therefore pulses a narrower, fainter band.
 */
const GLOW_RANGE = {
  dark: { min: 0.08, max: 0.2 },
  light: { min: 0.05, max: 0.12 },
} as const;

/**
 * Stitch `splash_screen`, on `src/theme/tokens.ts`.
 *
 * The reference is a centred column: a pink halo behind the mark, the
 * "flamin" + "Go" wordmark at headline-xl with the second half in
 * primary-container, and a wide-tracked caption beneath it.
 *
 * Deliberately cheap: no images, no network, no custom font required to render.
 * It has to be able to appear on the first frame while the keystore is read.
 * useTokens() is safe here even if this ever mounts above ThemeProvider - the
 * theme context carries a dark default rather than throwing.
 *
 * NOT REPRODUCED: the abstract flamingo SVG mark. There is no vector asset in
 * the repo for it, and hand-tracing the reference path into JSX would be a new
 * logo rather than the brand's. The halo plus wordmark is the same composition
 * minus that glyph, and it is recorded as a visual delta.
 */
export function BootScreen() {
  const { t } = useTranslation();
  const tokens = useTokens();
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
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

  const range = GLOW_RANGE[tokens.mode];
  const glowStyle = {
    opacity: pulse.interpolate({
      inputRange: [0, 1],
      outputRange: [range.min, range.max],
    }),
  };

  return (
    <View style={styles.root}>
      {/*
        The ambient glow, not a decoration: the reference puts a blurred pink
        halo behind the mark. Drawn as a large translucent circle because React
        Native has no box-shadow blur on Android.
      */}
      <Animated.View style={[styles.glow, glowStyle]} pointerEvents="none" />

      <Text style={styles.wordmark}>
        flamin<Text style={styles.wordmarkAccent}>Go</Text>
      </Text>

      {/* Stitch: uppercase, wide tracking, tertiary, slightly dimmed. */}
      <Text style={styles.tagline}>{t("splash.tagline")}</Text>

      <ActivityIndicator
        color={tokens.colors.primary}
        style={styles.spinner}
      />
    </View>
  );
}

function makeStyles(t: Tokens) {
  return StyleSheet.create({
    root: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: t.colors.background,
    },
    glow: {
      position: "absolute",
      width: GLOW_SIZE,
      height: GLOW_SIZE,
      borderRadius: RADIUS.full,
      backgroundColor:
        t.mode === "light" ? t.colors.primary : t.colors.primaryContainer,
    },
    wordmark: { ...typo("headlineXl"), color: t.colors.onSurface },
    /* Brand constant: the "Go" half stays hot pink in both schemes. */
    wordmarkAccent: { color: t.colors.primaryContainer },
    tagline: {
      ...typo("labelMd"),
      color: t.colors.tertiary,
      letterSpacing: 2,
      textTransform: "uppercase",
      opacity: 0.8,
      marginTop: SPACING.sm,
      textAlign: "center",
    },
    spinner: { marginTop: SPACING.xxl },
  });
}
