import React from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import {
  iconSize,
  radius,
  spacing,
  usePalette,
  withAlpha,
  type Palette,
} from "../theme";
import { Icon, type IconName } from "../components/Icon";
import { AppText } from "./AppText";
import { Button } from "./Button";
import { rtlRow } from "./rtl";

export type AlertTone = "info" | "warning" | "danger" | "success";

const toneColor = (palette: Palette, tone: AlertTone): string => {
  switch (tone) {
    case "warning":
      return palette.warning;
    case "danger":
      return palette.danger;
    case "success":
      return palette.online;
    default:
      return palette.info;
  }
};

const toneIcon: Record<AlertTone, IconName> = {
  info: "info",
  warning: "warning",
  danger: "error",
  success: "success",
};

/**
 * The inline notice: a denied permission, a rejected document, a feature the
 * backend does not serve yet.
 *
 * It is a tinted wash rather than a solid block, because these appear stacked
 * above cards that already carry colour. The action is a ghost button on its
 * own line so the message is never squeezed into one word.
 */
export function AlertBanner({
  tone = "info",
  title,
  message,
  icon,
  actionLabel,
  onAction,
  style,
}: {
  tone?: AlertTone;
  title?: string;
  message: string;
  icon?: IconName;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const palette = usePalette();
  const color = toneColor(palette, tone);

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: withAlpha(color, 0.12),
          borderColor: withAlpha(color, 0.3),
        },
        style,
      ]}
    >
      <View style={styles.head}>
        <Icon name={icon ?? toneIcon[tone]} size={iconSize.lg} color={color} />
        <View style={styles.text}>
          {title ? (
            <AppText variant="subtitle" style={{ color }}>
              {title}
            </AppText>
          ) : null}
          <AppText variant="caption" tone="secondary">
            {message}
          </AppText>
        </View>
      </View>

      {actionLabel && onAction ? (
        <Button
          label={actionLabel}
          variant="ghost"
          size="sm"
          onPress={onAction}
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.card,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  head: { ...rtlRow, alignItems: "flex-start", gap: spacing.md },
  text: { flex: 1, gap: 2 },
  action: { alignSelf: "flex-end", paddingHorizontal: spacing.md },
});
