import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import {
  radius,
  spacing,
  touchTarget,
  typography,
  usePalette,
} from "../theme";
import type { DriverAvailability } from "../types/driver";

/**
 * The single most important control in the app: go online, go offline.
 *
 * PHASE 7.5 changed two things and nothing else about its behaviour:
 *  - it is theme-aware, and the "go online" state is FLAMINGO PINK, because
 *    going online is the primary action of the whole product;
 *  - it has a `compact` size, used by the floating home status card. The full
 *    size is `touchTarget.critical` tall for one-handed use; compact is still 44
 *    tall, which is above the platform minimum, and it exists so the status card
 *    stops eating a third of the map.
 *
 * ON_TRIP stays a third, visibly locked state: the server refuses to change
 * availability during a trip, and a control that looks tappable but always
 * fails is worse than one that is clearly disabled. Colour never carries the
 * state alone - the label always spells it out.
 */
type Props = {
  availability: DriverAvailability;
  labels: { goOnline: string; goOffline: string; onTrip: string };
  pending?: boolean;
  /** Not APPROVED yet: the server would answer 403. */
  blocked?: boolean;
  compact?: boolean;
  onToggle: () => void;
};

export function OnlineToggle({
  availability,
  labels,
  pending = false,
  blocked = false,
  compact = false,
  onToggle,
}: Props) {
  const palette = usePalette();
  const onTrip = availability === "ON_TRIP";
  const online = availability === "ONLINE";
  const disabled = pending || blocked || onTrip;

  const label = onTrip
    ? labels.onTrip
    : online
      ? labels.goOffline
      : labels.goOnline;

  // Offline -> the pink call to action. Online -> a quiet outline, because
  // stopping work should never be the loudest thing on the screen.
  const filled = !online && !onTrip;
  const outlineTint = onTrip ? palette.busy : palette.textSecondary;

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: online || onTrip, disabled, busy: pending }}
      disabled={disabled}
      onPress={onToggle}
      style={({ pressed }) => [
        styles.base,
        compact ? styles.compact : styles.full,
        filled
          ? { backgroundColor: palette.primary, borderColor: palette.primary }
          : {
              backgroundColor: "transparent",
              borderColor: palette.borderStrong,
            },
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
      ]}
    >
      {pending ? (
        <ActivityIndicator
          color={filled ? palette.onPrimary : palette.primaryText}
        />
      ) : (
        <View style={styles.content}>
          {!filled ? (
            <View style={[styles.dot, { backgroundColor: outlineTint }]} />
          ) : null}
          <Text
            style={[
              compact ? styles.labelCompact : styles.label,
              { color: filled ? palette.onPrimary : outlineTint },
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  full: {
    minHeight: touchTarget.critical,
    paddingHorizontal: spacing.xl,
  },
  compact: {
    minHeight: 44,
    paddingHorizontal: spacing.lg,
  },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.55 },
  content: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: spacing.sm,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { ...typography.subtitle, writingDirection: "rtl" },
  labelCompact: {
    ...typography.label,
    fontWeight: "700",
    writingDirection: "rtl",
  },
});
