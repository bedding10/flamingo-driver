import { api } from "./client";
import { config } from "../config";

/**
 * PHASE 7 - "share my trip" (safety), driver side.
 *
 * Every route already existed on the server and was unreachable from this app:
 * TripShareService issues a 32-byte token, stores only its SHA-256 hash, and
 * the public view returns the minimum needed to follow a car - status, pickup,
 * destination, route line, driver first name, plate/colour/model and the last
 * known position. No passenger phone number, no fare, no internal ids. The
 * token is read-only: nothing on that route can change the trip.
 *
 * The raw token is returned exactly once, at creation, and cannot be recovered
 * afterwards - so it is handed straight to the share sheet and never stored.
 */

/** The durations offered to the driver. The server clamps to 5..720 anyway. */
export const SHARE_TTL_CHOICES = [5, 15, 30, 60, 120, 720] as const;
export type ShareTtlMinutes = (typeof SHARE_TTL_CHOICES)[number];

export type CreatedTripShare = {
  id: string;
  token: string;
  url: string;
  expiresAt: string;
};

/** An active link, as listed by the server. Tokens are never included. */
export type ActiveTripShare = {
  id: string;
  expiresAt: string;
  viewCount: number;
  lastViewedAt: string | null;
  createdAt: string;
};

/**
 * The server builds the link from PUBLIC_SHARE_BASE_URL / PUBLIC_APP_URL and
 * falls back to the RELATIVE path "/api/safety/share/<token>" when neither is
 * configured. A relative path is useless in a share sheet, so it is resolved
 * against the API origin here. This is a client-side repair of a deployment
 * gap, not a new contract: when the env var is set, the server's absolute URL
 * is passed through untouched.
 */
function toAbsolute(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  const origin = config.api.url.replace(/\/api$/, "");
  return origin + (url.startsWith("/") ? url : "/" + url);
}

/**
 * POST /safety/share
 *
 * The server verifies the trip belongs to this driver and refuses a finished
 * trip (SHAREABLE_TRIP_STATUSES), so no ownership or status check is attempted
 * here.
 */
export async function createTripShare(
  tripId: string,
  ttlMinutes: ShareTtlMinutes,
): Promise<CreatedTripShare> {
  const { data } = await api.post("/safety/share", { tripId, ttlMinutes });
  const created = data as CreatedTripShare;
  return { ...created, url: toAbsolute(created.url) };
}

/** GET /safety/share/trip/:tripId — this driver's own active links only. */
export async function listTripShares(
  tripId: string,
): Promise<ActiveTripShare[]> {
  const { data } = await api.get("/safety/share/trip/" + tripId);
  return data as ActiveTripShare[];
}

/** DELETE /safety/share/:id — revokes a link immediately. */
export async function revokeTripShare(id: string): Promise<void> {
  await api.delete("/safety/share/" + id);
}
