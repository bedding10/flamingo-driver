import type { RideClass } from "./driver";

/**
 * TripStatus is the Prisma enum, verbatim. SEARCHING_DRIVER, DRIVER_ACCEPTED,
 * DRIVER_ARRIVING, DRIVER_WAITING, TRIP_STARTED and TRIP_COMPLETED do not
 * exist on the server and must never appear in the app.
 */
export type TripStatus =
  | "SCHEDULED"
  | "SEARCHING"
  | "ACCEPTED"
  | "ARRIVING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

/** Statuses the driver can push through PATCH /driver/me/trips/:id/status. */
export type DriverSettableTripStatus = "ARRIVING" | "IN_PROGRESS" | "COMPLETED";

export type LatLng = { lat: number; lng: number };

export type OfferPassenger = {
  id?: string;
  name?: string | null;
  rating?: number | null;
  avatarUrl?: string | null;
  /**
   * Phase 11 - read-only, computed by the backend from COMPLETED trips only.
   * The app never sends these fields and never derives a level from a count:
   * no threshold (10 / 50 / 100 / 500) exists anywhere in this codebase.
   */
  completedTripsCount?: number | null;
  profileLevel?: string | null;
  /** Public frame URL built server-side from the R2 object key. */
  profileFrameUrl?: string | null;
  nextLevel?: string | null;
  nextLevelAt?: number | null;
  tripsToNextLevel?: number | null;
};

/**
 * Payload of the `ride:offer` socket event, exactly as MatchingService emits
 * it. `expiresInMs` is authoritative for the countdown: the server timeout is
 * a configuration value (currently 20s), so the UI must never hardcode 15s.
 */
export type RideOffer = {
  tripId: string;
  pickupLat: number;
  pickupLng: number;
  pickupAddress?: string | null;
  destLat: number;
  destLng: number;
  destAddress?: string | null;
  rideClass?: RideClass | null;
  vehicleTypeId?: string | null;
  fare: number;
  commissionPct?: number | null;
  /**
   * Driver net for this trip, computed by the backend with the exact same
   * logic as settlement (commission on the pre-coupon gross fare, minus the
   * driver-funded share of any coupon).
   *
   * Phase 7: the app must NOT recompute this. A local `fare - fare*pct/100`
   * diverges from settlement whenever a coupon is involved, so the driver
   * would see a number that never matches the actual payout.
   */
  driverNet?: number | null;
  currency?: string | null;
  distanceKm?: number | null;
  expiresInMs: number;
  passenger?: OfferPassenger | null;
};

export type Trip = {
  id: string;
  status: TripStatus;
  pickupLat?: number | null;
  pickupLng?: number | null;
  pickupAddress?: string | null;
  destLat?: number | null;
  destLng?: number | null;
  destAddress?: string | null;
  fare?: number | null;
  currency?: string | null;
  distanceKm?: number | null;
  rideClass?: RideClass | null;
  passenger?: OfferPassenger | null;
  createdAt?: string;
  completedAt?: string | null;
};

/** Terminal states: nothing more will arrive for this trip. */
export const TERMINAL_TRIP_STATUSES: readonly TripStatus[] = [
  "COMPLETED",
  "CANCELLED",
];

export const isTerminalTripStatus = (status: TripStatus): boolean =>
  TERMINAL_TRIP_STATUSES.includes(status);
