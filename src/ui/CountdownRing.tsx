import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { usePalette, withAlpha } from "../theme";
import { AppText } from "./AppText";

/**
 * The shrinking ring on the ride offer.
 *
 * Presentational only: `progress` comes from `useCountdown(expiresAt, totalMs)`
 * so the deadline stays the server's `expiresInMs`. The ring turns to the error
 * colour under 25% because that is the point where the driver has to decide
 * now, and a colour change is faster to read than a number while driving.
 */
export function CountdownRing({
  progress,
  label,
  size = 72,
  strokeWidth = 6,
}: {
  progress: number;
  label?: string;
  size?: number;
  strokeWidth?: number;
}) {
  const palette = usePalette();
  const ratio = Math.min(1, Math.max(0, progress));
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const color = ratio <= 0.25 ? palette.danger : palette.primary;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={withAlpha(palette.textPrimary, 0.12)}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={circumference * (1 - ratio)}
          rotation={-90}
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>
      {label ? (
        <View style={styles.center} pointerEvents="none">
          <AppText variant="title" align="center">
            {label}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
  center: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
});
