import { api } from "./client";
import type { RideClass } from "../types/driver";
import type { FareOffer, FareOpportunity } from "../types/fareOffer";

/**
 * Filters for GET /driver/fare-offers/opportunities.
 *
 * PHASE 2: the server gained real proximity filtering. When lat/lng are sent it
 * computes the driver -> pickup distance, drops anything outside radiusKm and
 * orders the list nearest first. When they are omitted the server falls back to
 * the work zone saved for this driver, so the list and the pushed ride:offer
 * assignments stay consistent with one another.
 */
export type FareOpportunityFilters = {
  limit?: number;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  rideClass?: RideClass;
  vehicleTypeId?: string;
};

/**
 * GET /driver/fare-offers/opportunities
 *
 * The server still filters by city + APPROVED active vehicle rideClass itself
 * and refuses the call unless the driver is APPROVED and ONLINE
 * (DRIVER_NOT_APPROVED / FARE_OFFER_DRIVER_UNAVAILABLE /
 * DRIVER_VERIFIED_VEHICLE_REQUIRED). The vehicle-class filter below can only
 * narrow what the server already allowed; it never widens it.
 */
export async function listFareOpportunities(
  input: number | FareOpportunityFilters = {},
): Promise<FareOpportunity[]> {
  const filters: FareOpportunityFilters =
    typeof input === "number" ? { limit: input } : input;
  const params: Record<string, string | number> = {
    limit: filters.limit ?? 20,
  };
  if (Number.isFinite(Number(filters.lat)) && Number.isFinite(Number(filters.lng))) {
    params.lat = Number(filters.lat);
    params.lng = Number(filters.lng);
  }
  if (Number.isFinite(Number(filters.radiusKm))) {
    params.radiusKm = Number(filters.radiusKm);
  }
  if (filters.rideClass) params.rideClass = filters.rideClass;
  if (filters.vehicleTypeId) params.vehicleTypeId = filters.vehicleTypeId;
  const { data } = await api.get("/driver/fare-offers/opportunities", {
    params,
  });
  return data as FareOpportunity[];
}

/** GET /driver/fare-offers - the driver's own bids, newest first. */
export async function listMyFareOffers(limit = 30): Promise<FareOffer[]> {
  const { data } = await api.get("/driver/fare-offers", { params: { limit } });
  return data as FareOffer[];
}

/**
 * POST /driver/fare-offers
 *
 * Sending it twice for the same quote UPDATES the existing PENDING bid server
 * side (same row, new amount and new expiry), so the app does not need to
 * withdraw before re-bidding.
 */
export async function submitFareOffer(input: {
  fareQuoteId: string;
  amount: number;
  note?: string;
  etaMinutes?: number;
}): Promise<FareOffer> {
  const { data } = await api.post("/driver/fare-offers", input);
  return data as FareOffer;
}

/** POST /driver/fare-offers/:id/withdraw - only a PENDING bid can be pulled. */
export async function withdrawFareOffer(offerId: string): Promise<FareOffer> {
  const { data } = await api.post(
    "/driver/fare-offers/" + offerId + "/withdraw",
  );
  return data as FareOffer;
}

/** What POST /driver/fare-offers/claim returns: the offer row plus the trip. */
export type ClaimedFareQuote = FareOffer & {
  tripId: string;
  tripStatus: string;
};

/**
 * POST /driver/fare-offers/claim - DIRECT ACCEPT.
 *
 * Project owner decision (PHASE 2): the request becomes this driver's trip
 * immediately, with no confirmation screen and no second acceptance step from
 * the passenger. `amount` is optional; omitting it takes the price the
 * passenger asked for (proposedFare, else the engine's suggestedFare).
 *
 * The server still enforces its own band [minFare, maxFare], refuses a second
 * active trip (ACTIVE_TRIP_EXISTS) and claims the driver atomically
 * (ONLINE -> ON_TRIP, else FARE_OFFER_DRIVER_UNAVAILABLE), so a lost race
 * fails loudly instead of creating a ghost trip.
 */
export async function claimFareQuote(input: {
  fareQuoteId: string;
  amount?: number;
}): Promise<ClaimedFareQuote> {
  const { data } = await api.post("/driver/fare-offers/claim", input);
  return data as ClaimedFareQuote;
}
