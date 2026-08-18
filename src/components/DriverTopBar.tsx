import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon } from "./Icon";
import { AppText, LevelAvatar, type DriverLevel } from "../ui";
import {
  LEVEL_TINTS,
  iconSize,
  radius,
  spacing,
  touchTarget,
  usePalette,
} from "../theme";

/**
 * The floating chrome at the top of the map, copied from the Stitch reference.
 *
 * The reference markup (`main_driver_map`) is, in order:
 *
 *   header  absolute top-0 w-full px-gutter pt-8 pb-4 flex justify-between
 *           items-center pointer-events-none
 *   left    button w-12 h-12 rounded-full border-[2px] border-[#CD7F32]
 *           overflow-hidden           <- the tier ring, on the avatar
 *   centre  div bg-surface-container/85 backdrop-blur-md rounded-full px-6 py-2
 *           flex items-center gap-3 border border-surface-variant
 *             span w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981]
 *             span font-label-md text-on-surface          <- "Online"
 *             span font-label-sm text-on-surface-variant ml-2 pl-2
 *                  border-l border-surface-variant        <- "Algiers, Algeria"
 *   right   button w-12 h-12 rounded-full bg-surface-container/85
 *           backdrop-blur-md text-primary                 <- notifications
 *
 * This replaces a brand mark plus two stacked pills, which is the single most
 * visible reason the screen did not look like the reference.
 *
 * THREE DELIBERATE TRANSLATIONS, each because React Native cannot express the
 * CSS directly:
 *
 *  - `backdrop-blur-md` does not exist in React Native, so the pill and the
 *    button use `palette.overlay`, which is the same `surface-container` raised
 *    to 92% alpha for exactly this reason. A real blur would need `expo-blur`,
 *    which is not a dependency of this project.
 *  - the `border-l` divider is drawn as its own 1px View instead of a border on
 *    the city label. A left border would sit on the wrong side once the row is
 *    mirrored, and this app mirrors with `row-reverse` rather than through
 *    I18nManager, so physical left is not reliably the leading edge.
 *  - `pt-8` is 32px in a browser mock that has no status bar. On a device the
 *    top inset is taken as the greater of the two rather than added to it.
 *
 * ONE ADDITION: the unread badge on the notifications button. The reference
 * draws the button with no badge, but this app knows the unread count and a
 * driver who cannot see it has to open the inbox to find out. It is the only
 * element here that is not in the reference.
 */

/**
 * `profileLevel` arrives from the server as a free-form string. This accepts it
 * only when it names a real tier, so an unknown value renders no ring instead of
 * crashing on a missing tint.
 */
export const toDriverLevel = (raw?: string | null): DriverLevel | undefined => {
  if (!raw) return undefined;
  const upper = raw.toUpperCase();
  return (Object.keys(LEVEL_TINTS) as DriverLevel[]).find(
    (level) => level === upper,
  );
};

/** Inner avatar size. LevelAvatar adds its 2px ring and 2px pad around it. */
const AVATAR_INNER = 40;

export function DriverTopBar({
  name,
  photoUrl,
  level,
  statusLabel,
  statusColor,
  cityLabel,
  badge = 0,
  topInset,
  onProfile,
  onNotifications,
}: {
  name: string;
  photoUrl?: string | null;
  level?: DriverLevel;
  statusLabel: string;
  /** Online / on-trip / offline, already resolved by the screen. */
  statusColor: string;
  /** City name. Hidden entirely when the server has not set one. */
  cityLabel?: string | null;
  badge?: number;
  topInset: number;
  onProfile: () => void;
  onNotifications: () => void;
}) {
  const palette = usePalette();

  return (
    <View
      style={[
        styles.header,
        { paddingTop: Math.max(spacing["3xl"], topInset + spacing.sm) },
      ]}
      pointerEvents="box-none"
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={name}
        onPress={onProfile}
        style={({ pressed }) => [pressed ? styles.pressed : null]}
      >
        <LevelAvatar
          name={name}
          uri={photoUrl}
          level={level}
          size={AVATAR_INNER}
        />
      </Pressable>

      <View
        style={[
          styles.pill,
          {
            backgroundColor: palette.overlay,
            borderColor: palette.surfaceVariant,
          },
        ]}
      >
        {/* dot + label keep the reference gap-3; the divider group uses gap-2 */}
        <View style={styles.statusGroup}>
          <View
            style={[
              styles.dot,
              { backgroundColor: statusColor, shadowColor: statusColor },
            ]}
          />
          <AppText variant="label" style={{ color: palette.textPrimary }}>
            {statusLabel}
          </AppText>
        </View>

        {cityLabel ? (
          <>
            <View
              style={[styles.divider, { backgroundColor: palette.surfaceVariant }]}
            />
            <AppText
              variant="caption"
              numberOfLines={1}
              style={{ color: palette.textSecondary }}
            >
              {cityLabel}
            </AppText>
          </>
        ) : null}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={statusLabel}
        onPress={onNotifications}
        style={({ pressed }) => [
          styles.round,
          {
            backgroundColor: palette.overlay,
            borderColor: palette.surfaceVariant,
          },
          pressed ? styles.pressed : null,
        ]}
      >
        <Icon name="bell" size={iconSize.lg} color={palette.primaryText} />
        {badge > 0 ? (
          <View
            style={[
              styles.badge,
              {
                backgroundColor: palette.primary,
                borderColor: palette.overlay,
              },
            ]}
          >
            <AppText
              variant="caption"
              style={[styles.badgeText, { color: palette.onPrimary }]}
            >
              {badge > 99 ? "99+" : String(badge)}
            </AppText>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  pill: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing["2xl"],
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexShrink: 1,
  },
  statusGroup: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    elevation: 4,
  },
  divider: { width: 1, alignSelf: "stretch" },
  round: {
    width: touchTarget.stitchMin,
    height: touchTarget.stitchMin,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { transform: [{ scale: 0.95 }] },
  badge: {
    position: "absolute",
    top: 2,
    left: 2,
    minWidth: 18,
    height: 18,
    borderRadius: radius.pill,
    paddingHorizontal: 4,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { fontSize: 10, lineHeight: 13 },
});
