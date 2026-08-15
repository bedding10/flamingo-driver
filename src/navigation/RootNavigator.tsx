import React from "react";
import {
  DarkTheme,
  NavigationContainer,
  type Theme,
} from "@react-navigation/native";
import { useAuthStore } from "../auth/auth.store";
import { colors } from "../theme";
import { BootScreen } from "../screens/BootScreen";
import { AuthNavigator } from "./AuthNavigator";
import { DriverNavigator } from "./DriverNavigator";
import { flushPendingNavigation, navigationRef } from "./navigation-ref";

const navigationTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.gold,
    background: colors.ink,
    card: colors.surfaceDark,
    text: colors.textOnDark,
    border: colors.divider,
    notification: colors.coral,
  },
};

/**
 * Auth-gated root. Swapping the whole tree (instead of navigating) guarantees
 * no signed-in screen can survive a sign-out with stale data on it.
 */
export function RootNavigator() {
  const status = useAuthStore((state) => state.status);

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
