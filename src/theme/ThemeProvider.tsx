import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useColorScheme } from "react-native";
import {
  DARK_PALETTE,
  paletteFor,
  type Palette,
  type ThemeMode,
} from "./palettes";

/**
 * PHASE 7.5 - the theme container.
 *
 * There are TWO themes, dark and light. Reading the device colour scheme is how
 * the FIRST value is chosen; it is not a third theme, and there is no "system"
 * option anywhere in the state - `mode` is always exactly "dark" or "light".
 *
 * The driver can flip it from the menu. The choice is held in memory for this
 * session and is deliberately NOT persisted yet: the only storage helper in the
 * app is the secure store used for auth tokens, and putting a cosmetic
 * preference next to credentials for the sake of one boolean is the wrong
 * trade. Persistence is a small, separate change (documented in the report).
 */
type ThemeContextValue = {
  mode: ThemeMode;
  palette: Palette;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  mode: "dark",
  palette: DARK_PALETTE,
  setMode: () => undefined,
  toggleMode: () => undefined,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const device = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>(
    device === "light" ? "light" : "dark",
  );

  const toggleMode = useCallback(
    () => setMode((current) => (current === "dark" ? "light" : "dark")),
    [],
  );

  // Memoised so a GPS fix re-rendering the map screen never re-creates the
  // context value and re-renders every consumer with it.
  const value = useMemo<ThemeContextValue>(
    () => ({ mode, palette: paletteFor(mode), setMode, toggleMode }),
    [mode, toggleMode],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

/** Shorthand for the common case of only needing the colours. */
export function usePalette(): Palette {
  return useContext(ThemeContext).palette;
}
