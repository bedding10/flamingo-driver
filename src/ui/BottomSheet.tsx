import { BlurView } from "expo-blur";
import React, { useEffect } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  alpha,
  BLUR,
  COLORS,
  MOTION,
  RADIUS,
  SHADOW_SHEET,
  SPACING,
  typo,
} from "../theme/tokens";

/**
 * Component 2 - Bottom sheet.
 * 24px top radius, drag handle, full backdrop blur behind it, slide-up
 * animation, and the subtle radial pink glow behind the headline
 * (`bg-primary-container/10 rounded-full blur-xl animate-pulse`).
 */
export type BottomSheetProps = {
  visible: boolean;
  onClose?: () => void;
  title?: string;
  subtitle?: string;
  /** Tapping the blurred backdrop closes the sheet. Off for ride offers. */
  dismissOnBackdropPress?: boolean;
  showHandle?: boolean;
  children?: React.ReactNode;
};

export function BottomSheet({
  visible,
  onClose,
  title,
  subtitle,
  dismissOnBackdropPress = true,
  showHandle = true,
  children,
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();
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
        intensity={BLUR.overlay}
        tint={BLUR.tint}
        style={styles.backdrop}
      >
        <Pressable
          style={styles.backdropPress}
          onPress={dismissOnBackdropPress ? onClose : undefined}
          accessibilityRole="button"
          accessibilityLabel="Close"
        />

        <Animated.View
          style={[
            styles.sheet,
            SHADOW_SHEET,
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

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: alpha(COLORS.surface, 0.85),
  },
  backdropPress: { ...StyleSheet.absoluteFillObject },
  sheet: {
    marginHorizontal: SPACING.bottomSheetMargin,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.card,
    borderTopRightRadius: RADIUS.card,
    borderBottomLeftRadius: RADIUS.card,
    borderBottomRightRadius: RADIUS.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.surfaceVariant,
    overflow: "hidden",
  },
  handleWrap: { alignItems: "center", paddingTop: SPACING.lg, paddingBottom: SPACING.sm },
  handle: {
    width: 48,
    height: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceVariant,
  },
  body: { padding: SPACING.container, gap: SPACING.xl },
  headline: { alignItems: "center", position: "relative" },
  glow: {
    position: "absolute",
    top: -24,
    height: 96,
    width: "120%",
    borderRadius: RADIUS.full,
    backgroundColor: alpha(COLORS.primaryContainer, 0.1),
  },
  title: { ...typo("headlineLgMobile"), color: COLORS.primary, textAlign: "center" },
  subtitle: {
    ...typo("bodyMd"),
    color: COLORS.onSurfaceVariant,
    marginTop: SPACING.xs,
    textAlign: "center",
  },
});
