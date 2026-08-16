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
import { readStoredThemeMode, storeThemeMode } from "./themeStorage";

/**
 * PHASE 7.5 - the theme container.
 *
 * There are TWO themes, dark and light. There is no "system" option in the
 * state - `mode` is always exactly "dark" or "light". The device colour scheme
 * only decides the FIRST value for a driver who has never chosen, and it is
 * ignored from the moment a choice exists.
 *
 * PHASE 7.5 CLOSURE: the choice is now written to MMKV and read back
 * synchronously on mount, so it survives closing the app and the first frame
 * never flashes the wrong theme.
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
  const [mode, setModeState] = useState<ThemeMode>(
    () => readStoredThemeMode() ?? (device === "light" ? "light" : "dark"),
  );

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    storeThemeMode(next);
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((current) => {
      const next: ThemeMode = current === "dark" ? "light" : "dark";
      storeThemeMode(next);
      return next;
    });
  }, []);

  // Memoised so a GPS fix re-rendering the map screen never re-creates the
  // context value and re-renders every consumer with it.
  const value = useMemo<ThemeContextValue>(
    () => ({ mode, palette: paletteFor(mode), setMode, toggleMode }),
    [mode, setMode, toggleMode],
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
