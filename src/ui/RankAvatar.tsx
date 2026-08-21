import { MaterialIcons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { RADIUS, RANK_RING, RankTier, typo } from "../theme/tokens";
import { useTokens, type Tokens } from "../theme/useTokens";

/**
 * Component 4 - Avatar with rank ring.
 * The ring colour comes from the passenger's ACTUAL tier in the existing
 * Bronze -> Legendary frame system. The reference shows gold and silver only
 * because those two riders are Gold and Silver tier.
 *
 * THEME: the ring is theme independent by design; the disc, the initial and
 * the rating chip are not - they sat on the surface, and the surface flips.
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
  const t = useTokens();
  const styles = useMemo(() => makeStyles(t), [t]);

  const ring = tier ? RANK_RING[tier] : t.colors.outlineVariant;
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
            size={t.iconSize.xs}
            color={t.semantic.star}
          />
          <Text style={styles.badgeText}>{rating.toFixed(1)}</Text>
        </View>
      ) : null}
    </View>
  );
}

function makeStyles(t: Tokens) {
  return StyleSheet.create({
    ring: {
      borderWidth: 2,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: t.colors.surface,
    },
    fallback: {
      backgroundColor: t.colors.surfaceContainerHigh,
      alignItems: "center",
      justifyContent: "center",
    },
    initial: { ...typo("titleMd"), color: t.colors.onSurfaceVariant },
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
      backgroundColor: t.colors.surfaceContainer,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.colors.surfaceVariant,
    },
    badgeText: {
      ...typo("labelSm"),
      color: t.colors.onSurface,
      fontWeight: "600",
    },
  });
}
