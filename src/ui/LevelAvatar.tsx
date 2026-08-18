import React, { useMemo } from "react";
import { Image, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  LEVEL_TINTS,
  radius,
  STITCH_DARK,
  usePalette,
  type Palette,
} from "../theme";
import { AppText } from "./AppText";

/** BRONZE | SILVER | GOLD | DIAMOND | LEGENDARY, straight from the tokens. */
export type DriverLevel = keyof typeof LEVEL_TINTS;

const initialsOf = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("");

/**
 * The driver avatar with its status ring.
 *
 * This is the ONE place gold is allowed: a 2px tier ring. Legendary is the
 * pink->navy gradient from the reference, which is why it needs a gradient ring
 * rather than a border colour.
 */
export function LevelAvatar({
  name,
  uri,
  level,
  size = 56,
}: {
  name: string;
  uri?: string | null;
  level?: DriverLevel;
  size?: number;
}) {
  const palette = usePalette();
  const styles = useMemo(() => makeStyles(palette), [palette]);

  const inner = (
    <View
      style={[
        styles.inner,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
      ) : (
        <AppText variant="subtitle" tone="secondary" align="center">
          {initialsOf(name) || "?"}
        </AppText>
      )}
    </View>
  );

  if (!level) return inner;

  if (level === "LEGENDARY") {
    return (
      <LinearGradient
        colors={[STITCH_DARK.primaryContainer, "#131B2E"] as const}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.ring, { borderRadius: (size + 8) / 2, padding: 2 }]}
      >
        {inner}
      </LinearGradient>
    );
  }

  return (
    <View
      style={[
        styles.ring,
        {
          borderRadius: (size + 8) / 2,
          borderWidth: 2,
          borderColor: LEVEL_TINTS[level],
          padding: 2,
        },
      ]}
    >
      {inner}
    </View>
  );
}

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    ring: { alignSelf: "flex-start", borderRadius: radius.pill },
    inner: {
      backgroundColor: palette.surfaceRaised,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
  });
