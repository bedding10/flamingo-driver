import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  COLORS,
  ICON_SIZE,
  RADIUS,
  SHADOW_SHEET,
  SPACING,
  TOUCH_TARGET,
  typo,
} from "../theme/tokens";

/**
 * Component 9 - Floating bottom tab bar.
 * surface-container-high, rounded top corners, elevated upward shadow.
 * The active tab is a filled primary-container pill around the icon + label;
 * inactive tabs are plain on-surface-variant.
 */
export type TabItem<K extends string = string> = {
  key: K;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
};

export type BottomTabBarProps<K extends string = string> = {
  tabs: TabItem<K>[];
  activeKey: K;
  onChange: (key: K) => void;
};

export function BottomTabBar<K extends string = string>({
  tabs,
  activeKey,
  onChange,
}: BottomTabBarProps<K>) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        SHADOW_SHEET,
        { paddingBottom: Math.max(insets.bottom, SPACING.lg) },
      ]}
    >
      {tabs.map((tab) => {
        const active = tab.key === activeKey;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={tab.label}
            style={({ pressed }) => [
              styles.tab,
              active && styles.tabActive,
              pressed && styles.pressed,
            ]}
          >
            <MaterialIcons
              name={tab.icon}
              size={ICON_SIZE.lg}
              color={active ? COLORS.onPrimaryContainer : COLORS.onSurfaceVariant}
            />
            <Text
              style={[
                styles.label,
                {
                  color: active
                    ? COLORS.onPrimaryContainer
                    : COLORS.onSurfaceVariant,
                },
              ]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export const TAB_BAR_HEIGHT = 72;

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    backgroundColor: COLORS.surfaceContainerHigh,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
  },
  tab: {
    minHeight: TOUCH_TARGET,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  tabActive: {
    backgroundColor: COLORS.primaryContainer,
    paddingHorizontal: SPACING.xl,
  },
  label: { ...typo("labelSm"), marginTop: SPACING.xs },
  pressed: { transform: [{ scale: 0.94 }] },
});
