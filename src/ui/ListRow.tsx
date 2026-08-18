import React, { useMemo } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import {
  iconSize,
  radius,
  spacing,
  touchTarget,
  usePalette,
  withAlpha,
  type Palette,
} from "../theme";
import { Icon, type IconName } from "../components/Icon";
import { AppText, type TextTone } from "./AppText";
import { forwardChevron, rtlRow } from "./rtl";

/**
 * The mirrored list row behind the menu, wallet ledger, notifications,
 * documents checklist, help topics and referral history.
 *
 * The leading icon sits in a tinted square (the pack's `bg-primary/10` chip),
 * the title/subtitle stack takes the remaining width, and the trailing value or
 * chevron closes the row on the left in Arabic.
 */
export function ListRow({
  title,
  subtitle,
  icon,
  iconTone = "brand",
  value,
  valueTone = "primary",
  trailing,
  onPress,
  showChevron,
  style,
}: {
  title: string;
  subtitle?: string;
  icon?: IconName;
  iconTone?: "brand" | "neutral" | "success" | "danger";
  value?: string;
  valueTone?: TextTone;
  trailing?: React.ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const palette = usePalette();
  const styles = useMemo(() => makeStyles(palette), [palette]);

  const iconColor =
    iconTone === "success"
      ? palette.online
      : iconTone === "danger"
        ? palette.danger
        : iconTone === "neutral"
          ? palette.textSecondary
          : palette.primaryText;

  const body = (
    <>
      {icon ? (
        <View
          style={[styles.chip, { backgroundColor: withAlpha(iconColor, 0.12) }]}
        >
          <Icon name={icon} size={iconSize.lg} color={iconColor} />
        </View>
      ) : null}

      <View style={styles.texts}>
        <AppText variant="subtitle" numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" tone="secondary" numberOfLines={2}>
            {subtitle}
          </AppText>
        ) : null}
      </View>

      {value ? (
        <AppText variant="subtitle" tone={valueTone}>
          {value}
        </AppText>
      ) : null}
      {trailing}
      {showChevron ?? Boolean(onPress) ? (
        <Icon
          name={forwardChevron}
          size={iconSize.lg}
          color={palette.textMuted}
        />
      ) : null}
    </>
  );

  if (!onPress) return <View style={[styles.row, style]}>{body}</View>;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed, style]}
    >
      {body}
    </Pressable>
  );
}

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    row: {
      ...rtlRow,
      alignItems: "center",
      gap: spacing.md,
      minHeight: touchTarget.normal,
      paddingVertical: spacing.sm,
    },
    pressed: { backgroundColor: palette.pressed, borderRadius: radius.card },
    chip: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      alignItems: "center",
      justifyContent: "center",
    },
    texts: { flex: 1, gap: 2 },
  });
