import { io, Socket } from "socket.io-client";
import { AppState, type AppStateStatus } from "react-native";
import { config } from "../config";
import { tokens } from "../services/storage.service";
import {
  DRIVER_EMIT,
  DRIVER_LISTEN,
  type DriverInboundEvents,
  type DriverLocationPayload,
  type SocketStatus,
} from "../types/socket";

/**
 * One socket for the whole app, owned by the session.
 *
 * The passenger app opens a socket per trip because a passenger has one ride at
 * a time and only while a ride screen is mounted. A driver is the opposite: the
 * link must stay up for the entire online session, because `ride:offer` is
 * pushed to the driver's personal room `user:{userId}` and a missed offer is
 * lost income. So this is a single long-lived connection owned by the service,
 * never by a screen.
 *
 * The JWT is read lazily inside `auth` on every (re)connect attempt, so a token
 * refreshed by the HTTP layer is picked up automatically. No token goes in the
 * URL, where it would land in server logs.
 */

type Listener<E extends keyof DriverInboundEvents> = (
  payload: DriverInboundEvents[E],
) => void;

type StatusListener = (status: SocketStatus) => void;

let socket: Socket | null = null;
let status: SocketStatus = "idle";
let detachAppState: (() => void) | null = null;
let lastAppState: AppStateStatus = AppState.currentState;

const statusListeners = new Set<StatusListener>();

/** Trip rooms we joined, so a reconnect can re-join them. */
const joinedTrips = new Set<string>();

function setStatus(next: SocketStatus) {
  if (status === next) return;
  status = next;
  statusListeners.forEach((listener) => listener(next));
}

export function getSocketStatus(): SocketStatus {
  return status;
}

/** Subscribes to link state. Calls back immediately with the current value. */
export function onSocketStatus(listener: StatusListener): () => void {
  statusListeners.add(listener);
  listener(status);
  return () => {
    statusListeners.delete(listener);
  };
}

/**
 * Reconnects if the link is down. Safe to call at any time.
 *
 * Does nothing when no session has opened a socket yet: connecting without a
 * JWT would only produce a rejected handshake loop.
 */
export function ensureSocketConnection(): void {
  if (!socket) return;
  if (socket.connected) return;
  setStatus("connecting");
  socket.connect();
}

/**
 * Background -> foreground recovery.
 *
 * Android and iOS both suspend timers and can kill a socket while the app is
 * backgrounded, and the client often does not learn about it until the next
 * heartbeat times out. For a driver that window is exactly when a `ride:offer`
 * would be dropped, so resuming triggers an immediate reconnect attempt instead
 * of waiting for socket.io to notice.
 *
 * The socket is deliberately NOT closed when going to the background: the
 * driver must keep receiving offers with the screen off.
 */
function handleAppStateChange(next: AppStateStatus) {
  const previous = lastAppState;
  lastAppState = next;
  if (next !== "active") return;
  // "inactive" is a transient iOS state (notification shade, incoming call
  // banner); only a real return from background needs a check.
  if (previous === "active") return;
  ensureSocketConnection();
}

/** Opens the connection. Safe to call repeatedly; only one socket exists. */
export function connectSocket(): Socket {
  if (socket) {
    ensureSocketConnection();
    return socket;
  }

  socket = io(config.socket.url, {
    transports: ["websocket"],
    auth: async (callback) => {
      const stored = await tokens();
      callback({ token: stored.access });
    },
    reconnection: true,
    reconnectionDelay: config.socket.reconnectionDelayMs,
    reconnectionDelayMax: config.socket.reconnectionDelayMaxMs,
    randomizationFactor: config.socket.randomizationFactor,
  });

  setStatus("connecting");

  socket.on("connect", () => {
    setStatus("connected");
    // The gateway joins `user:{userId}` by itself; trip rooms are ours to
    // restore after a drop.
    joinedTrips.forEach((tripId) => {
      socket?.emit(DRIVER_EMIT.joinTrip, { tripId });
    });
  });

  socket.on("disconnect", () => setStatus("disconnected"));
  socket.on("connect_error", () => setStatus("disconnected"));

  lastAppState = AppState.currentState;
  const subscription = AppState.addEventListener(
    "change",
    handleAppStateChange,
  );
  detachAppState = () => subscription.remove();

  return socket;
}

/** Closes the connection and releases every listener. Used on sign-out. */
export function disconnectSocket() {
  detachAppState?.();
  detachAppState = null;
  joinedTrips.clear();
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  setStatus("idle");
}

/**
 * Subscribes to a server event. Returns an unsubscribe function; callers inside
 * React must return it from useEffect or the listener leaks across remounts.
 */
export function onSocketEvent<E extends keyof DriverInboundEvents>(
  event: E,
  listener: Listener<E>,
): () => void {
  const active = connectSocket();
  const handler = (payload: DriverInboundEvents[E]) => listener(payload);
  active.on(event as string, handler as (...args: unknown[]) => void);
  return () => {
    active.off(event as string, handler as (...args: unknown[]) => void);
  };
}

/** Joins a trip room so trip:status / trip:message arrive for that trip. */
export function joinTripRoom(tripId: string) {
  joinedTrips.add(tripId);
  connectSocket().emit(DRIVER_EMIT.joinTrip, { tripId });
}

export function leaveTripRoom(tripId: string) {
  joinedTrips.delete(tripId);
}

/** Accepts an offer. There is no HTTP equivalent; this is the only way. */
export function acceptRide(tripId: string) {
  connectSocket().emit(DRIVER_EMIT.accept, { tripId });
}

export function declineRide(tripId: string) {
  connectSocket().emit(DRIVER_EMIT.decline, { tripId });
}

/**
 * Publishes a GPS fix.
 *
 * Sent only over a live socket: buffering positions while offline would flood
 * the server with stale fixes on reconnect. A dropped fix costs nothing because
 * a fresher one is seconds away.
 */
export function sendDriverLocation(payload: DriverLocationPayload): boolean {
  if (!socket || !socket.connected) return false;
  socket.emit(DRIVER_EMIT.location, payload);
  return true;
}

export { DRIVER_EMIT, DRIVER_LISTEN };
