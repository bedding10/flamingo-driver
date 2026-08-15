import { useMemo } from "react";
import { useLocationStore } from "../stores/location.store";
import type { Trip, TripStatus } from "../types/trip";

/**
 * The navigation leg drawn on the driver's map.
 *
 * This file was imported by DriverHomeScreen (as a value) and by DriverMap (as
 * a type) but never existed in the repository, which is why Metro failed to
 * resolve it and the release bundle - and therefore the whole APK build -
 * aborted at :app:createBundleReleaseJsAndAssets.
 *
 * Which leg is active is decided by the trip STATUS, never by the app's own
 * idea of where the driver is in the journey: the server owns the state
 * machine (ACCEPTED -> ARRIVING -> IN_PROGRESS) and the line must switch to
 * the drop-off point only after the backend has actually accepted Start Trip.
 *
 * The geometry itself is the direct leg between the driver's last accepted fix
 * and the end of the current leg. The device deliberately does NOT call a
 * routing provider: DRIVER_API_MAPPING.md records POST /geo/directions on the
 * server, and once its exact request/response shape is confirmed the coords
 * array below is the single place that has to change - every consumer already
 * reads `coords`, so nothing else moves.
 */

/**
 * Also the value DriverMap compares against to pick the polyline colour
 * (`route?.leg === "to_pickup"` -> gold, otherwise teal), so these two strings
 * are a contract with that component and must not be renamed on their own.
 */
export type RouteLeg = "to_pickup" | "to_destination";

/** react-native-maps coordinate shape, not the API's { lat, lng }. */
export type RouteCoord = { latitude: number; longitude: number };

export type ActiveRoute = {
  leg: RouteLeg;
  coords: RouteCoord[];
  /** End of the current leg: the passenger, then the drop-off point. */
  destination: RouteCoord | null;
};

/**
 * Mirrors the server's driver-permitted transitions. SCHEDULED, SEARCHING and
 * the terminal statuses have no leg to draw at all.
 */
const LEG_BY_STATUS: Partial<Record<TripStatus, RouteLeg>> = {
  ACCEPTED: "to_pickup",
  ARRIVING: "to_pickup",
  IN_PROGRESS: "to_destination",
};

/**
 * Trip coordinates are optional and nullable on the wire, so a partially
 * populated trip must yield no marker rather than a marker at (0, 0) - which
 * is a real place in the Atlantic and would send the camera there.
 */
function toCoord(
  lat: number | null | undefined,
  lng: number | null | undefined,
): RouteCoord | null {
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat === 0 && lng === 0) return null;
  return { latitude: lat, longitude: lng };
}

/**
 * @param trip The running trip, or null when the driver is idle.
 * @returns The leg to draw, or null when there is nothing to draw.
 */
export function useTripRoute(trip: Trip | null | undefined): ActiveRoute | null {
  const fix = useLocationStore((state) => state.fix);

  const status = trip?.status;
  const tripId = trip?.id;
  const leg = status ? LEG_BY_STATUS[status] ?? null : null;

  const target =
    leg === "to_pickup"
      ? toCoord(trip?.pickupLat, trip?.pickupLng)
      : leg === "to_destination"
        ? toCoord(trip?.destLat, trip?.destLng)
        : null;

  const originLat = fix?.lat;
  const originLng = fix?.lng;
  const targetLat = target?.latitude;
  const targetLng = target?.longitude;

  return useMemo(() => {
    if (!tripId || !leg || !target) return null;

    const origin = toCoord(originLat, originLng);

    // Without a fix there is still a destination worth showing; the line just
    // has no start yet. The map only draws a Polyline when coords.length > 1,
    // so a single-point array renders the marker alone.
    const coords = origin ? [origin, target] : [target];

    return { leg, coords, destination: target };
    // target is rebuilt every render, so the primitives are the real inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId, leg, originLat, originLng, targetLat, targetLng]);
}
