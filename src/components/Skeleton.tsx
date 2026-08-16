import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { colors, radius, spacing, withAlpha } from "../theme";

/**
 * PHASE 7 - the app's loading placeholder.
 *
 * Until now every screen showed a centred spinner, which tells the driver that
 * something is happening but not what is coming. A skeleton keeps the layout
 * stable, so the content does not jump when it lands.
 *
 * The pulse is driven with the native driver and looped forever while mounted;
 * it is stopped on unmount so no animation survives the screen.
 */
export function Skeleton({
  width,
  height = 16,
  round = radius.sm,
  style,
}: {
  width?: number | `${number}%`;
  height?: number;
  round?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.9,
          duration: 620,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.4,
          duration: 620,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        {
          width: width ?? "100%",
          height,
          borderRadius: round,
          backgroundColor: withAlpha(colors.white, 0.08),
          opacity: pulse,
        },
        style,
      ]}
    />
  );
}

/** A card-shaped skeleton, sized like the list rows used across the app. */
export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <Skeleton width="55%" height={18} />
      <Skeleton width="85%" height={13} />
      <Skeleton width="35%" height={13} />
    </View>
  );
}

/** Three stacked card skeletons: the default "list is loading" state. */
export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.xl, gap: spacing.md },
  card: {
    backgroundColor: colors.surfaceDark,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: spacing.lg,
    gap: spacing.sm,
  },
});
