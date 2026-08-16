import React from "react";
import { StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./auth/AuthProvider";
import { RootNavigator } from "./navigation/RootNavigator";
import { ThemeProvider, useTheme } from "./theme";

/**
 * Cache policy tuned for a phone that spends the day on a mobile network:
 * a minute of freshness avoids refetching the same profile on every focus, and
 * one retry is enough because the socket is the real-time channel.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 900_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * The status bar follows the theme, so light mode does not paint white icons on
 * a white background. It is a separate component because it has to sit INSIDE
 * the provider to read the theme.
 */
function ThemedStatusBar() {
  const { mode, palette } = useTheme();
  return (
    <StatusBar
      barStyle={mode === "dark" ? "light-content" : "dark-content"}
      backgroundColor={palette.background}
    />
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          {/*
            PHASE 7.5: the theme wraps the navigator, not individual screens, so
            one switch repaints the whole app and no screen can drift out of the
            design system.
          */}
          <ThemeProvider>
            <ThemedStatusBar />
            <AuthProvider>
              <RootNavigator />
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
