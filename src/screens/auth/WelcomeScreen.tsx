import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTranslation } from "../../i18n";
import {
  alpha,
  BLUR,
  COLORS,
  RADIUS,
  SHADOW_SHEET,
  SPACING,
  typo,
} from "../../theme/tokens";
import { PillButton, StickyHeader } from "../../ui";
import type { AuthStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "Welcome">;

/** Stitch draws the icon plate at `w-16 h-16` and its glyph at `text-4xl`. */
const ICON_PLATE = 64;
const ICON_GLYPH = 36;

/** Tailwind `max-w-md` (28rem), which is what Stitch centres the card inside. */
const MAX_CARD_WIDTH = 448;

/** Stitch's entrance: opacity 0 -> 1, translateY 20 -> 0, 0.6s after 100ms. */
const ENTRANCE_MS = 600;
const ENTRANCE_DELAY_MS = 100;
const ENTRANCE_TRAVEL = 20;

const SAFE_BOTTOM_MIN = 32;

/**
 * Stitch `welcome_onboarding`, migrated onto `src/theme/tokens.ts` and the
 * shared UI kit. No colour, radius, spacing or type literal lives in this file.
 *
 * Reference geometry, reproduced: body is `justify-end` so the glass card is
 * pinned to the BOTTOM, a 64px pink-washed plate holds a filled car glyph, the
 * headline is headline-xl with the brand word in primary, and the two actions
 * are stacked pills.
 *
 * The blurred card is a real `BlurView` now (`glass-overlay` in the reference)
 * instead of a raised-alpha fill, which is what the Expo notes ask for.
 *
 * STILL MISSING ON PURPOSE: the night-city photograph behind the scrim. It is
 * served from an `lh3.googleusercontent.com` export URL in the reference; a
 * hardcoded external CDN link would rot. When the asset lands in R2 it becomes
 * one <Image> behind this same gradient.
 */
export function WelcomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(entrance, {
      toValue: 1,
      duration: ENTRANCE_MS,
      delay: ENTRANCE_DELAY_MS,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [entrance]);

  const entranceStyle = {
    opacity: entrance,
    transform: [
      {
        translateY: entrance.interpolate({
          inputRange: [0, 1],
          outputRange: [ENTRANCE_TRAVEL, 0],
        }),
      },
    ],
  };

  return (
    <View style={styles.root}>
      {/* `bg-gradient-to-t from-background via-background/80 to-transparent`:
          the gradient travels UPWARD, so the opaque stop is at the bottom. */}
      <LinearGradient
        pointerEvents="none"
        colors={[
          alpha(COLORS.background, 0),
          alpha(COLORS.background, 0.8),
          COLORS.background,
        ]}
        locations={[0, 0.55, 1]}
        style={styles.scrim}
      />

      <StickyHeader />

      <View
        style={[
          styles.main,
          { paddingBottom: Math.max(insets.bottom, SAFE_BOTTOM_MIN) },
        ]}
      >
        <Animated.View style={[styles.cardWrap, SHADOW_SHEET, entranceStyle]}>
          <BlurView
            intensity={BLUR.overlay}
            tint={BLUR.tint}
            style={styles.card}
          >
            <View style={styles.iconPlate}>
              <MaterialIcons
                name="directions-car"
                size={ICON_GLYPH}
                color={COLORS.primary}
              />
            </View>

            <Text style={styles.title}>
              {t("welcome.titleLead")}{" "}
              <Text style={styles.titleBrand}>{t("welcome.titleBrand")}</Text>
            </Text>

            <Text style={styles.subtitle}>{t("welcome.subtitle")}</Text>

            <View style={styles.actions}>
              <PillButton
                label={t("welcome.start")}
                onPress={() => navigation.navigate("Login", { mode: "sms" })}
              />
              <PillButton
                label={t("welcome.signIn")}
                variant="secondary"
                onPress={() =>
                  navigation.navigate("Login", { mode: "password" })
                }
              />
            </View>
          </BlurView>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  scrim: { ...StyleSheet.absoluteFillObject },
  /** Stitch `justify-end`: the card sits at the bottom, never centred. */
  main: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: SPACING.container,
    paddingTop: SPACING.xxl,
  },
  cardWrap: {
    width: "100%",
    maxWidth: MAX_CARD_WIDTH,
    alignSelf: "center",
    borderRadius: RADIUS.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: alpha(COLORS.outlineVariant, 0.3),
    overflow: "hidden",
  },
  card: {
    alignItems: "center",
    padding: SPACING.xl,
    backgroundColor: alpha(COLORS.surfaceContainer, 0.6),
  },
  /** Stitch `bg-primary-container/20`. */
  iconPlate: {
    width: ICON_PLATE,
    height: ICON_PLATE,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: alpha(COLORS.primaryContainer, 0.2),
    marginBottom: SPACING.xl,
  },
  title: {
    ...typo("headlineXl"),
    color: COLORS.onSurface,
    textAlign: "center",
    marginBottom: SPACING.md,
  },
  titleBrand: { color: COLORS.primary },
  subtitle: {
    ...typo("bodyLg"),
    color: COLORS.onSurfaceVariant,
    textAlign: "center",
    paddingHorizontal: SPACING.sm,
    marginBottom: SPACING.xxl,
  },
  actions: { width: "100%", gap: SPACING.lg },
});
