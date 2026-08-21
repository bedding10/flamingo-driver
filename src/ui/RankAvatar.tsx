import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import {
  COLORS,
  ICON_SIZE,
  RADIUS,
  RANK_RING,
  RankTier,
  SEMANTIC,
  typo,
} from "../theme/tokens";

/**
 * Component 4 - Avatar with rank ring.
 * The ring colour comes from the passenger's ACTUAL tier in the existing
 * Bronze -> Legendary frame system. The reference shows gold and silver only
 * because those two riders are Gold and Silver tier.
 */
export type RankAvatarProps = {
  uri?: string | null;
  name?: string;
  tier?: RankTier | null;
  /** Shows the star + rating badge overlapping the bottom-right. */
  rating?: number | null;
  size?: number;
};

export function RankAvatar({
  uri,
  name,
  tier,
  rating,
  size = 56,
}: RankAvatarProps) {
  const ring = tier ? RANK_RING[tier] : COLORS.outlineVariant;
  const initial = (name ?? "?").trim().charAt(0).toUpperCase();

  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: RADIUS.full,
            borderColor: ring,
          },
        ]}
      >
        {uri ? (
          <Image
            source={{ uri }}
            style={{
              width: size - 6,
              height: size - 6,
              borderRadius: RADIUS.full,
            }}
          />
        ) : (
          <View
            style={[
              styles.fallback,
              {
                width: size - 6,
                height: size - 6,
                borderRadius: RADIUS.full,
              },
            ]}
          >
            <Text style={styles.initial}>{initial}</Text>
          </View>
        )}
      </View>

      {rating != null ? (
        <View style={styles.badge}>
          <MaterialIcons
            name="star"
            size={ICON_SIZE.xs}
            color={SEMANTIC.star}
          />
          <Text style={styles.badgeText}>{rating.toFixed(1)}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
  },
  fallback: {
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: "center",
    justifyContent: "center",
  },
  initial: { ...typo("titleMd"), color: COLORS.onSurfaceVariant },
  badge: {
    position: "absolute",
    bottom: -8,
    right: -6,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceContainer,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.surfaceVariant,
  },
  badgeText: { ...typo("labelSm"), color: COLORS.onSurface, fontWeight: "600" },
});
