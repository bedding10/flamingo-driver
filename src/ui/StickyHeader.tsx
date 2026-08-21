import { MaterialIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  alpha,
  BLUR,
  COLORS,
  ICON_SIZE,
  RADIUS,
  SPACING,
  typo,
} from "../theme/tokens";

/**
 * Component 1 - Sticky header.
 * Reference: `bg-surface-container/85 backdrop-blur-lg` with the menu button on
 * the left, the "flaminGo" wordmark in primary, and the bell on the right.
 */
export type StickyHeaderProps = {
  /** Defaults to the flaminGo wordmark. Pass a screen title to override. */
  title?: string;
  onMenuPress?: () => void;
  onBackPress?: () => void;
  onNotificationsPress?: () => void;
  /** Renders the pink unread dot on the bell. */
  hasUnread?: boolean;
  right?: React.ReactNode;
};

export function StickyHeader({
  title = "flaminGo",
  onMenuPress,
  onBackPress,
  onNotificationsPress,
  hasUnread = false,
  right,
}: StickyHeaderProps) {
  const insets = useSafeAreaInsets();
  const leadingIcon = onBackPress ? "arrow-back" : "menu";
  const onLeadingPress = onBackPress ?? onMenuPress;

  return (
    <BlurView
      intensity={BLUR.header}
      tint={BLUR.tint}
      style={[styles.wrap, { paddingTop: insets.top }]}
    >
      <View style={styles.row}>
        <View style={styles.left}>
          {onLeadingPress ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={onBackPress ? "Back" : "Menu"}
              onPress={onLeadingPress}
              style={styles.iconButton}
              hitSlop={8}
            >
              <MaterialIcons
                name={leadingIcon}
                size={ICON_SIZE.lg}
                color={COLORS.primary}
              />
            </Pressable>
          ) : null}
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>

        <View style={styles.right}>
          {right}
          {onNotificationsPress ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              onPress={onNotificationsPress}
              style={styles.iconButton}
              hitSlop={8}
            >
              <MaterialIcons
                name="notifications-none"
                size={ICON_SIZE.lg}
                color={COLORS.onSurfaceVariant}
              />
              {hasUnread ? <View style={styles.dot} /> : null}
            </Pressable>
          ) : null}
        </View>
      </View>
    </BlurView>
  );
}

export const HEADER_HEIGHT = 56;

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: alpha(COLORS.surfaceContainer, 0.85),
  },
  row: {
    height: HEADER_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.gutter,
  },
  left: { flexDirection: "row", alignItems: "center", gap: SPACING.md, flex: 1 },
  right: { flexDirection: "row", alignItems: "center" },
  iconButton: {
    height: 40,
    width: 40,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { ...typo("headlineLgMobile"), color: COLORS.primary, flexShrink: 1 },
  dot: {
    position: "absolute",
    top: 8,
    right: 9,
    height: 8,
    width: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryContainer,
  },
});
