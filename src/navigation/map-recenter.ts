/**
 * PHASE 1 - the recentre channel.
 *
 * The bottom navigation moved out of DriverHomeScreen so it can persist across
 * all three sections (see DriverNavigator). Its centre item is not a link to
 * another screen: when the driver is already looking at the map it recentres the
 * camera on the vehicle. That camera follow flag is local state inside the home
 * screen, and the bar no longer lives there, so the two need a channel.
 *
 * This is deliberately the smallest possible one - a single subscriber and a
 * notify - and it is the same module-level pattern `Toast.tsx` already uses for
 * `showToast`, so it is consistent with how this codebase already reaches a
 * mounted component from outside React.
 *
 * It is NOT a store: there is no state to read, no history to keep, and nothing
 * to persist. A missed recentre is a tap the driver can simply repeat.
 *
 * Exactly one subscriber is supported, because exactly one map is ever mounted.
 * A second subscriber would mean two maps, which would be the real bug.
 */

let listener: (() => void) | null = null;

/**
 * Registers the map's recentre handler. Returns the unsubscribe, so the home
 * screen can clean up on unmount and never leave a stale closure holding a
 * reference to an unmounted component.
 */
export function onRecenter(handler: () => void): () => void {
  listener = handler;
  return () => {
    // Only clear if we are still the current listener: during a fast remount the
    // new screen may have registered before the old one's cleanup runs, and
    // clearing unconditionally would silently kill the live handler.
    if (listener === handler) listener = null;
  };
}

/** Asks the mounted map to recentre. A no-op when no map is mounted. */
export function requestRecenter(): void {
  listener?.();
}
