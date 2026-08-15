import { createNavigationContainerRef } from "@react-navigation/native";
import type { DriverStackParamList } from "./types";

/**
 * Navigation handle for code that runs outside React.
 *
 * push.service.ts needs to open a screen when a notification is tapped, and
 * that handler can fire before any component has mounted (cold start from a
 * killed app). A ref is the only way to reach the navigator from there.
 *
 * This is NOT a second navigation system: RootNavigator still owns the single
 * NavigationContainer, this only points at it.
 */
export const navigationRef =
  createNavigationContainerRef<DriverStackParamList>();

/**
 * A cold start delivers the tapped notification before mount, so the target is
 * parked here and replayed by RootNavigator on ready. Only one pending target
 * is kept: if two notifications are queued, the last tap wins, which is what
 * the driver expects.
 */
let pending: { name: keyof DriverStackParamList; params?: object } | null =
  null;

export function navigateWhenReady<Name extends keyof DriverStackParamList>(
  name: Name,
  params?: DriverStackParamList[Name],
): void {
  if (navigationRef.isReady()) {
    // @ts-expect-error - the name/params pair is correct at every call site;
    // the ref overloads cannot express that relation through this wrapper.
    navigationRef.navigate(name, params);
    return;
  }
  pending = { name, params: params as object | undefined };
}

/** Called by RootNavigator once the container reports ready. */
export function flushPendingNavigation(): void {
  if (!pending || !navigationRef.isReady()) return;
  const target = pending;
  pending = null;
  // @ts-expect-error - see navigateWhenReady.
  navigationRef.navigate(target.name, target.params);
}
