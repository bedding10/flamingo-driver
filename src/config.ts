import * as Application from "expo-application";

/**
 * The single place that reads the environment.
 *
 * Same style as the passenger app: values come from EXPO_PUBLIC_* variables and
 * a missing critical one throws at import time, so the app fails on the first
 * frame instead of failing later on a request the driver depends on.
 *
 * No secret belongs here. EXPO_PUBLIC_* variables are inlined into the JS
 * bundle by Metro, which means anyone with the APK can read them. Only public
 * endpoints and feature flags live in this file; the Google Maps keys and the
 * Firebase files are native config injected at build time.
 */

export type Environment = "development" | "preview" | "production";

const rawApiUrl = process.env.EXPO_PUBLIC_API_URL;
if (!rawApiUrl) throw new Error("EXPO_PUBLIC_API_URL is required");

/** Trailing slashes break path joining ("//driver/me"), so they are stripped. */
const apiUrl = rawApiUrl.replace(/\/+$/, "");

/**
 * Socket.IO attaches to the ORIGIN, not to the /api prefix. It is derived from
 * the API URL by default so a deployment can never point the two at different
 * hosts by accident, and can still be overridden when the realtime service is
 * split off.
 */
const socketUrl = (
  process.env.EXPO_PUBLIC_SOCKET_URL ?? apiUrl.replace(/\/api$/, "")
).replace(/\/+$/, "");

const environment: Environment =
  (process.env.EXPO_PUBLIC_ENV as Environment | undefined) ??
  (__DEV__ ? "development" : "production");

export const config = {
  environment,
  isDev: __DEV__,

  api: {
    url: apiUrl,
    /** Matches the passenger app; a driver on 3G needs this much headroom. */
    timeoutMs: 15_000,
  },

  socket: {
    url: socketUrl,
    reconnectionDelayMs: 800,
    reconnectionDelayMaxMs: 8_000,
    randomizationFactor: 0.35,
  },

  /**
   * Firebase capability flags.
   *
   * `phoneAuth` is the ONLY supported sign-in path: the server's local OTP
   * endpoints are disabled and issue no tokens. `emailLink` exists in the
   * passenger app and is deliberately off here - a driver signs in with the
   * phone number the fleet is registered under.
   */
  firebase: {
    phoneAuth: true,
    messaging: true,
    emailLink: false,
    /** Crash reports from a debug build are noise, not signal. */
    crashlytics: !__DEV__,
  },

  app: {
    /**
     * Native values, so what is reported is what the store actually installed.
     * They are null in Expo Go, hence the fallbacks.
     */
    version: Application.nativeApplicationVersion ?? "0.1.0",
    build: Application.nativeBuildVersion ?? null,
    bundleId: Application.applicationId ?? "com.flamingo.driver",
  },

  /**
   * GPS cadence, kept here so Phase 5 has one place to tune it. The server
   * persists a track point every 4 seconds (TRACK_PERSIST_INTERVAL_SEC), so
   * sending faster than that during a trip buys nothing and costs battery.
   */
  tracking: {
    idleIntervalMs: 9_000,
    tripIntervalMs: 4_500,
    minMoveMeters: 8,
  },
} as const;

export type Config = typeof config;
