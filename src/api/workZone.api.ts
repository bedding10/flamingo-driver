import { api } from "./client";

/**
 * The driver's work zone ("/driver/me/work-zone").
 *
 * PHASE 2 decision: the zone picked on the map (or through the work-location
 * search) restricts BOTH the negotiation list AND the pushed `ride:offer`
 * assignments, so a driver who limited themselves to Oran is not woken up for a
 * request 300 km away.
 *
 * The zone is a work-session value on the server (Redis, 12h), not a saved
 * favourite: saved work zones are a PHASE 8 item and are not faked here.
 */
export type DriverWorkZone = {
  lat: number;
  lng: number;
  radiusKm: number;
  label: string | null;
  cityId: string | null;
  updatedAt: string;
};

export type WorkZoneResponse = {
  zone: DriverWorkZone | null;
  ttlSec: number;
};

/** GET /driver/me/work-zone */
export async function fetchWorkZone(): Promise<WorkZoneResponse> {
  const { data } = await api.get("/driver/me/work-zone");
  return data as WorkZoneResponse;
}

/** POST /driver/me/work-zone - server clamps radiusKm to [0.5, 100]. */
export async function saveWorkZone(input: {
  lat: number;
  lng: number;
  radiusKm: number;
  label?: string;
  cityId?: string;
}): Promise<WorkZoneResponse> {
  const { data } = await api.post("/driver/me/work-zone", input);
  return data as WorkZoneResponse;
}

/** DELETE /driver/me/work-zone - back to "anywhere the server allows". */
export async function clearWorkZone(): Promise<{ zone: null }> {
  const { data } = await api.delete("/driver/me/work-zone");
  return data as { zone: null };
}
