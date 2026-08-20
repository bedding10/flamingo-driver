import React from "react";
import { StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./auth/AuthProvider";
import { RootNavigator } from "./navigation/RootNavigator";
import { I18nProvider } from "./i18n";
import { ThemeProvider, useAppFonts, useTheme } from "./theme";

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

/**
 * PHASE 1 - the font gate.
 *
 * Nothing below this renders until `expo-font` has settled, for a concrete
 * reason: `typography.ts` resolves its family lazily, at StyleSheet-creation
 * time. If a screen mounted before the faces were ready it would build its
 * styles against the system fallback and keep them - the fonts would load and
 * then never be applied.
 *
 * It renders `null` rather than a spinner so the NATIVE splash screen stays up.
 * A spinner here would mean two loading states back to back on a cold start.
 *
 * `useAppFonts` always reaches `ready`, including when a face fails to decode.
 * A driver must be able to open the app and go online on the wrong typeface;
 * being locked out of a shift by a font is not an acceptable failure mode.
 */
function FontGate({ children }: { children: React.ReactNode }) {
  const { ready } = useAppFonts();
  if (!ready) return null;
  return <>{children}</>;
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

            PHASE 1: I18nProvider sits directly above it. Importing `./i18n` also
            settles the native layout direction at module scope, which has to
            happen before the first render - React Native cannot flip a mounted
            tree between LTR and RTL.
          */}
          <I18nProvider>
            <ThemeProvider>
              <ThemedStatusBar />
              <FontGate>
                <AuthProvider>
                  <RootNavigator />
                </AuthProvider>
              </FontGate>
            </ThemeProvider>
          </I18nProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
