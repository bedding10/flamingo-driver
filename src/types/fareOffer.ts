import type { RideClass } from "./driver";
import type { OfferPassenger } from "./trip";

/**
 * The negotiation (bidding) contract, copied from FareOffersService.
 *
 * This is a SECOND, different flow from `ride:offer`:
 *  - `ride:offer` is a push assignment from MatchingService: the fare is fixed
 *    and the driver only accepts or declines, over the socket.
 *  - a FareQuote is a passenger request open for bidding. The driver pulls the
 *    open ones over HTTP and answers with an amount inside [minFare, maxFare].
 *
 * Both exist on this server, so neither replaces the other and nothing here
 * touches the Phase 2 offer card.
 */

/** Prisma enum FareOfferStatus, verbatim. */
export type FareOfferStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "WITHDRAWN"
  | "EXPIRED";

/** Exactly what FareOffersService.serialize() returns. */
export type FareOffer = {
  id: string;
  fareQuoteId: string;
  driverId: string;
  amount: number;
  currency: string;
  note: string | null;
  etaMinutes: number | null;
  status: FareOfferStatus;
  /** Server-side TTL (OFFER_TTL_MS = 120s), capped by the quote expiry. */
  expiresAt: string | null;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * One row of GET /driver/fare-offers/opportunities.
 *
 * `minFare` / `maxFare` are the server's accepted band: createOffer() rejects
 * anything outside it with FARE_OFFER_OUT_OF_RANGE, so the app validates the
 * same band locally to avoid a round trip that can only fail.
 */
export type FareOpportunity = {
  id: string;
  rideClass: RideClass | null;
  vehicleTypeId: string | null;
  cityId: string | null;
  pickupLat: number;
  pickupLng: number;
  pickupAddress: string | null;
  destLat: number;
  destLng: number;
  destAddress: string | null;
  distanceKm: number | null;
  durationSec: number | null;
  currency: string;
  suggestedFare: number;
  /** What the passenger asked for, when they proposed a price themselves. */
  proposedFare: number | null;
  passengerNote: string | null;
  minFare: number;
  maxFare: number;
  commissionPct: number | null;
  expiresAt: string;
  passenger: OfferPassenger | null;
  /** The driver's own PENDING bid on this request, if any. */
  myOffer: FareOffer | null;
};
