import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { AppState, type AppStateStatus } from "react-native";
import { config } from "../config";
import { colors } from "../theme";
import { strings } from "../i18n/strings";
import { useLocationStore } from "../stores/location.store";
import { sendDriverLocation } from "../socket/socket.service";

/**
 * GPS tracking, owned by the service and not by a screen.
 *
 * The driver's position is published over the socket as `driver:location`,
 * which is what MatchingService reads from Redis to pick a driver for a new
 * request. That means tracking is not a map feature: while it is off, the
 * driver is invisible to matching even when availability is ONLINE.
 *
 * TWO DELIVERY PATHS, ONE PUBLISHER.
 *
 * A foreground-only watcher was the previous behaviour and it had a real
 * failure mode: the driver goes online, locks the screen, Android suspends the
 * watcher, `driver:location` stops, the socket eventually drops, the gateway
 * calls removeDriverLocation() and the driver disappears from `drivers:geo`
 * while still believing they are online.
 *
 * So when the driver grants background location we use
 * `Location.startLocationUpdatesAsync` with an Android foreground service,
 * which keeps delivering while the app is backgrounded and the screen is off.
 * When they only grant foreground we keep the original `watchPositionAsync`.
 * Exactly ONE of the two runs at a time - they both feed the same `publish()`,
 * so there is no second implementation of the movement filter or the wire
 * format.
 *
 * Cadence comes from `config.tracking` and is not a guess: the server persists
 * a track point every 4 seconds (TRACK_PERSIST_INTERVAL_SEC), so sending faster
 * than that during a trip only drains the battery.
 */

/** Registered at module scope so a headless restart finds the task defined. */
export const BACKGROUND_LOCATION_TASK = "flamingo-driver-location";

export type TrackingMode = "idle" | "trip";

export type LocationPermissionResult =
  | "granted"
  | "denied"
  /** Denied and the OS will not prompt again; only Settings can fix it. */
  | "blocked"
  /** The device has location services switched off entirely. */
  | "servicesOff";

/**
 * Outcome of the background ("always") request. `declined` is the driver saying
 * no to OUR disclosure, before the OS dialog is ever shown - it is not a denial
 * by the system and must not be reported as one.
 */
export type BackgroundPermissionResult =
  | "granted"
  | "declined"
  | "denied"
  | "blocked";

/**
 * Shown before the OS prompt. Returning false means the driver refused the
 * disclosure and no background permission is requested at all.
 */
export type DisclosureFn = () => Promise<boolean>;

let subscription: Location.LocationSubscription | null = null;
let appStateSubscription: { remove: () => void } | null = null;
let lastAppState: AppStateStatus = AppState.currentState;
let activeMode: TrackingMode | null = null;
/** True while the OS-level task is the delivery path instead of the watcher. */
let backgroundActive = false;
/** Last position actually put on the wire, used for the movement filter. */
let lastSent: { lat: number; lng: number; at: number } | null = null;

function intervalFor(mode: TrackingMode): number {
  return mode === "trip"
    ? config.tracking.tripIntervalMs
    : config.tracking.idleIntervalMs;
}

/** Metres between two fixes. Haversine, inlined to avoid a dependency. */
export function distanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6_371_000;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Asks for foreground permission and reports what actually happened.
 *
 * `canAskAgain === false` is separated from a plain denial because the two need
 * different UI: one retries the prompt, the other has to send the driver to the
 * system settings, and showing the wrong one is a dead end.
 */
export async function requestLocationPermission(): Promise<LocationPermissionResult> {
  const enabled = await Location.hasServicesEnabledAsync();
  if (!enabled) {
    useLocationStore.getState().setPermission("denied");
    return "servicesOff";
  }
  const current = await Location.getForegroundPermissionsAsync();
  const result = current.granted
    ? current
    : await Location.requestForegroundPermissionsAsync();
  if (result.granted) {
    useLocationStore.getState().setPermission("granted");
    return "granted";
  }
  useLocationStore.getState().setPermission("denied");
  return result.canAskAgain ? "denied" : "blocked";
}

/**
 * Asks for background ("always") location, but only after the driver has seen
 * and accepted the in-app disclosure.
 *
 * Play Store policy requires the disclosure to come BEFORE the runtime prompt,
 * and Android will not re-prompt once refused, so firing the OS dialog without
 * context permanently burns the only chance we get.
 */
export async function requestBackgroundLocationPermission(
  disclose?: DisclosureFn,
): Promise<BackgroundPermissionResult> {
  const current = await Location.getBackgroundPermissionsAsync().catch(
    () => null,
  );
  if (current?.granted) return "granted";

  if (disclose && !(await disclose())) return "declined";

  const result = await Location.requestBackgroundPermissionsAsync().catch(
    () => null,
  );
  if (!result) return "denied";
  if (result.granted) return "granted";
  return result.canAskAgain ? "denied" : "blocked";
}

/**
 * Publishes one fix, applying the movement filter.
 *
 * A parked car still produces a new fix every interval because of GPS jitter.
 * Forwarding those would write a track of noise on the server and waste data on
 * a metered connection, so a fix under `minMoveMeters` is stored locally (the
 * map still needs it) but not sent - unless enough time passed that the server
 * would otherwise consider the driver stale.
 */
function publish(fix: {
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}) {
  useLocationStore.getState().setFix(fix);

  const mode = activeMode ?? "idle";
  const heartbeatMs = intervalFor(mode) * 3;
  if (lastSent) {
    const moved = distanceMeters(lastSent, fix);
    const aged = fix.timestamp - lastSent.at;
    if (moved < config.tracking.minMoveMeters && aged < heartbeatMs) return;
  }

  const delivered = sendDriverLocation({
    lat: fix.lat,
    lng: fix.lng,
    heading: fix.heading,
    speed: fix.speed,
  });
  // Only a delivered fix advances the marker. If the socket was down, the next
  // fix must still be sent even if the car has not moved since.
  if (delivered) lastSent = { lat: fix.lat, lng: fix.lng, at: fix.timestamp };
}

/**
 * The background task. Defined at module scope, never inside a function: the
 * OS may revive the task before any screen has mounted, and a task that is not
 * yet defined at that moment is dropped.
 *
 * Android batches fixes, so `locations` can hold several. Only the newest one
 * is published - replaying the older ones would just refight the movement
 * filter with stale timestamps.
 */
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, ({ data, error }) => {
  if (error) return;
  const locations = (data as { locations?: Location.LocationObject[] } | null)
    ?.locations;
  const position = locations?.[locations.length - 1];
  if (!position) return;
  publish({
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    heading: position.coords.heading ?? undefined,
    speed: position.coords.speed ?? undefined,
    timestamp: position.timestamp,
  });
});

/** True when the OS still has our task registered, even across a restart. */
async function backgroundTaskRunning(): Promise<boolean> {
  return Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK).catch(
    () => false,
  );
}

/**
 * Starts the OS-level updates that survive backgrounding.
 *
 * `killServiceOnDestroy: true` is deliberate: swiping the app away must end
 * tracking. A service that outlives the app is exactly the "stale background
 * task" we do not want, and it is not needed for the case this fixes (screen
 * locked / app backgrounded, process alive).
 */
async function startBackgroundUpdates(mode: TrackingMode): Promise<boolean> {
  try {
    if (await backgroundTaskRunning()) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    }
    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
      accuracy: Location.Accuracy.High,
      timeInterval: intervalFor(mode),
      distanceInterval: config.tracking.minMoveMeters,
      pausesUpdatesAutomatically: false,
      activityType: Location.ActivityType.AutomotiveNavigation,
      // iOS blue bar. The driver must be able to see that we are tracking.
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: strings.tracking.notificationTitle,
        notificationBody: strings.tracking.notificationBody,
        notificationColor: colors.gold,
        killServiceOnDestroy: true,
      },
    });
    return true;
  } catch {
    // Missing permission, unsupported device, or the service could not start.
    // The foreground watcher below still covers the app-open case.
    return false;
  }
}

async function stopBackgroundUpdates(): Promise<void> {
  try {
    if (await backgroundTaskRunning()) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    }
  } catch {
    // Already stopped, or the task was never registered on this device.
  }
  backgroundActive = false;
}

async function openWatcher(mode: TrackingMode) {
  subscription?.remove();
  subscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: intervalFor(mode),
      distanceInterval: config.tracking.minMoveMeters,
    },
    (position) => {
      publish({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        heading: position.coords.heading ?? undefined,
        speed: position.coords.speed ?? undefined,
        timestamp: position.timestamp,
      });
    },
  );
}

function closeWatcher() {
  subscription?.remove();
  subscription = null;
}

/**
 * Android kills a foreground watcher when the process is backgrounded long
 * enough, and delivers no error when it does. Coming back to the foreground
 * therefore reopens the watcher instead of trusting that it survived.
 *
 * Skipped entirely while the background task owns delivery: that path does not
 * die on backgrounding, and reopening a watcher on top of it would run two GPS
 * consumers for one driver.
 */
function handleAppStateChange(next: AppStateStatus) {
  const previous = lastAppState;
  lastAppState = next;
  if (next !== "active" || previous === "active") return;
  if (!activeMode || backgroundActive) return;
  void openWatcher(activeMode);
}

/**
 * Starts (or re-tunes) tracking. Calling it with the mode already running is a
 * no-op, so a re-render cannot restart the GPS.
 *
 * `disclose` is the in-app background-location disclosure. When it is omitted
 * no background permission is requested and behaviour is the previous
 * foreground-only one - callers opt in, tracking is never silently escalated.
 */
export async function startLocationTracking(
  mode: TrackingMode = "idle",
  options?: { disclose?: DisclosureFn },
): Promise<LocationPermissionResult> {
  const permission = await requestLocationPermission();
  if (permission !== "granted") {
    await stopLocationTracking();
    return permission;
  }

  const alreadyRunning =
    activeMode === mode && (backgroundActive || !!subscription);
  if (alreadyRunning) return "granted";

  activeMode = mode;

  // Prefer the OS task: it is the only path that keeps matching able to find
  // this driver once the screen goes off.
  const background = await requestBackgroundLocationPermission(
    options?.disclose,
  );
  if (background === "granted") {
    backgroundActive = await startBackgroundUpdates(mode);
  } else {
    await stopBackgroundUpdates();
  }

  if (backgroundActive) {
    // One delivery path only.
    closeWatcher();
  } else {
    await openWatcher(mode);
  }

  if (!appStateSubscription) {
    lastAppState = AppState.currentState;
    appStateSubscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );
  }

  // One immediate fix so the map is not empty for a whole interval and matching
  // knows where the driver is the moment they go online.
  try {
    const position = await Location.getLastKnownPositionAsync();
    if (position) {
      publish({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        heading: position.coords.heading ?? undefined,
        speed: position.coords.speed ?? undefined,
        timestamp: position.timestamp,
      });
    }
  } catch {
    // A missing cached fix is normal on a cold device; the watcher will deliver.
  }

  return "granted";
}

/**
 * Stops tracking and releases the OS listener. Safe to call when idle.
 *
 * Must be reached on BOTH ways out of an online session - going OFFLINE and
 * signing out - or the foreground service notification stays on the driver's
 * status bar with no session behind it.
 */
export async function stopLocationTracking(): Promise<void> {
  closeWatcher();
  appStateSubscription?.remove();
  appStateSubscription = null;
  activeMode = null;
  lastSent = null;
  await stopBackgroundUpdates();
}

export function trackingMode(): TrackingMode | null {
  return activeMode;
}

/** True while the OS task (not the in-app watcher) is delivering fixes. */
export function isBackgroundTrackingActive(): boolean {
  return backgroundActive;
}
