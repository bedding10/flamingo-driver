import { MaterialIcons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RADIUS, SPACING, TOUCH_TARGET, typo } from "../theme/tokens";
import { useTokens, type Tokens } from "../theme/useTokens";

/**
 * Component 9 - Floating bottom tab bar.
 * surface-container-high, rounded top corners, elevated upward shadow.
 * The active tab is a filled primary-container pill around the icon + label;
 * inactive tabs are plain on-surface-variant.
 *
 * THEME: the bar and the inactive tabs follow the mode. The active pink pill
 * does not - it is the one target a driver finds by colour while moving.
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
  const t = useTokens();
  const styles = useMemo(() => makeStyles(t), [t]);

  return (
    <View
      style={[
        styles.bar,
        t.shadowSheet,
        { paddingBottom: Math.max(insets.bottom, SPACING.lg) },
      ]}
    >
      {tabs.map((tab) => {
        const active = tab.key === activeKey;
        const fg = active
          ? t.colors.onPrimaryContainer
          : t.colors.onSurfaceVariant;
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
            <MaterialIcons name={tab.icon} size={t.iconSize.lg} color={fg} />
            <Text style={[styles.label, { color: fg }]} numberOfLines={1}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export const TAB_BAR_HEIGHT = 72;

function makeStyles(t: Tokens) {
  return StyleSheet.create({
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
      backgroundColor: t.colors.surfaceContainerHigh,
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
      backgroundColor: t.colors.primaryContainer,
      paddingHorizontal: SPACING.xl,
    },
    label: { ...typo("labelSm"), marginTop: SPACING.xs },
    pressed: { transform: [{ scale: 0.94 }] },
  });
}
