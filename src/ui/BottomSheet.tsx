import { BlurView } from "expo-blur";
import React, { useEffect, useMemo } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { alpha, MOTION, RADIUS, SPACING, typo } from "../theme/tokens";
import { useTokens, type Tokens } from "../theme/useTokens";

/**
 * Component 2 - Bottom sheet.
 * 24px radius, drag handle, full backdrop blur behind it, slide-up animation,
 * and the subtle radial pink glow behind the headline
 * (`bg-primary-container/10 rounded-full blur-xl animate-pulse`).
 *
 * THEME: the backdrop wash and the blur tint MUST follow the mode. A dark
 * tint plus an 85% dark wash under a light sheet blacked out the screen.
 */
export type BottomSheetProps = {
  visible: boolean;
  onClose?: () => void;
  title?: string;
  subtitle?: string;
  /** Tapping the blurred backdrop closes the sheet. Off for ride offers. */
  dismissOnBackdropPress?: boolean;
  showHandle?: boolean;
  /** Screen-reader label for the backdrop. Arabic default. */
  closeLabel?: string;
  children?: React.ReactNode;
};

export function BottomSheet({
  visible,
  onClose,
  title,
  subtitle,
  dismissOnBackdropPress = true,
  showHandle = true,
  closeLabel = "إغلاق",
  children,
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const t = useTokens();
  const styles = useMemo(() => makeStyles(t), [t]);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(visible ? 1 : 0, { duration: MOTION.sheet });
  }, [visible, progress]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * 480 }],
    opacity: progress.value,
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <BlurView
        intensity={t.blur.overlay}
        tint={t.blur.tint}
        style={styles.backdrop}
      >
        <Pressable
          style={styles.backdropPress}
          onPress={dismissOnBackdropPress ? onClose : undefined}
          accessibilityRole="button"
          accessibilityLabel={closeLabel}
        />

        <Animated.View
          style={[
            styles.sheet,
            t.shadowSheet,
            { marginBottom: Math.max(insets.bottom, SPACING.bottomSheetMargin) },
            sheetStyle,
          ]}
        >
          {showHandle ? (
            <View style={styles.handleWrap}>
              <View style={styles.handle} />
            </View>
          ) : null}

          <View style={styles.body}>
            {title ? (
              <View style={styles.headline}>
                <View style={styles.glow} />
                <Text style={styles.title}>{title}</Text>
                {subtitle ? (
                  <Text style={styles.subtitle}>{subtitle}</Text>
                ) : null}
              </View>
            ) : null}
            {children}
          </View>
        </Animated.View>
      </BlurView>
    </Modal>
  );
}

function makeStyles(t: Tokens) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: "flex-end",
      // Dark: dim the map. Light: a much lighter veil, or the sheet loses its
      // edge against a near-white backdrop.
      backgroundColor: alpha(
        t.mode === "light" ? t.colors.inverseSurface : t.colors.surface,
        t.mode === "light" ? 0.35 : 0.85,
      ),
    },
    backdropPress: { ...StyleSheet.absoluteFillObject },
    sheet: {
      marginHorizontal: SPACING.bottomSheetMargin,
      backgroundColor: t.colors.surface,
      borderRadius: RADIUS.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.colors.surfaceVariant,
      overflow: "hidden",
    },
    handleWrap: {
      alignItems: "center",
      paddingTop: SPACING.lg,
      paddingBottom: SPACING.sm,
    },
    handle: {
      width: 48,
      height: 6,
      borderRadius: RADIUS.full,
      backgroundColor: t.colors.surfaceVariant,
    },
    body: { padding: SPACING.container, gap: SPACING.xl },
    headline: { alignItems: "center", position: "relative" },
    glow: {
      position: "absolute",
      top: -24,
      height: 96,
      width: "120%",
      borderRadius: RADIUS.full,
      backgroundColor: alpha(t.colors.primaryContainer, 0.1),
    },
    title: {
      ...typo("headlineLgMobile"),
      color: t.colors.primary,
      textAlign: "center",
    },
    subtitle: {
      ...typo("bodyMd"),
      color: t.colors.onSurfaceVariant,
      marginTop: SPACING.xs,
      textAlign: "center",
    },
  });
}
