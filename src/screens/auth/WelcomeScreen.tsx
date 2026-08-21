import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { BrandMark } from "../../components/BrandMark";
import { Icon } from "../../components/Icon";
import { PrimaryButton } from "../../components/PrimaryButton";
import { useTranslation } from "../../i18n";
import {
  layout,
  radius,
  shadows,
  spacing,
  stitchType,
  touchTarget,
  usePalette,
  withAlpha,
  type Palette,
} from "../../theme";
import type { AuthStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "Welcome">;

/** Stitch draws the icon plate at `w-16 h-16` and its glyph at `text-4xl`. */
const ICON_PLATE = 64;
const ICON_GLYPH = 36;

/** Tailwind `max-w-md` (28rem), which is what Stitch centres the card inside. */
const MAX_CARD_WIDTH = 448;

/**
 * Stitch's own entrance: opacity 0 -> 1, translateY 20 -> 0, 0.6s ease-out
 * after a 100ms delay. 600 is not in `motion` because that table tops out at
 * `slow: 300`; this is the reference value read off the screen, not a taste.
 */
const ENTRANCE_MS = 600;
const ENTRANCE_DELAY_MS = 100;
const ENTRANCE_TRAVEL = 20;

/**
 * PHASE 2 - Stitch `welcome_onboarding`. The first screen an unregistered
 * driver sees, and the initial route of AuthNavigator.
 *
 * There is no screenshot for this screen: it is one of the 15 designs that
 * exist only as HTML in the Stitch pack, so the computed markup IS the
 * reference. What it specifies, and what is built below: a glass card pinned to
 * the BOTTOM of the viewport (the body is `justify-end`, not centred), a 64px
 * pink-washed plate holding a filled car glyph, a 36px headline whose last word
 * takes the brand pink, and two stacked 56px pill buttons.
 *
 * THE BACKGROUND PHOTOGRAPH IS DELIBERATELY MISSING
 * Stitch fills the screen with a night-city photograph served from a
 * `lh3.googleusercontent.com` aida-public URL, and lays this gradient over it.
 * Section 43 puts every asset behind the storage abstraction and forbids
 * hardcoded external URLs, and that Google CDN link is an export artifact that
 * would rot. So the gradient ships and the photograph does not. When the real
 * asset exists in R2 it becomes one <Image> behind the same scrim, resolved
 * through `config.media`, with no other change to this file. This is recorded
 * as a visual QA delta - it is NOT done.
 *
 * WHY react-native Animated AND NOT REANIMATED
 * Reanimated is installed, but its worklets need the babel plugin and there is
 * no build in this environment to prove the plugin is wired. A two-property
 * entrance does not justify betting the first screen of the app on an
 * unverifiable build assumption. RN's Animated needs no plugin and drives both
 * opacity and transform on the native thread.
 *
 * TWO DOORS, NOT TWO ACCOUNTS
 * "Start registration" opens the SMS flow, because POST /auth/firebase is the
 * only account-creating path the backend has. "Sign in" opens the password
 * flow, which only resolves for a driver who has already set one. Both land on
 * LoginScreen with a `mode` param rather than on two divergent screens.
 */
export function WelcomeScreen({ navigation }: Props) {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(palette), [palette]);

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
    // Stopped on unmount: the driver can leave before 600ms have passed.
    return () => animation.stop();
  }, [entrance]);

  const entranceStyle = {
    opacity: entrance,
    transform: [
      {
        // translateY is not a directional property, so this is RTL-safe as is.
        translateY: entrance.interpolate({
          inputRange: [0, 1],
          outputRange: [ENTRANCE_TRAVEL, 0],
        }),
      },
    ],
  };

  return (
    <View style={styles.root}>
      {/*
        Stitch: `bg-gradient-to-t from-background via-background/80 to-transparent`.
        "to-t" means the gradient travels UPWARD, so the opaque stop is at the
        BOTTOM. The top stop is the background colour at zero alpha rather than
        the keyword "transparent" on purpose: a gradient interpolating toward
        #00000000 bands through grey on Android, and matching the hue keeps the
        ramp clean.
      */}
      <LinearGradient
        pointerEvents="none"
        colors={[
          withAlpha(palette.background, 0),
          withAlpha(palette.background, 0.8),
          palette.background,
        ]}
        locations={[0, 0.55, 1]}
        style={styles.scrim}
      />

      {/*
        Stitch pins the header: `h-touch-target`, translucent surface, brand at
        the leading edge. `palette.overlay` is the app's answer to
        `backdrop-blur-md` - its alpha is already raised because Android has no
        backdrop blur, so this is the one role that should paint blurred chrome.
      */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top,
            height: insets.top + touchTarget.stitchMin,
          },
        ]}
      >
        <BrandMark compact size={20} />
      </View>

      <View
        style={[
          styles.main,
          {
            // Stitch `pb-safe-bottom`, and its spec prose sets a 32px floor.
            paddingBottom: Math.max(insets.bottom, layout.safeAreaBottomMin),
          },
        ]}
      >
        <Animated.View style={[styles.card, entranceStyle]}>
          <View style={styles.iconPlate}>
            {/*
              Stitch uses `directions_car` with `FILL 1`. The `car` glyph in this
              icon set is the filled one, which is the match; section 48 forbids
              rendering the ligature name as text, so it goes through Icon.
            */}
            <Icon name="car" size={ICON_GLYPH} color={palette.primaryText} />
          </View>

          {/*
            Centred, so no `writingDirection` is pinned here or below. Centre
            never mirrors, and pinning a direction next to a centred alignment is
            the exact R-11 defect PHASE 1 removed from 24 components and 15
            screens. The brand word is Arabic script in Arabic, so it needs no
            LTR pin either.
          */}
          <Text style={styles.title}>
            {t("welcome.titleLead")}{" "}
            <Text style={styles.titleBrand}>{t("welcome.titleBrand")}</Text>
          </Text>

          <Text style={styles.subtitle}>{t("welcome.subtitle")}</Text>

          <View style={styles.actions}>
            <PrimaryButton
              label={t("welcome.start")}
              onPress={() => navigation.navigate("Login", { mode: "sms" })}
              size="compact"
              style={styles.glow}
            />
            <PrimaryButton
              label={t("welcome.signIn")}
              onPress={() => navigation.navigate("Login", { mode: "password" })}
              variant="secondary"
              size="compact"
            />
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: palette.background },
    scrim: { ...StyleSheet.absoluteFillObject },
    /**
     * `left`/`right` rather than `start`/`end`: a full-width bar is symmetric,
     * so the physical insets are direction-neutral and mirroring them would be
     * noise. The inner row is a plain "row", which React Native mirrors, so the
     * wordmark sits at the leading edge in every language.
     */
    header: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 2,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: layout.gutter,
      backgroundColor: palette.overlay,
      ...shadows.soft,
    },
    /** Stitch `justify-end`: the card sits at the bottom, never centred. */
    main: {
      flex: 1,
      justifyContent: "flex-end",
      paddingHorizontal: layout.containerPadding,
      paddingTop: touchTarget.stitchMin + spacing.lg,
    },
    card: {
      width: "100%",
      maxWidth: MAX_CARD_WIDTH,
      alignSelf: "center",
      alignItems: "center",
      borderRadius: radius.card,
      padding: spacing["2xl"],
      backgroundColor: palette.overlay,
      borderWidth: 1,
      // Stitch `border-outline-variant/30`. `border` IS the outlineVariant role.
      borderColor: withAlpha(palette.border, 0.3),
      // Stitch `shadow-[0_-4px_24px_...]` - the shadow points UP, like a sheet.
      ...shadows.sheet,
    },
    /**
     * Stitch `bg-primary-container/20`. `palette.primary` IS primaryContainer
     * (#FF4D8D) in both themes, so this is the reference value exactly rather
     * than `primaryWash`, which is the 0.16/0.10 wash used for selected rows.
     */
    iconPlate: {
      width: ICON_PLATE,
      height: ICON_PLATE,
      borderRadius: radius.pill,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: withAlpha(palette.primary, 0.2),
      marginBottom: spacing["2xl"],
    },
    title: {
      ...stitchType.headlineXl,
      color: palette.textPrimary,
      textAlign: "center",
      marginBottom: spacing.md,
    },
    /**
     * Brand LETTERING, so `primaryText` and not the filled `primary`:
     * palettes.ts records that #FF4D8D on white fails contrast at text sizes,
     * which is why pink type darkens in light mode while pink fills do not.
     */
    titleBrand: { color: palette.primaryText },
    subtitle: {
      ...stitchType.bodyLg,
      color: palette.textSecondary,
      textAlign: "center",
      paddingHorizontal: spacing.sm,
      marginBottom: spacing["3xl"],
    },
    actions: { width: "100%", gap: spacing.lg },
    /**
     * Stitch `button-glow`, on the primary call to action and nowhere else.
     * `palette.glow` is STITCH_GLOW - theme/index.ts deliberately keeps it out
     * of the shadow table for exactly this reason. The alpha lives in the
     * colour, hence shadowOpacity 1.
     *
     * HONEST LIMITATION: Android draws elevation shadows black below API 28, so
     * the pink reads on iOS and degrades to a neutral lift on older Android.
     * Faking it costs an extra stacked layer on the first screen of the app.
     */
    glow: {
      shadowColor: palette.glow,
      shadowOpacity: 1,
      shadowRadius: 15,
      shadowOffset: { width: 0, height: 0 },
      elevation: 8,
    },
  });
