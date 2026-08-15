import * as SecureStore from "expo-secure-store";
import { MMKV } from "react-native-mmkv";

/**
 * Two storage tiers with a hard boundary between them.
 *
 * SECURE (expo-secure-store -> Keychain / Android Keystore) is the ONLY place
 * credentials live: the backend access token, the backend refresh token, and
 * anything Firebase-issued. A leaked driver refresh token lets an attacker go
 * online and take rides as that driver, so plaintext storage is not an option.
 *
 * CACHE (MMKV) is for non-sensitive local data only: last map camera, display
 * preferences, the last known driver profile. MMKV is unencrypted here on
 * purpose - it is fast and synchronous, which is why it must never hold a
 * credential.
 *
 * The boundary is enforced in code below, not by convention, so a future
 * careless commit cannot quietly put a token in MMKV.
 */
const mmkv = new MMKV({ id: "flamingo-driver-cache" });

const ACCESS_KEY = "session.access";
const REFRESH_KEY = "session.refresh";

const secureOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

// ---------------------------------------------------------------------------
// Secure tier: tokens
// ---------------------------------------------------------------------------

export type SessionTokens = { access: string | null; refresh: string | null };

export async function saveTokens(access: string, refresh: string) {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_KEY, access, secureOptions),
    SecureStore.setItemAsync(REFRESH_KEY, refresh, secureOptions),
  ]);
}

export async function tokens(): Promise<SessionTokens> {
  const [access, refresh] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_KEY),
    SecureStore.getItemAsync(REFRESH_KEY),
  ]);
  return { access, refresh };
}

export async function clearTokens() {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_KEY),
    SecureStore.deleteItemAsync(REFRESH_KEY),
  ]);
}

/** Generic secure slot, for future secrets that are not the session tokens. */
export async function saveSecureValue(key: string, value: string) {
  await SecureStore.setItemAsync(key, value, secureOptions);
}

export async function readSecureValue(key: string): Promise<string | null> {
  return SecureStore.getItemAsync(key);
}

export async function deleteSecureValues(...keys: string[]) {
  await Promise.all(keys.map((key) => SecureStore.deleteItemAsync(key)));
}

// ---------------------------------------------------------------------------
// Cache tier: non-sensitive only, enforced
// ---------------------------------------------------------------------------

/** Keys that look like a credential are rejected outright. */
const FORBIDDEN_CACHE_KEY =
  /token|password|secret|credential|jwt|refresh|idtoken|bearer|apikey/i;

function assertCacheKey(key: string) {
  if (FORBIDDEN_CACHE_KEY.test(key)) {
    throw new Error(
      `Refusing to write "${key}" to the unencrypted cache. Credentials belong in secure storage (saveTokens / saveSecureValue).`
    );
  }
}

export function readCachedJson<T>(key: string): T | null {
  const raw = mmkv.getString(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    // Corrupt entry: drop it rather than crash a screen on every launch.
    mmkv.delete(key);
    return null;
  }
}

export function writeCachedJson(key: string, value: unknown) {
  assertCacheKey(key);
  mmkv.set(key, JSON.stringify(value));
}

export function readCachedString(key: string): string | null {
  return mmkv.getString(key) ?? null;
}

export function writeCachedString(key: string, value: string) {
  assertCacheKey(key);
  mmkv.set(key, value);
}

export function deleteCached(key: string) {
  mmkv.delete(key);
}

/** Wipes local cache. Tokens are NOT here; use clearTokens for those. */
export function clearCache() {
  mmkv.clearAll();
}

/** The complete list of cache keys, so nothing is written ad hoc. */
export const CACHE_KEYS = {
  driverProfile: "driver.profile",
  lastCamera: "map.lastCamera",
  locale: "app.locale",
} as const;
