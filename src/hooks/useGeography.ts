import { useQuery } from "@tanstack/react-query";
import { geographyApi } from "../api";
import type { GeographyCity, Wilaya } from "../types/geography";

export const WILAYAS_KEY = ["geography", "wilayas"] as const;
export const CITIES_KEY = ["geography", "cities"] as const;

/**
 * Phase 8 — operating wilayas, from the backend.
 *
 * Cached for a long time on purpose: the administrative division is legislative
 * data that changes once every several years, and the operational flags change
 * at the pace of business expansion, not per session. A short staleTime here
 * would mean a network round trip every time the profile screen mounts, for a
 * list that is effectively static.
 */
export function useWilayas() {
  return useQuery<Wilaya[]>({
    queryKey: WILAYAS_KEY,
    queryFn: () => geographyApi.fetchWilayas(),
    staleTime: 24 * 60 * 60 * 1000,
  });
}

/**
 * Cities of one wilaya. Disabled until a wilaya is selected, so the screen
 * never fires a request for "every city in the country".
 */
export function useCities(wilayaId: string | null) {
  return useQuery<GeographyCity[]>({
    queryKey: [...CITIES_KEY, wilayaId],
    queryFn: () => geographyApi.fetchCities(wilayaId as string),
    enabled: Boolean(wilayaId),
    staleTime: 24 * 60 * 60 * 1000,
  });
}
