import { api } from "./client";
import type { FareOffer, FareOpportunity } from "../types/fareOffer";

/**
 * GET /driver/fare-offers/opportunities
 *
 * The server filters by city + APPROVED active vehicle rideClass itself and
 * refuses the call unless the driver is APPROVED and ONLINE
 * (DRIVER_NOT_APPROVED / FARE_OFFER_DRIVER_UNAVAILABLE /
 * DRIVER_VERIFIED_VEHICLE_REQUIRED). The app never filters requests locally.
 */
export async function listFareOpportunities(
  limit = 20,
): Promise<FareOpportunity[]> {
  const { data } = await api.get("/driver/fare-offers/opportunities", {
    params: { limit },
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
