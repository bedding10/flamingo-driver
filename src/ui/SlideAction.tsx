import React, { useMemo, useRef, useState } from "react";
import {
  Animated,
  PanResponder,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import {
  iconSize,
  radius,
  spacing,
  touchTarget,
  usePalette,
  withAlpha,
} from "../theme";
import { Icon } from "../components/Icon";
import { AppText } from "./AppText";

const THUMB = 56;
const PAD = 8;
/** Fraction of the track that must be crossed before it fires. */
const THRESHOLD = 0.85;

/**
 * Slide to confirm.
 *
 * Used for the irreversible steps of a trip - start and complete - which the
 * server cannot undo and which are pressed by someone holding a steering
 * wheel. A tap is too easy to do by accident there; a deliberate drag is not.
 *
 * The thumb sits at the RIGHT edge and is dragged LEFT, following the reading
 * direction of the app. `dx` is therefore negative and is inverted here.
 *
 * Built on PanResponder + Animated from React Native core on purpose: this is a
 * small interaction, and core Animated has no version coupling to Reanimated or
 * Gesture Handler.
 */
export function SlideAction({
  label,
  onConfirm,
  disabled = false,
  tone = "primary",
  style,
}: {
  label: string;
  onConfirm: () => void;
  disabled?: boolean;
  tone?: "primary" | "success";
  style?: StyleProp<ViewStyle>;
}) {
  const palette = usePalette();
  const [width, setWidth] = useState(0);

  const x = useRef(new Animated.Value(0)).current;
  const travel = Math.max(0, width - THUMB - PAD * 2);
  const color = tone === "success" ? palette.online : palette.primary;

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled && travel > 0,
        onMoveShouldSetPanResponder: () => !disabled && travel > 0,

        onPanResponderMove: (_event, gesture) => {
          // Dragging left produces a negative dx; clamp to the track.
          const moved = Math.min(Math.max(-gesture.dx, 0), travel);
          x.setValue(-moved);
        },

        onPanResponderRelease: (_event, gesture) => {
          const moved = Math.min(Math.max(-gesture.dx, 0), travel);
          if (moved >= travel * THRESHOLD) {
            Animated.timing(x, {
              toValue: -travel,
              duration: 120,
              useNativeDriver: true,
            }).start(() => {
              onConfirm();
              // Spring back so the control is reusable if the parent keeps it
              // mounted (a failed request leaves the trip in the same state).
              Animated.spring(x, {
                toValue: 0,
                useNativeDriver: true,
                bounciness: 0,
              }).start();
            });
            return;
          }
          Animated.spring(x, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 6,
          }).start();
        },

        onPanResponderTerminate: () => {
          Animated.spring(x, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 6,
          }).start();
        },
      }),
    [disabled, onConfirm, travel, x],
  );

  // The label fades out as the thumb covers it.
  const labelOpacity =
    travel > 0
      ? x.interpolate({
          inputRange: [-travel, 0],
          outputRange: [0, 1],
        })
      : 1;

  return (
    <View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={[
        styles.track,
        {
          backgroundColor: withAlpha(color, 0.14),
          borderColor: withAlpha(color, 0.35),
        },
        disabled ? styles.disabled : null,
        style,
      ]}
    >
      <Animated.View style={[styles.labelWrap, { opacity: labelOpacity }]}>
        <AppText variant="subtitle" align="center" style={{ color }}>
          {label}
        </AppText>
      </Animated.View>

      <Animated.View
        {...responder.panHandlers}
        style={[
          styles.thumb,
          { backgroundColor: color, transform: [{ translateX: x }] },
        ]}
      >
        <Icon
          name="chevron"
          size={iconSize.lg}
          color={palette.onPrimary}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: touchTarget.critical,
    borderRadius: radius.pill,
    borderWidth: 1,
    padding: PAD,
    justifyContent: "center",
    // The thumb rests at the physical right edge.
    alignItems: "flex-end",
  },
  labelWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: { opacity: 0.5 },
});
