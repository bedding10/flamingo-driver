import React, { useMemo } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import {
  radius,
  spacing,
  touchTarget,
  usePalette,
  type Palette,
} from "../theme";
import { AppText } from "./AppText";
import { rtlRow } from "./rtl";

export type SegmentItem<T extends string> = { key: T; label: string };

/**
 * The day / week / all switcher on earnings, and the same control on the
 * leaderboard and the reviews list.
 *
 * Generic over the key type so a screen switches on a union
 * (`"today" | "week" | "all"`) instead of a loose string - the earnings
 * endpoint only knows those three buckets, and the compiler should say so.
 */
export function SegmentedTabs<T extends string>({
  items,
  value,
  onChange,
  style,
}: {
  items: ReadonlyArray<SegmentItem<T>>;
  value: T;
  onChange: (next: T) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const palette = usePalette();
  const styles = useMemo(() => makeStyles(palette), [palette]);

  return (
    <View style={[styles.bar, style]}>
      {items.map((item) => {
        const active = item.key === value;
        return (
          <Pressable
            key={item.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(item.key)}
            style={[styles.tab, active && styles.tabActive]}
          >
            <AppText
              variant="label"
              tone={active ? "onPrimary" : "secondary"}
              align="center"
              numberOfLines={1}
            >
              {item.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    bar: {
      ...rtlRow,
      backgroundColor: palette.surfaceSunken,
      borderRadius: radius.pill,
      padding: spacing.xs,
      gap: spacing.xs,
    },
    tab: {
      flex: 1,
      minHeight: touchTarget.stitchMin - 8,
      borderRadius: radius.pill,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.sm,
    },
    tabActive: { backgroundColor: palette.primary },
  });
