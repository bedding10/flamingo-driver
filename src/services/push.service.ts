import { PermissionsAndroid, Platform } from "react-native";
import {
  AuthorizationStatus,
  getInitialNotification,
  getMessaging,
  getToken,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
  requestPermission,
} from "@react-native-firebase/messaging";
import { registerDevice, unregisterDevice } from "../api/driver.api";
import { navigateWhenReady } from "../navigation/navigation-ref";

let currentToken: string | null = null;
let detachRefresh: (() => void) | null = null;
let detachForeground: (() => void) | null = null;
let detachOpened: (() => void) | null = null;

/**
 * Routes a tapped notification to the screen it is about.
 *
 * The server side of this contract is NotificationDispatcher: trip messages are
 * dispatched with `data.type = "TRIP_MESSAGE"` and `data.tripId`. The check is
 * on `data`, not on the title text, so re-wording the Arabic copy can never
 * break navigation.
 *
 * Unknown types are ignored on purpose: opening the app is already the right
 * behaviour for a notification this build does not understand, and guessing a
 * destination is worse than landing on Home.
 */
function routeFromData(data?: Record<string, unknown> | null): void {
  if (!data) return;
  if (data.type !== "TRIP_MESSAGE") return;
  const tripId = typeof data.tripId === "string" ? data.tripId : null;
  if (!tripId) return;
  navigateWhenReady("TripChat", { tripId });
}

/**
 * Registers this device to receive `ride:offer` pushes.
 *
 * The socket (socket.service.ts) is the primary channel: it is what renders
 * the offer card the instant the app is open. This is the fallback for the
 * window the OS suspends that socket in the background - Android does this
 * aggressively (MIUI especially), and a driver with the screen off must
 * still be alerted. The backend sends an FCM `notification` payload, so the
 * OS displays it on its own; this only needs to get a token to the server.
 *
 * Best-effort by design: a driver who denies the permission, or a device
 * with no Google Play services, still gets every offer the socket delivers.
 * Nothing here may throw into the caller - AuthProvider fires this on
 * sign-in and must never fail a session over a push token.
 */
export async function registerPushToken(): Promise<void> {
  try {
    if (Platform.OS === "android" && Number(Platform.Version) >= 33) {
      // Below API 33 the app is allowed to post notifications with no
      // runtime grant; asking anyway would just be a silent no-op, so the
      // version check only exists to document that this isn't skipped.
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
    } else if (Platform.OS === "ios") {
      const authStatus = await requestPermission(getMessaging());
      const granted =
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL;
      if (!granted) return;
    }

    const token = await getToken(getMessaging());
    await syncToken(token);

    detachRefresh?.();
    detachRefresh = onTokenRefresh(getMessaging(), (next) => {
      void syncToken(next);
    });

    // Foreground messages are never auto-displayed by the OS on either
    // platform. For ride offers the socket already renders the offer card, so
    // nothing is needed. This used to be a no-op for EVERYTHING, which was
    // correct only while offers were the only push the server sent.
    //
    // It is still not a display surface: a driver reading the chat does not
    // need a banner for the message already on screen, and TripChatScreen owns
    // the live update over `trip:message`. This stays quiet by design.
    detachForeground?.();
    detachForeground = onMessage(getMessaging(), async () => undefined);

    // Tapped while the app was backgrounded.
    detachOpened?.();
    detachOpened = onNotificationOpenedApp(getMessaging(), (message) => {
      routeFromData(message?.data as Record<string, unknown> | undefined);
    });

    // Tapped while the app was killed: the notification that started the
    // process is only readable once, here.
    const initial = await getInitialNotification(getMessaging());
    if (initial) {
      routeFromData(initial.data as Record<string, unknown> | undefined);
    }
  } catch {
    // Permission denied, Play services missing, token fetch failed over a
    // bad network - the socket still works without a registered token.
  }
}

async function syncToken(token: string): Promise<void> {
  if (token === currentToken) return;
  currentToken = token;
  try {
    await registerDevice({ token, platform: Platform.OS });
  } catch {
    currentToken = null;
  }
}

/**
 * Called on sign-out so a stale token does not keep offering rides to
 * whichever driver logs into this phone next.
 */
export async function unregisterPushToken(): Promise<void> {
  detachRefresh?.();
  detachRefresh = null;
  detachForeground?.();
  detachForeground = null;
  detachOpened?.();
  detachOpened = null;
  if (!currentToken) return;
  const token = currentToken;
  currentToken = null;
  await unregisterDevice(token).catch(() => undefined);
}
