import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, touchTarget, typography, withAlpha } from "../theme";
import type { DriverAvailability } from "../types/driver";

/**
 * The single most important control in the app: go online, go offline.
 *
 * It is `touchTarget.critical` tall and full width because it is pressed with
 * one hand, often with the car already moving. Colour alone never carries the
 * state - the label always spells it out - and ON_TRIP is a third visual state
 * rather than "online", because the server refuses to change availability
 * during a trip and a control that looks tappable but always fails is worse
 * than one that is visibly locked.
 *
 * Labels arrive as props so this component holds no copy and the i18n file
 * stays the only place text lives.
 */

type Props = {
  availability: DriverAvailability;
  labels: { goOnline: string; goOffline: string; onTrip: string };
  pending?: boolean;
  /** Not APPROVED yet: the server would answer 403. */
  blocked?: boolean;
  onToggle: () => void;
};

export function OnlineToggle({
  availability,
  labels,
  pending = false,
  blocked = false,
  onToggle,
}: Props) {
  const onTrip = availability === "ON_TRIP";
  const online = availability === "ONLINE";
  const disabled = pending || blocked || onTrip;

  const label = onTrip
    ? labels.onTrip
    : online
      ? labels.goOffline
      : labels.goOnline;

  const tint = onTrip ? colors.info : online ? colors.danger : colors.online;

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: online || onTrip, disabled, busy: pending }}
      disabled={disabled}
      onPress={onToggle}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: online || onTrip ? withAlpha(tint, 0.16) : tint,
          borderColor: withAlpha(tint, online || onTrip ? 0.6 : 1),
        },
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
      ]}
    >
      {pending ? (
        <ActivityIndicator color={online || onTrip ? tint : colors.white} />
      ) : (
        <View style={styles.content}>
          <View style={[styles.dot, { backgroundColor: online || onTrip ? tint : colors.white }]} />
          <Text
            style={[
              styles.label,
              { color: online || onTrip ? tint : colors.white },
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
    minHeight: touchTarget.critical,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.55 },
  content: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: spacing.md,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  label: { ...typography.subtitle, writingDirection: "rtl" },
});
