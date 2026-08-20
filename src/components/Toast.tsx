import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  motion,
  radius,
  shadows,
  spacing,
  typography,
  usePalette,
} from "../theme";

/**
 * PHASE 7 - transient feedback. PHASE 7.5 - theme-aware, pink for neutral tone.
 *
 * Everything that succeeded used to be announced with Alert.alert(), which
 * blocks the screen and needs a tap to dismiss. On the map that is dangerous: a
 * driver must not have to acknowledge a dialog to see the road again. A toast
 * says the same thing without stealing the touch surface, so Alert is kept only
 * for decisions (sign out, delete) and for real failures that need reading.
 *
 * The host is mounted once, above the navigator, and reached through a
 * module-level `showToast()` so a service or an api layer can report without
 * being handed a React context.
 *
 * PHASE 1 (R-11): the text is centred, which is direction-neutral, so the
 * `writingDirection: "rtl"` that used to sit beside it - and would have forced
 * Arabic bidi resolution onto French and English - has been removed.
 */

export type ToastTone = "info" | "success" | "error";

type ToastMessage = { id: number; text: string; tone: ToastTone };

let deliver: ((message: ToastMessage) => void) | null = null;
let counter = 0;

/** Shows a toast. A no-op when no host is mounted, never a crash. */
export function showToast(text: string, tone: ToastTone = "info"): void {
  counter += 1;
  deliver?.({ id: counter, text, tone });
}

const VISIBLE_MS = 3200;

export function ToastHost() {
  const insets = useSafeAreaInsets();
  const palette = usePalette();
  const [message, setMessage] = useState<ToastMessage | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    deliver = (next) => setMessage(next);
    return () => {
      deliver = null;
    };
  }, []);

  useEffect(() => {
    if (!message) return;
    opacity.setValue(0);
    Animated.timing(opacity, {
      toValue: 1,
      duration: motion.fast,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: motion.base,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setMessage(null);
      });
    }, VISIBLE_MS);

    return () => clearTimeout(timer);
  }, [message, opacity]);

  if (!message) return null;

  const tint =
    message.tone === "success"
      ? palette.online
      : message.tone === "error"
        ? palette.danger
        : palette.primaryText;

  return (
    <Animated.View
      // Purely informational: it must never swallow a tap meant for the map.
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={[
        styles.host,
        {
          opacity,
          backgroundColor: palette.surface,
          borderColor: tint,
          bottom: insets.bottom + spacing["4xl"] * 2,
        },
      ]}
    >
      <Text style={[styles.text, { color: tint }]}>{message.text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    left: spacing.xl,
    right: spacing.xl,
    borderRadius: radius.card,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...shadows.floating,
  },
  text: {
    ...typography.subtitle,
    textAlign: "center",
  },
});
