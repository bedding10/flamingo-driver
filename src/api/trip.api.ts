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
// Fare bargaining (server feature, Phase 9). The driver proposes a fare on an
// open opportunity instead of waiting to be matched.
// --------------------------------------------------------------------------

/** POST /driver/fare-offers */
export async function createFareOffer(input: {
  tripId: string;
  amount: number;
}) {
  const { data } = await api.post("/driver/fare-offers", input);
  return data as unknown;
}

/** GET /driver/fare-offers */
export async function fetchFareOffers() {
  const { data } = await api.get("/driver/fare-offers");
  return data as unknown;
}

/** GET /driver/fare-offers/opportunities */
export async function fetchFareOpportunities() {
  const { data } = await api.get("/driver/fare-offers/opportunities");
  return data as unknown;
}

/** POST /driver/fare-offers/:id/withdraw */
export async function withdrawFareOffer(offerId: string) {
  const { data } = await api.post(
    "/driver/fare-offers/" + offerId + "/withdraw",
  );
  return data as unknown;
}
