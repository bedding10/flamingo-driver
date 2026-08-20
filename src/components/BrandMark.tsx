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
import { rowNeverMirrored } from "../i18n";

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
 *
 * PHASE 1 (R-11) - WHY THIS ROW MUST NOT MIRROR
 * A brand lockup is artwork, not content. "flaminGO" is a latin wordmark and the
 * glyph belongs on a fixed side of it, so the pair has to look identical in
 * Arabic, French and English. React Native mirrors plain `flexDirection: "row"`
 * once the layout is RTL, which would have thrown the flamingo to the other side
 * of the word in Arabic. `rowNeverMirrored()` pins it.
 *
 * This is the one place where reversing the row by hand is CORRECT, and it is
 * the opposite of the fix applied to the content rows elsewhere in this phase -
 * hence the helper's name, so the intent is unmistakable at a glance.
 *
 * `writingDirection: "ltr"` on the word is the matching guarantee for the text
 * itself: the brand never reflows, whatever the surrounding paragraph does.
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
  row: {
    // Deliberately reversed under RTL so the lockup stays visually identical.
    flexDirection: rowNeverMirrored(),
    alignItems: "center",
    gap: spacing.xs,
  },
  word: {
    ...typography.label,
    letterSpacing: -0.2,
    writingDirection: "ltr",
  },
});
