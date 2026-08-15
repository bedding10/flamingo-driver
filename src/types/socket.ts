import type { RideOffer, TripStatus } from "./trip";

/**
 * The realtime contract, copied from RealtimeGateway and MatchingService.
 *
 * Names are wire values and must not be renamed. The product brief listed
 * `trip_request`, `trip_update`, `driver_status`, `location_update`,
 * `notification` and `wallet_update`; none of those exist on this server. The
 * real names are below, and there is no driver-status or wallet channel at all
 * (wallet and availability are read over HTTP).
 */

/** Events the app sends. */
export const DRIVER_EMIT = {
  location: "driver:location",
  accept: "ride:accept",
  decline: "ride:decline",
  joinTrip: "trip:join",
} as const;

/** Events the app listens to. */
export const DRIVER_LISTEN = {
  offer: "ride:offer",
  offerExpired: "ride:offer_expired",
  assigned: "ride:assigned",
  tripStatus: "trip:status",
  driverMoved: "driver:moved",
  tripMessage: "trip:message",
  /**
   * Emitted by RealtimeGateway.emitTripMessagesRead() when the other party
   * opens the thread. Added in Phase 6 alongside TripMessage.readAt; without
   * it the driver's "sent" ticks could never turn into "read".
   */
  tripMessagesRead: "trip:messages_read",
  error: "ride:error",
} as const;

export type DriverLocationPayload = {
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
};

export type TripStatusPayload = { tripId: string; status: TripStatus };
export type RideAssignedPayload = { tripId: string };
/**
 * `reason` is only present when MatchingService closes competing offers
 * after another driver won (closeCompetingOffers -> "accepted_by_another"
 * + "_driver"). A plain timeout carries no reason.
 */
export type OfferExpiredPayload = { tripId: string; reason?: string };
export type RideErrorPayload = { message?: string; code?: string };

export type DriverMovedPayload = {
  tripId?: string;
  driverId: string;
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  busy?: boolean;
};

export type TripMessagePayload = {
  id: string;
  tripId: string;
  senderId: string;
  body: string;
  /** null until the recipient opens the thread. */
  readAt: string | null;
  createdAt: string;
};

/**
 * `readerId` is the party who DID the reading, so a client marks its own
 * outgoing messages as read only when readerId !== me.
 */
export type TripMessagesReadPayload = {
  tripId: string;
  readerId: string;
  readAt: string;
};

/**
 * Phase 11 - `profile:level` is pushed to the driver's own room `user:{id}`
 * right after a trip is completed. It is informational: the app reacts by
 * re-reading GET /driver/me, it never trusts these numbers as a source.
 */
export type ProfileLevelPayload = {
  scope: "PASSENGER" | "DRIVER";
  completedTripsCount: number;
  profileLevel: string;
  profileFrameUrl: string | null;
  nextLevel: string | null;
  nextLevelAt: number | null;
  levelUp: boolean;
  previousLevel: string;
};

/** Maps every inbound event name to its payload type. */
export type DriverInboundEvents = {
  "ride:offer": RideOffer;
  "ride:offer_expired": OfferExpiredPayload;
  "ride:assigned": RideAssignedPayload;
  "trip:status": TripStatusPayload;
  "driver:moved": DriverMovedPayload;
  "trip:message": TripMessagePayload;
  "trip:messages_read": TripMessagesReadPayload;
  "ride:error": RideErrorPayload;
  "profile:level": ProfileLevelPayload;
};

export type SocketStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected";
