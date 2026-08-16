import React, { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { radius, spacing, usePalette } from "../theme";

/**
 * PHASE 7 - the app's loading placeholder. PHASE 7.5 - theme-aware.
 *
 * A centred spinner tells the driver that something is happening but not what is
 * coming; a skeleton keeps the layout stable so content does not jump when it
 * lands. It used to be hardcoded to a white-on-dark wash, which was invisible on
 * a light surface - it now reads its colour from the palette.
 *
 * The pulse runs on the native driver and is stopped on unmount, so no animation
 * survives the screen.
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
  const palette = usePalette();
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
          backgroundColor: palette.skeleton,
          opacity: pulse,
        },
        style,
      ]}
    />
  );
}

/** A card-shaped skeleton, sized like the list rows used across the app. */
export function SkeletonCard() {
  const palette = usePalette();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: palette.surface, borderColor: palette.border },
      ]}
    >
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
    borderRadius: radius.card,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
});
