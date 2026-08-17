import type { RideOffer, TripStatus } from "./trip";

/**
 * The realtime contract, copied from RealtimeGateway and MatchingService.
 *
 * Names are wire values and must not be renamed. The product brief listed
 * `trip_request`, `trip_update`, `driver_status`, `location_update`,
 * `notification` and `wallet_update`; none of those exist on this server. The
 * real names are below, and there is no wallet channel at all (wallet is read
 * over HTTP).
 */

/** Events the app sends. */
export const DRIVER_EMIT = {
  location: "driver:location",
  accept: "ride:accept",
  decline: "ride:decline",
  joinTrip: "trip:join",
  /**
   * PHASE 1 - presence. Proves the driver is really reachable, which a row in
   * the database cannot: `availability = ONLINE` survives a killed app forever.
   * The server refreshes a short-lived presence key on every heartbeat and
   * forces the driver OFFLINE when it expires.
   */
  heartbeat: "driver:heartbeat",
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
  /**
   * PHASE 3 - negotiation. FareOffersService pushes these to the driver's own
   * room `user:{id}` with emitToUser(). They are NOT part of the `ride:*`
   * matching flow and carry a fareQuoteId, not only a tripId.
   */
  fareOfferAccepted: "fare:offer_accepted",
  fareOfferRejected: "fare:offer_rejected",
  fareOfferExpired: "fare:offer_expired",
  /**
   * PHASE 1 - presence. `online: true` acknowledges a heartbeat and carries the
   * server's own timings; `online: false` means the server already wrote
   * OFFLINE to the database and the toggle must follow, not argue.
   */
  presence: "driver:presence",
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

/**
 * PHASE 3 - the passenger picked this driver's bid. The trip already exists and
 * the driver is already assigned to it inside the same transaction, so the app
 * joins the trip room and re-reads the authoritative record.
 */
export type FareOfferAcceptedPayload = {
  quoteId: string;
  offerId: string;
  tripId: string;
  tripStatus: TripStatus;
  amount: number;
};

/**
 * `reason` is "passenger_rejected" (explicit reject) or
 * "another_offer_accepted" (a sibling bid won).
 */
export type FareOfferRejectedPayload = {
  quoteId: string;
  offerId: string;
  reason?: string;
};

/** The 30s cron closed a PENDING bid that outlived its expiresAt. */
export type FareOfferExpiredPayload = { quoteId: string; offerId: string };

/**
 * PHASE 1 - presence state as the SERVER sees it.
 *
 * `reason` explains a forced OFFLINE: "socket_disconnected" (the link closed
 * and no other socket of this driver remained) or "heartbeat_lost" (the
 * presence key expired, i.e. a dead network or a killed app). `ttlSec` and
 * `heartbeatSec` are informational: the client keeps its own interval and does
 * not need to be reconfigured remotely.
 */
export type DriverPresencePayload = {
  driverId: string;
  online: boolean;
  reason?: "socket_disconnected" | "heartbeat_lost";
  ttlSec?: number;
  heartbeatSec?: number;
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
  "fare:offer_accepted": FareOfferAcceptedPayload;
  "fare:offer_rejected": FareOfferRejectedPayload;
  "fare:offer_expired": FareOfferExpiredPayload;
  "driver:presence": DriverPresencePayload;
};

export type SocketStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected";
