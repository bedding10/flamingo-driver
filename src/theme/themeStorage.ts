import { MMKV } from "react-native-mmkv";
import type { ThemeMode } from "./palettes";

/**
 * PHASE 7.5 CLOSURE - where the light/dark choice lives between sessions.
 *
 * MMKV is used rather than SecureStore for two reasons: it is synchronous, so
 * the very first frame already renders in the chosen theme instead of flashing
 * dark and correcting itself, and a cosmetic preference has no business sitting
 * in the encrypted store next to auth tokens.
 *
 * Every call is wrapped: a device where the native store fails to initialise
 * must still open the app. In that case the theme simply follows the device
 * scheme for the session and nothing is persisted.
 */
const STORAGE_ID = "flamingo-driver-prefs";
const THEME_KEY = "ui.themeMode";

let store: MMKV | null = null;

try {
  store = new MMKV({ id: STORAGE_ID });
} catch {
  // Best effort only - see the note above.
  store = null;
}

export function readStoredThemeMode(): ThemeMode | null {
  try {
    const raw = store?.getString(THEME_KEY);
    return raw === "light" || raw === "dark" ? raw : null;
  } catch {
    return null;
  }
}

export function storeThemeMode(mode: ThemeMode): void {
  try {
    store?.set(THEME_KEY, mode);
  } catch {
    // Persistence is best effort; the session still renders correctly.
  }
}
