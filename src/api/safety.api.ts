import { api } from "./client";

/**
 * Safety reports (SOS), driver side.
 *
 * This file exists because the driver app had NO safety path whatsoever: the
 * server module, the SafetyIncident table, the SMS fan-out to emergency
 * contacts and the dashboard queue were all in place, but nothing on this
 * device could ever reach them. A driver is alone in a car with a stranger for
 * the entire ride, so the absence was not a missing nicety.
 *
 * Every route below already exists on the server under /safety; none is
 * invented here.
 */

export type SafetyIncidentType =
  | "SOS"
  | "ACCIDENT"
  | "THREAT"
  | "MEDICAL"
  | "OTHER";

/** The server's own status set. No parallel set is defined on the client. */
export type SafetyIncidentStatus =
  | "OPEN"
  | "ACKNOWLEDGED"
  | "RESOLVED"
  | "FALSE_ALARM";

export type SafetyIncident = {
  id: string;
  type: SafetyIncidentType;
  status: SafetyIncidentStatus;
  tripId: string | null;
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  message: string | null;
  createdAt: string;
};

export type ReportSosInput = {
  /** Omitted when there is no running trip; the server accepts both. */
  tripId?: string;
  lat?: number;
  lng?: number;
  accuracy?: number;
  message?: string;
  type?: SafetyIncidentType;
};

/**
 * A fresh idempotency key per press.
 *
 * A driver in trouble taps hard and repeatedly. The server keys on this value
 * and returns the FIRST incident instead of opening one per tap, so support
 * sees a single case rather than a wall of duplicates hiding the real one.
 */
function idempotencyKey(): string {
  const random = Math.random().toString(36).slice(2, 12);
  return "sos:" + Date.now().toString(36) + ":" + random;
}

/**
 * POST /safety/incidents
 *
 * The server verifies that `tripId` belongs to this driver, stamps the time
 * and stores the position; none of that is trusted from the device.
 */
export async function reportSos(input: ReportSosInput) {
  const { data } = await api.post("/safety/incidents", {
    ...input,
    type: input.type ?? "SOS",
    idempotencyKey: idempotencyKey(),
  });
  return data as SafetyIncident;
}

/** GET /safety/incidents/me — the driver's own reports, nobody else's. */
export async function myIncidents() {
  const { data } = await api.get("/safety/incidents/me");
  return data as SafetyIncident[];
}
