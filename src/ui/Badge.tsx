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
  withAlpha,
  type Palette,
} from "../theme";
import { Icon, type IconName } from "../components/Icon";
import { AppText } from "./AppText";
import { rtlRow } from "./rtl";

export type BadgeTone =
  | "neutral"
  | "brand"
  | "success"
  | "danger"
  | "warning"
  | "info";

const toneColor = (palette: Palette, tone: BadgeTone): string => {
  switch (tone) {
    case "brand":
      return palette.primaryText;
    case "success":
      return palette.online;
    case "danger":
      return palette.danger;
    case "warning":
      return palette.warning;
    case "info":
      return palette.info;
    default:
      return palette.textSecondary;
  }
};

/**
 * The status pill: document state, trip state, zone demand, offer state.
 *
 * A tinted wash behind the tone colour rather than a solid fill, so a row can
 * carry three of them without turning into a traffic light.
 */
export function Badge({
  label,
  tone = "neutral",
  icon,
  solid = false,
  style,
}: {
  label: string;
  tone?: BadgeTone;
  icon?: IconName;
  solid?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const palette = usePalette();
  const color = toneColor(palette, tone);
  const styles = useMemo(() => makeStyles(palette), [palette]);

  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: solid ? color : withAlpha(color, 0.14),
          borderColor: withAlpha(color, solid ? 1 : 0.28),
        },
        style,
      ]}
    >
      {icon ? (
        <Icon
          name={icon}
          size={iconSize.sm}
          color={solid ? palette.background : color}
        />
      ) : null}
      <AppText
        variant="caption"
        style={{ color: solid ? palette.background : color }}
      >
        {label}
      </AppText>
    </View>
  );
}

const makeStyles = (_palette: Palette) =>
  StyleSheet.create({
    pill: {
      ...rtlRow,
      alignItems: "center",
      alignSelf: "flex-start",
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.pill,
      borderWidth: 1,
    },
  });
