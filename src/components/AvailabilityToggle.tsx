/**
 * AvailabilityToggle — the ONLY control that puts the driver online or offline.
 *
 * Replaces the big bottom card (vehicle line + "start receiving requests"
 * button) by request: the home screen now shows the map, and this single switch
 * lives in the top bar.
 *
 * It is a switch, not a button: the track colour and the knob position both
 * carry the state, so it reads correctly without relying on the label. Colour
 * alone is never the only cue — the label next to it always spells the state
 * out.
 *
 * The server, not this component, decides whether the change is allowed:
 * POST /driver/me/availability refuses ONLINE while status is not APPROVED and
 * refuses any change while availability is ON_TRIP. `blocked` and `onTrip` come
 * from that contract, and both render the switch as disabled instead of letting
 * the driver tap into a guaranteed error.
 *
 * Theming: useTokens(), so it honours dark and light mode. The pink "on" fill is
 * a brand constant on purpose and stays identical in both schemes.
 */
import React, { useEffect, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MOTION, RADIUS, SPACING, alpha, typo } from "../theme/tokens";
import { useTokens, type Tokens } from "../theme/useTokens";

/** Switch geometry. The track is wider than tall so the knob has room to run. */
const TRACK_WIDTH = 52;
const TRACK_HEIGHT = 30;
const KNOB = 24;
const KNOB_TRAVEL = TRACK_WIDTH - KNOB - 6;

export type AvailabilityToggleProps = {
  /** True when the server says this driver is ONLINE. */
  isOnline: boolean;
  /** True when availability is ON_TRIP — the server locks the switch. */
  onTrip?: boolean;
  /** True while the availability request is in flight. */
  pending?: boolean;
  /** True when the account is not APPROVED yet, so ONLINE is refused. */
  blocked?: boolean;
  onToggle: () => void;
  /** Spelled-out state, shown next to the switch. */
  labels: { online: string; offline: string; onTrip: string };
};

export function AvailabilityToggle({
  isOnline,
  onTrip = false,
  pending = false,
  blocked = false,
  onToggle,
  labels,
}: AvailabilityToggleProps) {
  const t = useTokens();
  const styles = useMemo(() => makeStyles(t), [t]);

  const progress = useRef(new Animated.Value(isOnline ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(progress, {
      toValue: isOnline ? 1 : 0,
      duration: MOTION.base,
      useNativeDriver: true,
    }).start();
  }, [isOnline, progress]);

  const knobShift = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [3, 3 + KNOB_TRAVEL],
  });

  const disabled = pending || onTrip || (blocked && !isOnline);
  const label = onTrip ? labels.onTrip : isOnline ? labels.online : labels.offline;

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: isOnline, disabled }}
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onToggle}
      style={({ pressed }) => [
        styles.wrap,
        pressed && !disabled ? styles.wrapPressed : null,
        disabled ? styles.wrapDisabled : null,
      ]}
    >
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      <View
        style={[
          styles.track,
          isOnline ? styles.trackOn : styles.trackOff,
          onTrip ? styles.trackBusy : null,
        ]}
      >
        <Animated.View
          style={[
            styles.knob,
            isOnline ? styles.knobOn : styles.knobOff,
            { transform: [{ translateX: knobShift }] },
          ]}
        >
          {pending ? (
            <ActivityIndicator
              size="small"
              color={isOnline ? t.colors.onPrimaryContainer : t.colors.onSurface}
            />
          ) : null}
        </Animated.View>
      </View>
    </Pressable>
  );
}

function makeStyles(t: Tokens) {
  return StyleSheet.create({
    wrap: {
      // Plain "row": React Native mirrors it under RTL on its own.
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      paddingVertical: SPACING.xs,
      paddingHorizontal: SPACING.md,
      borderRadius: RADIUS.full,
      backgroundColor: alpha(t.colors.surfaceContainer, 0.92),
      borderWidth: 1,
      borderColor: t.colors.outlineVariant,
      ...t.shadowCard,
    },
    wrapPressed: { opacity: 0.9 },
    wrapDisabled: { opacity: 0.6 },
    label: {
      ...typo("label-md"),
      color: t.colors.onSurface,
      maxWidth: 132,
    },
    track: {
      width: TRACK_WIDTH,
      height: TRACK_HEIGHT,
      borderRadius: RADIUS.full,
      justifyContent: "center",
      borderWidth: 1,
    },
    // Brand pink for "receiving requests" — identical in dark and light.
    trackOn: { backgroundColor: "#ff4d8d", borderColor: "#ff4d8d" },
    trackOff: {
      backgroundColor: t.colors.surfaceContainerHighest,
      borderColor: t.colors.outlineVariant,
    },
    trackBusy: {
      backgroundColor: alpha(t.semantic.money, 0.9),
      borderColor: alpha(t.semantic.money, 0.9),
    },
    knob: {
      width: KNOB,
      height: KNOB,
      borderRadius: RADIUS.full,
      alignItems: "center",
      justifyContent: "center",
    },
    knobOn: { backgroundColor: "#ffffff" },
    knobOff: { backgroundColor: t.colors.onSurfaceVariant },
  });
}

export default AvailabilityToggle;
