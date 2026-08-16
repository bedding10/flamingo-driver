import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography, withAlpha } from "../theme";

export type PillTone =
  | "pending"
  | "approved"
  | "rejected"
  | "expired"
  | "neutral";

/**
 * Small status chip used for document and account states.
 *
 * Colour is never the only carrier of meaning - the label is always spelled out
 * - because a driver may be colour-blind and the phone may be in bright sun.
 *
 * PHASE 1 added the `expired` tone. It is red like `rejected`, because both
 * mean the same thing to a driver on the road: this document does not let you
 * work right now. The label is what separates them.
 */
export function StatusPill({ label, tone }: { label: string; tone: PillTone }) {
  const color = TONE_COLORS[tone];
  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: withAlpha(color, 0.16), borderColor: withAlpha(color, 0.5) },
      ]}
    >
      <Text style={[styles.label, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const TONE_COLORS: Record<PillTone, string> = {
  pending: colors.warning,
  approved: colors.online,
  rejected: colors.danger,
  expired: colors.danger,
  neutral: colors.offline,
};

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  label: { ...typography.caption, fontWeight: "600", writingDirection: "rtl" },
});
