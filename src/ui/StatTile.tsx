import React, { useMemo } from "react";
import {
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import {
  iconSize,
  radius,
  spacing,
  usePalette,
  type Palette,
} from "../theme";
import { Icon, type IconName } from "../components/Icon";
import { AppText, Money, type TextTone } from "./AppText";
import { rtlRow } from "./rtl";

/**
 * The small metric tile: today's earnings, trips done, online hours,
 * acceptance rate, wallet balance.
 *
 * `money` is a separate prop rather than a formatted string so the emerald
 * rule and the grouping are applied in one place instead of at 30 call sites.
 */
export function StatTile({
  label,
  value,
  money,
  currency,
  icon,
  tone = "primary",
  caption,
  style,
}: {
  label: string;
  value?: string;
  money?: number;
  currency?: string;
  icon?: IconName;
  tone?: TextTone;
  caption?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const palette = usePalette();
  const styles = useMemo(() => makeStyles(palette), [palette]);

  return (
    <View style={[styles.tile, style]}>
      <View style={styles.head}>
        {icon ? (
          <Icon name={icon} size={iconSize.md} color={palette.textSecondary} />
        ) : null}
        <AppText variant="caption" tone="secondary" numberOfLines={1}>
          {label}
        </AppText>
      </View>

      {money === undefined ? (
        <AppText variant="title" tone={tone} numberOfLines={1}>
          {value ?? "—"}
        </AppText>
      ) : (
        <Money amount={money} currency={currency} variant="title" />
      )}

      {caption ? (
        <AppText variant="caption" tone="muted" numberOfLines={1}>
          {caption}
        </AppText>
      ) : null}
    </View>
  );
}

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    tile: {
      flex: 1,
      minWidth: 140,
      backgroundColor: palette.surfaceSunken,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: palette.border,
      padding: spacing.md,
      gap: spacing.xs,
    },
    head: { ...rtlRow, alignItems: "center", gap: spacing.xs },
  });
