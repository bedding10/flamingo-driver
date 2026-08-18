import { api } from "./client";

/**
 * Complaints ("/support/complaints") - the real reporting system.
 *
 * PHASE 2: swiping a request card exposes "report". It must reach the same
 * Complaint records the dashboard reviews (the new complaints page), so nothing
 * here is local-only or cosmetic.
 *
 * A report sent from the requests list has NO trip yet, so it carries the
 * fareQuoteId instead: the server verifies that the reported user really is the
 * passenger who owns that open request before it stores the complaint.
 */

/** Must stay identical to enum ComplaintReason in schema.prisma. */
export const COMPLAINT_REASONS = [
  "UNSAFE_BEHAVIOR",
  "SUSPECTED_FRAUD",
  "FAKE_REQUEST",
  "WRONG_PICKUP_LOCATION",
  "OFFENSIVE_LANGUAGE",
  "OTHER",
] as const;

export type ComplaintReason = (typeof COMPLAINT_REASONS)[number];

export type Complaint = {
  id: string;
  tripId: string | null;
  fareQuoteId: string | null;
  againstUserId: string | null;
  reason: ComplaintReason | null;
  message: string;
  status: "OPEN" | "REVIEWING" | "RESOLVED";
  createdAt: string;
};

/**
 * POST /support/complaints - pre-trip report from the requests list.
 * `message` is required by the server (max 2000 chars).
 */
export async function reportRequest(input: {
  fareQuoteId: string;
  againstUserId: string;
  reason: ComplaintReason;
  message: string;
}): Promise<Complaint> {
  const { data } = await api.post("/support/complaints", input);
  return data as Complaint;
}

/**
 * POST /support/complaints - report the other party of a real trip. The server
 * resolves the counterpart from the trip itself and refuses a trip the caller
 * is not part of.
 */
export async function reportTripParty(input: {
  tripId: string;
  reason: ComplaintReason;
  message: string;
}): Promise<Complaint> {
  const { data } = await api.post("/support/complaints", input);
  return data as Complaint;
}
