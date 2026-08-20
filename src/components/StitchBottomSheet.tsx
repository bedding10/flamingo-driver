import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  BackHandler,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  motion,
  radius,
  shadows,
  spacing,
  stitchType,
  usePalette,
  type Palette,
} from "../theme";
import { textAlignStart } from "../i18n";

/**
 * PHASE 1 - the bottom sheet (section 47: StitchBottomSheet).
 *
 * WHY THIS EXISTS
 * Stitch's design spec is explicit: sheets have 24px top corners and a grab
 * handle, and they are NOT full-screen. Nothing in the tree could produce that,
 * so every sheet-shaped surface would have been built as a full-screen modal -
 * the exact thing the reference rules out. It is also what the approved
 * negotiation waiting state needs later, which must be a small floating card
 * over the map rather than a screen takeover.
 *
 * BEHAVIOUR
 * - The scrim is a real dismiss target, and Android's hardware back closes it.
 *   A driver must always be able to get out of a sheet without hunting for an X.
 * - `dismissible: false` for a sheet that is waiting on the server, so the
 *   driver cannot dismiss a pending negotiation and think it was cancelled.
 * - The panel is height-driven by its content and capped, never stretched: a
 *   two-line sheet must not become a full screen of empty surface.
 * - Bottom padding honours Stitch's 32px safe-area minimum, so the last button
 *   is never against the gesture bar.
 *
 * The slide-in uses the native driver and is torn down with the modal, so no
 * animation outlives the sheet.
 */

/**
 * Stitch requires at least 32px of clear space below sheet content. Kept as a
 * named constant here rather than reaching for a metrics import, so this file
 * depends only on tokens already proven present in the tree.
 */
const SHEET_BOTTOM_MIN = 32;

/** Stitch never lets a sheet own the whole screen. */
const MAX_HEIGHT_RATIO = "86%";

export function StitchBottomSheet({
  visible,
  onClose,
  title,
  children,
  dismissible = true,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string | null;
  children: React.ReactNode;
  /** False while the sheet is waiting on the server. */
  dismissible?: boolean;
}) {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(palette), [palette]);

  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(slide, {
      toValue: visible ? 1 : 0,
      duration: visible ? motion.base : motion.fast,
      useNativeDriver: true,
    }).start();
  }, [visible, slide]);

  // Android hardware back closes the sheet instead of leaving the screen.
  useEffect(() => {
    if (!visible || !dismissible) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, dismissible, onClose]);

  const translateY = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [320, 0],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={dismissible ? onClose : undefined}
    >
      <View style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={title ?? undefined}
          disabled={!dismissible}
          onPress={dismissible ? onClose : undefined}
          style={styles.scrim}
        />

        <Animated.View
          style={[
            styles.panel,
            {
              paddingBottom: Math.max(insets.bottom, SHEET_BOTTOM_MIN),
              transform: [{ translateY }],
              opacity: slide,
            },
          ]}
        >
          {/* The grab handle. Stitch draws one on every sheet. */}
          <View style={styles.handle} />

          {title ? <Text style={styles.title}>{title}</Text> : null}

          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    root: { flex: 1, justifyContent: "flex-end" },
    scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: palette.scrim },
    panel: {
      maxHeight: MAX_HEIGHT_RATIO,
      backgroundColor: palette.surface,
      // Stitch: 24px on the TOP corners only - the sheet is anchored, not
      // floating, so the bottom corners never round.
      borderTopLeftRadius: radius.sheet,
      borderTopRightRadius: radius.sheet,
      borderTopWidth: 1,
      borderColor: palette.border,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.sm,
      gap: spacing.md,
      ...shadows.floating,
    },
    handle: {
      alignSelf: "center",
      width: 40,
      height: 4,
      borderRadius: radius.pill,
      backgroundColor: palette.borderStrong,
      marginBottom: spacing.sm,
    },
    title: {
      ...stitchType.titleMd,
      color: palette.textPrimary,
      textAlign: textAlignStart(),
    },
  });
