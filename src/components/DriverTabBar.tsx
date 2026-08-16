import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { Icon, type IconName } from "./Icon";
import {
  radius,
  shadows,
  spacing,
  typography,
  usePalette,
  motion,
} from "../theme";

/**
 * PHASE 7.5 - the floating bottom navigation.
 *
 * It was a full-width bar glued to the bottom edge with glyph characters for
 * icons. Now it is a floating rounded container inset from all three edges,
 * with real stroke icons, labels that are actually readable, and a pink pill
 * behind the active item.
 *
 * Why it is still a plain component instead of a React Navigation tab
 * navigator: the map screen owns the GPS subscription, the socket listeners and
 * the trip lifecycle and must stay mounted for the entire shift. A tab
 * navigator would unmount or freeze it the moment the driver opens the requests
 * list - which is exactly when an offer arrives. So the bar floats above the
 * map and pushes the other routes over it.
 *
 * The centre item is not a link to itself: on the map it recentres the camera.
 */

/** Visual height of the floating pill (without the safe-area inset). */
export const TAB_BAR_HEIGHT = 66;
/** Gap between the pill and the screen edges. */
export const TAB_BAR_MARGIN = 14;

/**
 * Space a floating card must leave free at the bottom so it never sits under
 * the navigation. Every sheet on the home screen uses this.
 */
export const navSpace = (bottomInset: number): number =>
  TAB_BAR_HEIGHT + TAB_BAR_MARGIN + bottomInset;

export type DriverTab = "requests" | "map" | "menu";

export function DriverTabBar({
  active,
  bottomInset,
  labels,
  badge = 0,
  onSelect,
}: {
  active: DriverTab;
  bottomInset: number;
  labels: { requests: string; map: string; menu: string };
  /** Unread notifications, shown on the item that leads to them. */
  badge?: number;
  onSelect: (tab: DriverTab) => void;
}) {
  const palette = usePalette();

  return (
    <View
      style={[
        styles.wrap,
        { bottom: bottomInset + TAB_BAR_MARGIN },
      ]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.bar,
          {
            height: TAB_BAR_HEIGHT,
            backgroundColor: palette.surface,
            borderColor: palette.border,
          },
        ]}
      >
        {/*
          row-reverse: the first item reads on the right, so "requests" sits on
          the right, the map stays centred and the menu is on the left - the
          mirror of the latin layout, which is what RTL actually means.
        */}
        <Item
          icon="requests"
          label={labels.requests}
          active={active === "requests"}
          onPress={() => onSelect("requests")}
        />
        <Item
          icon="map"
          label={labels.map}
          active={active === "map"}
          onPress={() => onSelect("map")}
        />
        <Item
          icon="menu"
          label={labels.menu}
          active={active === "menu"}
          badge={badge}
          onPress={() => onSelect("menu")}
        />
      </View>
    </View>
  );
}

function Item({
  icon,
  label,
  active,
  badge = 0,
  onPress,
}: {
  icon: IconName;
  label: string;
  active: boolean;
  badge?: number;
  onPress: () => void;
}) {
  const palette = usePalette();

  // One tiny spring on selection. Nothing animates while driving except this.
  const lift = useRef(new Animated.Value(active ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(lift, {
      toValue: active ? 1 : 0,
      useNativeDriver: true,
      damping: motion.spring.damping,
      stiffness: motion.spring.stiffness,
      mass: motion.spring.mass,
    }).start();
  }, [active, lift]);

  const scale = lift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  const tint = active ? palette.primaryText : palette.textSecondary;

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.item}
    >
      <Animated.View style={[styles.itemInner, { transform: [{ scale }] }]}>
        <View
          style={[
            styles.iconWrap,
            active
              ? { backgroundColor: palette.primaryWash }
              : null,
          ]}
        >
          <Icon name={icon} size={22} color={tint} />
          {badge > 0 ? (
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: palette.primary,
                  borderColor: palette.surface,
                },
              ]}
            >
              <Text style={[styles.badgeText, { color: palette.onPrimary }]}>
                {badge > 99 ? "99+" : String(badge)}
              </Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.label, { color: tint }]} numberOfLines={1}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: TAB_BAR_MARGIN,
    right: TAB_BAR_MARGIN,
  },
  bar: {
    flexDirection: "row-reverse",
    alignItems: "center",
    borderRadius: 26,
    borderWidth: 1,
    paddingHorizontal: spacing.xs,
    ...shadows.floating,
  },
  item: { flex: 1, alignItems: "center", justifyContent: "center" },
  itemInner: { alignItems: "center", gap: 2 },
  iconWrap: {
    width: 46,
    height: 30,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    ...typography.caption,
    fontWeight: "600",
    writingDirection: "rtl",
  },
  badge: {
    position: "absolute",
    top: -4,
    left: 2,
    minWidth: 18,
    height: 18,
    borderRadius: radius.pill,
    paddingHorizontal: 4,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { ...typography.caption, fontSize: 10, lineHeight: 13 },
});
