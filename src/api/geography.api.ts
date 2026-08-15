import { api } from "./client";
import type { Wilaya, GeographyCity } from "../types/geography";

/**
 * Phase 8 — administrative geography, served by the backend.
 *
 * Why this file exists at all: before Phase 8 the only city catalogue was
 * GET /cities, which is STAFF-only, so this app could not offer a picker and
 * the profile screen shipped a read-only city field. The backend now exposes
 * an authenticated, non-STAFF read surface, so the list is fetched, never
 * hardcoded. There is deliberately no wilaya array anywhere in this repo.
 */

/**
 * GET /geography/public/wilayas
 *
 * Returns only wilayas flaminGO actually operates in by default. Passing
 * `all` would list the full official division, which is wrong for a driver
 * sign-up: it invites registrations in areas with no service.
 */
export async function fetchWilayas(all = false): Promise<Wilaya[]> {
  const { data } = await api.get("/geography/public/wilayas", {
    params: all ? { all: "true" } : undefined,
  });
  return (data as { items: Wilaya[] }).items;
}

/**
 * GET /geography/public/cities?wilayaId=...
 *
 * Called only after a wilaya is chosen. Fetching every city in the country up
 * front would be a large payload for a screen that needs one wilaya's worth.
 */
export async function fetchCities(wilayaId: string): Promise<GeographyCity[]> {
  const { data } = await api.get("/geography/public/cities", {
    params: { wilayaId },
  });
  return (data as { items: GeographyCity[] }).items;
}
