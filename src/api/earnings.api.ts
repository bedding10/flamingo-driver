import { api } from "./client";

/**
 * GET /driver/me/earnings
 *
 * PHASE 5 correction. The previous shape in this file did not match the server
 * at all: it declared top-level `today` / `week` / `all` objects and rows with
 * an `amount` field. DriverSelfService.earnings() actually returns
 *
 *   { totals: { today, week, all, trips }, items: [{ id, tripId, gross,
 *     commission, net, createdAt, trip }] }
 *
 * so every value a UI read through the old type was undefined. Nothing was
 * broken on screen only because no screen consumed it yet.
 *
 * Two server facts the UI must respect:
 * - there is no month bucket, so no month figure may be displayed;
 * - `items` is capped at the last 100 rows, so this is a recent list, not a
 *   full statement.
 */
export type EarningsTotals = {
  today: number;
  week: number;
  all: number;
  /** Driver.totalTrips, not the length of `items`. */
  trips: number;
};

export type DriverEarningRow = {
  id: string;
  tripId: string | null;
  gross: number;
  commission: number;
  net: number;
  createdAt: string;
  trip: {
    id: string;
    destAddress: string | null;
    distanceKm: number | null;
    rideClass: string | null;
    completedAt: string | null;
  } | null;
};

export type DriverEarnings = {
  totals: EarningsTotals;
  items: DriverEarningRow[];
};

/**
 * Normalised on the way in: the aggregates are money and a missing aggregate
 * must read as 0, never as an empty box on the driver's screen.
 */
export async function fetchEarnings(): Promise<DriverEarnings> {
  const { data } = await api.get("/driver/me/earnings");
  const raw = (data ?? {}) as Partial<DriverEarnings>;
  return {
    totals: {
      today: Number(raw.totals?.today ?? 0),
      week: Number(raw.totals?.week ?? 0),
      all: Number(raw.totals?.all ?? 0),
      trips: Number(raw.totals?.trips ?? 0),
    },
    items: Array.isArray(raw.items) ? raw.items : [],
  };
}
