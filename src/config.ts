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

/**
 * PHASE 2 - public media host (Cloudflare R2).
 *
 * The map marker artwork lives in the same public bucket the backend serves
 * media from, so it is fetched directly instead of through an authenticated
 * endpoint: a marker is not private data, and routing it through the API would
 * add a signed-URL round trip to the very first frame of the map.
 *
 * It is overridable through EXPO_PUBLIC_R2_PUBLIC_URL and NOT required, because
 * the bucket host is a deployment detail rather than a secret and a missing
 * variable must not stop the app from starting. The default matches the
 * project's existing R2_PUBLIC_URL; nothing here changes that value.
 */
const mediaBaseUrl = (
  process.env.EXPO_PUBLIC_R2_PUBLIC_URL ??
  "https://pub-7fa9666bc2604d239dd2f616f8c85a62.r2.dev"
).replace(/\/+$/, "");

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
   * Public media. Object keys are the ones already uploaded to the bucket and
   * must stay byte-identical to them, capital "Car/" included.
   */
  media: {
    publicBaseUrl: mediaBaseUrl,
    vehicleMarkers: {
      car: "Car/vehicle-car.png",
      moto: "Car/vehicle-moto.png",
    },
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
