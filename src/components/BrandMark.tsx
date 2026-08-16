import React from "react";
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { spacing, radius, typography, usePalette } from "../theme";

/**
 * PHASE 7.5 - the flaminGO mark.
 *
 * The emoji is gone: it rendered as a different picture on every OS version and
 * could not take the brand colour. This is a drawn flamingo silhouette (SVG,
 * pink) next to the wordmark, so the logo is one pixel-identical shape on every
 * device and needs no network request on the first frame of the map.
 *
 * The "GO" is pink; the rest of the word takes the theme's primary text colour,
 * which is what makes the same component work on the dark map overlay and on a
 * white menu surface.
 */
function FlamingoGlyph({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* neck and body in one stroke, then the beak and legs. */}
      <Path
        d="M15.5 5.5c-2.6 0-3.4 2.2-3.4 4 0 1.6-1.1 2.2-2.6 2.6-2 .5-3.5 1.7-3.5 3.9 0 2.3 2 3.5 4.6 3.5h5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M17.6 4.6l2.6 1.2-2.8.9"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M11 19.5V22M14 19.5V22"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Circle cx={15.8} cy={4.6} r={1.9} fill={color} />
    </Svg>
  );
}

export function BrandMark({
  compact = false,
  size = 18,
  style,
}: {
  /** No pill background: for use inside an already coloured surface. */
  compact?: boolean;
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const palette = usePalette();

  return (
    <View
      accessibilityRole="header"
      accessibilityLabel="flaminGO"
      style={[
        styles.row,
        compact
          ? null
          : {
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderRadius: radius.pill,
              backgroundColor: palette.overlay,
              borderWidth: 1,
              borderColor: palette.border,
            },
        style,
      ]}
    >
      <FlamingoGlyph size={size + 4} color={palette.primary} />
      <Text
        style={[styles.word, { color: palette.textPrimary, fontSize: size }]}
        numberOfLines={1}
      >
        {"flamin"}
        <Text style={{ color: palette.primaryText }}>{"GO"}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  word: {
    ...typography.label,
    letterSpacing: -0.2,
    writingDirection: "ltr",
  },
});
