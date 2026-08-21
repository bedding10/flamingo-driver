import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { COLORS, ICON_SIZE, RADIUS, SPACING, typo } from "../theme/tokens";

/**
 * Component 5 - Route timeline.
 * A 2px surface-variant connector between a pickup dot and a destination pin,
 * each inside a 24px primary-container-outlined circle, with label/value pairs.
 */
export type RouteTimelineProps = {
  pickupLabel?: string;
  pickup: string;
  destinationLabel?: string;
  destination: string;
};

export function RouteTimeline({
  pickupLabel = "Pickup",
  pickup,
  destinationLabel = "Destination",
  destination,
}: RouteTimelineProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.connector} />

      <View style={styles.row}>
        <View style={styles.marker}>
          <View style={styles.dot} />
        </View>
        <View style={styles.text}>
          <Text style={styles.label}>{pickupLabel}</Text>
          <Text style={styles.value} numberOfLines={1}>
            {pickup}
          </Text>
        </View>
      </View>

      <View style={[styles.row, styles.lastRow]}>
        <View style={styles.marker}>
          <MaterialIcons
            name="place"
            size={ICON_SIZE.sm}
            color={COLORS.primaryContainer}
          />
        </View>
        <View style={styles.text}>
          <Text style={styles.label}>{destinationLabel}</Text>
          <Text style={styles.value} numberOfLines={1}>
            {destination}
          </Text>
        </View>
      </View>
    </View>
  );
}

const MARKER = 24;

const styles = StyleSheet.create({
  wrap: { position: "relative" },
  connector: {
    position: "absolute",
    left: MARKER / 2 - 1,
    top: MARKER,
    bottom: MARKER,
    width: 2,
    backgroundColor: COLORS.surfaceVariant,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  lastRow: { marginBottom: 0 },
  marker: {
    width: MARKER,
    height: MARKER,
    borderRadius: RADIUS.full,
    borderWidth: 2,
    borderColor: COLORS.primaryContainer,
    backgroundColor: COLORS.surfaceContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryContainer,
  },
  text: { flex: 1 },
  label: {
    ...typo("labelSm"),
    color: COLORS.onSurfaceVariant,
    marginBottom: 2,
  },
  value: { ...typo("bodyMd"), color: COLORS.onSurface },
});
