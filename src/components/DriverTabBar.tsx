import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Icon, type IconName } from "./Icon";
import { iconSize, radius, spacing, typography, usePalette } from "../theme";

/**
 * The bottom navigation, rebuilt to match the Stitch reference exactly.
 *
 * WHY THIS CHANGED
 * The previous version floated inset from all three edges. That was a
 * deliberate deviation recorded in this file's own header, and the owner has now
 * overridden it: the bar must look like the reference screens. So it is attached
 * again, and every value below is copied from the markup that is identical in
 * `main_driver_map` and `available_requests`:
 *
 *   nav   fixed bottom-0 left-0 w-full flex justify-around items-center
 *         px-4 pb-8 pt-2 bg-surface-container-high rounded-t-xl
 *         shadow-[0_-4px_24px_rgba(0,0,0,0.1)]
 *   item  flex flex-col items-center justify-center text-on-surface-variant
 *         px-4 py-2                                    (inactive)
 *   item  bg-primary-container text-on-primary-container rounded-full
 *         px-6 py-2                                    (active)
 *   label font-label-sm text-label-sm mt-1             (bold when active)
 *   press active:scale-90
 *
 * Two structural corrections come with it. The pink pill now wraps the icon AND
 * the label, as in the reference, instead of sitting behind the icon only; and
 * the label takes the same colour as the icon, because the reference lets both
 * inherit from the item.
 *
 * `pb-8` is 32px in a browser mock that has no gesture bar. On a device the
 * bottom inset can be larger, so the padding is the greater of the two rather
 * than their sum - a stacked inset would push the bar to twice the reference
 * height.
 *
 * Why it is still a plain component and not a tab navigator: the map screen owns
 * the GPS subscription, the socket listeners and the trip lifecycle, and must
 * stay mounted for the whole shift. A tab navigator would unmount it exactly
 * when an offer arrives.
 */

/** Height of the bar above its bottom padding: pt-2 + the 60px item pill. */
export const TAB_BAR_CONTENT_HEIGHT = 68;

/** Kept so existing importers keep compiling. The bar is no longer a pill. */
export const TAB_BAR_HEIGHT = TAB_BAR_CONTENT_HEIGHT;
/** Kept for the same reason: an attached bar has no side margin. */
export const TAB_BAR_MARGIN = 0;

/** The reference `pb-8`, widened only when the device inset demands it. */
export const tabBarBottomPadding = (bottomInset: number): number =>
  Math.max(spacing["3xl"], bottomInset + spacing.sm);

/**
 * Space a scroll view or floating card must leave free at the bottom so its
 * last row is never hidden under the navigation.
 */
export const navSpace = (bottomInset: number): number =>
  TAB_BAR_CONTENT_HEIGHT + tabBarBottomPadding(bottomInset);

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
        styles.bar,
        {
          backgroundColor: palette.surfaceRaised,
          paddingBottom: tabBarBottomPadding(bottomInset),
        },
      ]}
    >
      {/*
        row-reverse: the first item reads on the right, which mirrors the
        reference order (requests, map, menu) into an Arabic layout.
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

  // Stitch lets the icon and the label inherit one colour from the item:
  // on-primary-container inside the pink pill, on-surface-variant outside it.
  const tint = active ? palette.onPrimary : palette.textSecondary;

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.item,
        active
          ? [styles.itemActive, { backgroundColor: palette.primary }]
          : null,
        pressed ? styles.pressed : null,
      ]}
    >
      <View style={styles.iconWrap}>
        <Icon name={icon} size={iconSize.lg} color={tint} />
        {badge > 0 ? (
          <View
            style={[
              styles.badge,
              {
                backgroundColor: palette.primary,
                borderColor: palette.surfaceRaised,
              },
            ]}
          >
            <Text style={[styles.badgeText, { color: palette.onPrimary }]}>
              {badge > 99 ? "99+" : String(badge)}
            </Text>
          </View>
        ) : null}
      </View>
      <Text
        style={[styles.label, active ? styles.labelActive : null, { color: tint }]}
        numberOfLines={1}
      >
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
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    // shadow-[0_-4px_24px_rgba(0,0,0,0.1)] - RN blur is half the CSS radius.
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 16,
  },
  item: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    gap: spacing.xs,
  },
  itemActive: { paddingHorizontal: spacing["2xl"] },
  pressed: { transform: [{ scale: 0.9 }] },
  iconWrap: { alignItems: "center", justifyContent: "center" },
  label: { ...typography.caption, writingDirection: "rtl" },
  labelActive: { fontWeight: "700" },
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
