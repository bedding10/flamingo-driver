import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, shadows, spacing, typography, withAlpha } from "../theme";

/**
 * PHASE 7 - the bottom navigation: requests | map | menu, with the map in the
 * middle because the map is the driver's home.
 *
 * Why this is a component and NOT a React Navigation tab navigator:
 * the map screen must stay mounted for the whole shift. It owns the GPS
 * subscription, the socket handlers and the trip lifecycle; a tab navigator
 * would unmount or freeze it when the driver looks at the requests list, which
 * is exactly when a ride offer arrives. So the bar renders on top of the map
 * and pushes the other screens over it, keeping the stack behaviour that
 * PHASES 3-6 were built on. Nothing about the existing routes changed.
 *
 * The centre item is intentionally not a link to itself: on the map it is a
 * state indicator, and pressing it recentres the camera instead of navigating.
 */

/** Height of the bar without the safe-area inset. Cards add it to their inset. */
export const TAB_BAR_HEIGHT = 64;

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
  /** Unread notifications, shown on the menu entry that leads to them. */
  badge?: number;
  onSelect: (tab: DriverTab) => void;
}) {
  return (
    <View
      style={[
        styles.bar,
        { height: TAB_BAR_HEIGHT + bottomInset, paddingBottom: bottomInset },
      ]}
    >
      <Item
        glyph={"\u25CE"}
        label={labels.requests}
        active={active === "requests"}
        onPress={() => onSelect("requests")}
      />
      <Item
        glyph={"\u25C8"}
        label={labels.map}
        active={active === "map"}
        onPress={() => onSelect("map")}
      />
      <Item
        glyph={"\u2261"}
        label={labels.menu}
        active={active === "menu"}
        badge={badge}
        onPress={() => onSelect("menu")}
      />
    </View>
  );
}

function Item({
  glyph,
  label,
  active,
  badge = 0,
  onPress,
}: {
  glyph: string;
  label: string;
  active: boolean;
  badge?: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.item,
        pressed ? styles.itemPressed : null,
      ]}
    >
      <View style={styles.glyphWrap}>
        <Text style={[styles.glyph, active ? styles.glyphActive : null]}>
          {glyph}
        </Text>
        {badge > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {badge > 99 ? "99+" : String(badge)}
            </Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.label, active ? styles.labelActive : null]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    // row-reverse: the first item reads on the right in an RTL layout.
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: colors.ink,
    borderTopWidth: 1,
    borderColor: colors.divider,
    ...shadows.sheet,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingVertical: spacing.sm,
  },
  itemPressed: { backgroundColor: colors.pressed },
  glyphWrap: { alignItems: "center", justifyContent: "center" },
  glyph: {
    ...typography.title,
    color: colors.textOnDarkSecondary,
    lineHeight: 24,
  },
  glyphActive: { color: colors.gold },
  label: {
    ...typography.caption,
    color: colors.textOnDarkSecondary,
    writingDirection: "rtl",
  },
  labelActive: { color: colors.gold },
  badge: {
    position: "absolute",
    top: -6,
    left: -12,
    minWidth: 18,
    height: 18,
    borderRadius: radius.pill,
    paddingHorizontal: 4,
    backgroundColor: colors.gold,
    borderWidth: 1,
    borderColor: withAlpha(colors.white, 0.2),
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    ...typography.caption,
    fontSize: 11,
    lineHeight: 14,
    color: colors.ink,
  },
});
