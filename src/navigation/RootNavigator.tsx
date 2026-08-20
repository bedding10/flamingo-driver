import React, { useMemo } from "react";
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  type Theme,
} from "@react-navigation/native";
import { useAuthStore } from "../auth/auth.store";
import { useTheme } from "../theme";
import { BootScreen } from "../screens/BootScreen";
import { AuthNavigator } from "./AuthNavigator";
import { DriverNavigator } from "./DriverNavigator";
import { flushPendingNavigation, navigationRef } from "./navigation-ref";

/**
 * Auth-gated root. Swapping the whole tree (instead of navigating) guarantees
 * no signed-in screen can survive a sign-out with stale data on it.
 *
 * PHASE 1 - TWO THINGS WERE WRONG HERE
 *
 * 1. The navigation theme hardcoded `primary: colors.gold`. Gold is not a
 *    flaminGO brand accent (section 7), and this is the value React Navigation
 *    uses for header tints and the back affordance, so the banned colour was
 *    sitting in the app's chrome on every pushed screen.
 *
 * 2. It always used `DarkTheme`, so the navigator's own surfaces stayed dark
 *    even when the driver had chosen light mode. Light mode existed in the
 *    palette and was contradicted by the navigator.
 *
 * The theme is now derived from the active palette and follows the mode, so
 * there is exactly one source of colour for both the screens and the chrome.
 */
export function RootNavigator() {
  const status = useAuthStore((state) => state.status);
  const { mode, palette } = useTheme();

  const navigationTheme = useMemo<Theme>(() => {
    const base = mode === "light" ? DefaultTheme : DarkTheme;
    return {
      ...base,
      dark: mode === "dark",
      colors: {
        ...base.colors,
        // Brand pink for text and icons - `primaryText`, not the filled pink
        // surface, because this value tints glyphs and labels.
        primary: palette.primaryText,
        background: palette.background,
        card: palette.surface,
        text: palette.textPrimary,
        border: palette.border,
        notification: palette.primary,
      },
    };
  }, [mode, palette]);

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={navigationTheme}
      // A notification tapped from a killed app is delivered before this tree
      // mounts; the parked route is replayed here.
      onReady={flushPendingNavigation}
    >
      {status === "loading" ? (
        <BootScreen />
      ) : status === "authenticated" ? (
        <DriverNavigator />
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
}
