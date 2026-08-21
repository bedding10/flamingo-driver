import { MaterialIcons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { RADIUS, SPACING, typo } from "../theme/tokens";
import { useTokens, type Tokens } from "../theme/useTokens";

/**
 * Component 5 - Route timeline.
 * A 2px surface-variant connector between a pickup dot and a destination pin,
 * each inside a 24px outlined circle, with label/value pairs.
 *
 * COLOUR MEANING: pickup is pink (primary), destination is the tertiary light
 * blue the design system reserves for destination markers. Two identical
 * markers is how a driver reads the wrong address at a junction.
 */
export type RouteTimelineProps = {
  pickupLabel?: string;
  pickup: string;
  destinationLabel?: string;
  destination: string;
};

const MARKER = 24;

export function RouteTimeline({
  pickupLabel = "نقطة الانطلاق",
  pickup,
  destinationLabel = "الوجهة",
  destination,
}: RouteTimelineProps) {
  const t = useTokens();
  const styles = useMemo(() => makeStyles(t), [t]);

  return (
    <View style={styles.wrap}>
      <View style={styles.connector} />

      <View style={styles.row}>
        <View style={[styles.marker, styles.markerPickup]}>
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
        <View style={[styles.marker, styles.markerDest]}>
          <MaterialIcons
            name="place"
            size={t.iconSize.sm}
            color={t.colors.tertiary}
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

function makeStyles(t: Tokens) {
  return StyleSheet.create({
    wrap: { position: "relative" },
    connector: {
      position: "absolute",
      left: MARKER / 2 - 1,
      top: MARKER,
      bottom: MARKER,
      width: 2,
      backgroundColor: t.colors.surfaceVariant,
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
      backgroundColor: t.colors.surfaceContainer,
      alignItems: "center",
      justifyContent: "center",
    },
    markerPickup: { borderColor: t.colors.primaryContainer },
    markerDest: { borderColor: t.colors.tertiary },
    dot: {
      width: 8,
      height: 8,
      borderRadius: RADIUS.full,
      backgroundColor: t.colors.primaryContainer,
    },
    text: { flex: 1 },
    label: {
      ...typo("labelSm"),
      color: t.colors.onSurfaceVariant,
      marginBottom: 2,
    },
    value: { ...typo("bodyMd"), color: t.colors.onSurface },
  });
}
