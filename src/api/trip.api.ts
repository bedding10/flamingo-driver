import { api } from "./client";
import type { DriverSettableTripStatus, Trip } from "../types/trip";

/**
 * Trip lifecycle, driver side.
 *
 * Accepting and declining an offer are SOCKET actions (ride:accept /
 * ride:decline); there is no HTTP route for them, so none is faked here.
 * Everything below exists on the server under /driver/*.
 */

/** POST /driver/trips/:id/arriving */
export async function markArriving(tripId: string) {
  const { data } = await api.post("/driver/trips/" + tripId + "/arriving");
  return data as Trip;
}

/** POST /driver/trips/:id/start */
export async function startTrip(tripId: string) {
  const { data } = await api.post("/driver/trips/" + tripId + "/start");
  return data as Trip;
}

/** POST /driver/trips/:id/complete */
export async function completeTrip(tripId: string) {
  const { data } = await api.post("/driver/trips/" + tripId + "/complete");
  return data as Trip;
}

/** POST /driver/trips/:id/cancel */
export async function cancelTrip(tripId: string, reason?: string) {
  const { data } = await api.post(
    "/driver/trips/" + tripId + "/cancel",
    reason ? { reason } : {},
  );
  return data as Trip;
}

/** GET /driver/trips/:id/track - the recorded GPS track for one trip. */
export async function fetchTripTrack(tripId: string) {
  const { data } = await api.get("/driver/trips/" + tripId + "/track");
  return data as unknown;
}

/**
 * PATCH /driver/me/trips/:id/status
 *
 * A second, generic way to move the trip forward. The dedicated routes above
 * are preferred; this one stays available because the server accepts it.
 */
export async function setTripStatus(
  tripId: string,
  status: DriverSettableTripStatus,
  reason?: string,
) {
  const { data } = await api.patch(
    "/driver/me/trips/" + tripId + "/status",
    reason ? { status, reason } : { status },
  );
  return data as Trip;
}

// Trip chat moved to ./trip-communication.api.ts.
//
// The function that used to live here was named fetchTripMessages but called
// GET /trip-communication/:tripId - the CONTEXT route, not the messages route -
// and typed its result as `unknown`. It returned the policy object where the
// caller would expect a message list, so it could never have rendered a thread.
// It had no callers, which is why the mismatch was never noticed.
export {
  fetchTripCommunication,
  fetchTripMessages,
  sendTripMessage,
  markTripMessagesRead,
} from "./trip-communication.api";

// --------------------------------------------------------------------------
// Fare bargaining lives in ./fareOffers.api.ts - NOT here.
//
// This file used to carry a SECOND client for the same endpoints
// (createFareOffer / fetchFareOffers / fetchFareOpportunities /
// withdrawFareOffer, every one of them returning `unknown`). It was removed
// rather than kept as a harmless duplicate, because it contradicted the
// contract instead of merely repeating it:
//
//   - it POSTed { tripId, amount } to /driver/fare-offers, while a bid is keyed
//     by the FARE QUOTE: submitFareOffer sends { fareQuoteId, amount, note?,
//     etaMinutes? }. A bid carrying a trip id cannot be matched to a quote;
//   - it exported a second `withdrawFareOffer`, so two functions with one name
//     and different behaviour were reachable through `tripApi` and
//     `fareOffersApi`;
//   - `unknown` results meant the compiler could not warn a caller who picked
//     the wrong one.
//
// Nothing imported it: checked across src/api, src/hooks, src/components,
// src/screens/home and src/screens/requests. Use ./fareOffers.api.ts, which is
// typed against src/types/fareOffer.ts and is what useFareOpportunities calls.
// --------------------------------------------------------------------------
