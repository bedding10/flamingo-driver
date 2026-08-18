import React, { useMemo } from "react";
import {
  StyleSheet,
  Text,
  type StyleProp,
  type TextStyle,
} from "react-native";
import { typography, usePalette, type Palette } from "../theme";
import { rtlText } from "./rtl";
import { formatMoney } from "./format";

export type TextVariant = keyof typeof typography;
export type TextTone =
  | "primary"
  | "secondary"
  | "muted"
  | "brand"
  | "success"
  | "danger"
  | "warning"
  | "onPrimary";

const toneColor = (palette: Palette, tone: TextTone): string => {
  switch (tone) {
    case "secondary":
      return palette.textSecondary;
    case "muted":
      return palette.textMuted;
    case "brand":
      return palette.primaryText;
    case "success":
      return palette.online;
    case "danger":
      return palette.danger;
    case "warning":
      return palette.warning;
    case "onPrimary":
      return palette.onPrimary;
    default:
      return palette.textPrimary;
  }
};

/**
 * Every piece of text in a Stitch screen, in one component.
 *
 * A screen picks a scale token (`variant`) and a role (`tone`) instead of a
 * size and a hex, which is what keeps 42 screens on the same type ramp.
 */
export function AppText({
  variant = "body",
  tone = "primary",
  align = "right",
  children,
  numberOfLines,
  style,
}: {
  variant?: TextVariant;
  tone?: TextTone;
  align?: TextStyle["textAlign"];
  children: React.ReactNode;
  numberOfLines?: number;
  style?: StyleProp<TextStyle>;
}) {
  const palette = usePalette();
  const computed = useMemo(
    () => ({
      ...typography[variant],
      color: toneColor(palette, tone),
      textAlign: align,
    }),
    [align, palette, tone, variant],
  );

  return (
    <Text numberOfLines={numberOfLines} style={[styles.base, computed, style]}>
      {children}
    </Text>
  );
}

/**
 * Money.
 *
 * The reference rule is absolute: earnings are always emerald. Passing a tone
 * is possible for a debit line (a commission, a transfer out), but the default
 * is the emerald the pack uses on every balance and every fare total.
 */
export function Money({
  amount,
  currency = "DZD",
  decimals = 2,
  variant = "numeric",
  tone = "success",
  align = "right",
  style,
}: {
  amount: number;
  currency?: string;
  decimals?: number;
  variant?: TextVariant;
  tone?: TextTone;
  align?: TextStyle["textAlign"];
  style?: StyleProp<TextStyle>;
}) {
  return (
    <AppText variant={variant} tone={tone} align={align} style={style}>
      {formatMoney(amount, currency, decimals)}
    </AppText>
  );
}

const styles = StyleSheet.create({ base: { ...rtlText } });
