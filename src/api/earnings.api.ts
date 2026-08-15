import { api } from "./client";

/**
 * GET /driver/me/earnings
 *
 * The server returns the last 100 earning rows plus three aggregates: today,
 * week (week starts Monday) and all. There is no month bucket, so the UI must
 * not display one.
 */
export type EarningsAggregate = {
  trips?: number;
  gross?: number;
  commission?: number;
  net?: number;
  currency?: string;
};

export type DriverEarningRow = {
  id: string;
  amount?: number;
  commission?: number;
  net?: number;
  currency?: string;
  createdAt?: string;
  trip?: {
    id: string;
    destAddress?: string | null;
    distanceKm?: number | null;
    rideClass?: string | null;
    completedAt?: string | null;
  } | null;
};

export type DriverEarnings = {
  items?: DriverEarningRow[];
  today?: EarningsAggregate;
  week?: EarningsAggregate;
  all?: EarningsAggregate;
};

export async function fetchEarnings(): Promise<DriverEarnings> {
  const { data } = await api.get("/driver/me/earnings");
  return data as DriverEarnings;
}
