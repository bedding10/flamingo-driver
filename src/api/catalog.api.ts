import { api } from "./client";

/**
 * Vehicle catalog — categories and types, all defined in the dashboard.
 *
 * This is the single source of truth for "what kind of vehicle is this": a
 * VehicleCategory (car, motorcycle, ...) holding VehicleType rows (economy,
 * comfort, women-only, bike ...). Nothing is hardcoded in the app: adding a
 * motorcycle category or a women-only type is a dashboard action
 * (POST /vehicle-categories, POST /vehicle-types) and the app picks it up on
 * the next fetch.
 *
 * Matching already respects it (MatchingEngineService): a ride requested with
 * vehicleTypeId only reaches drivers whose active vehicle carries that exact
 * vehicleTypeId — with one documented fallback, see the note on the type below.
 *
 * `audience=driver` filters to types flagged visibleToDrivers, which is what a
 * driver picking his own vehicle type must see (the passenger list can differ).
 */

export type CatalogPricing = {
  id: string;
  currency: string;
  baseFare: string | number;
  perKm: string | number;
  perMin: string | number;
  minFare: string | number;
  maxFare: string | number | null;
  negotiationMin: string | number | null;
  negotiationMax: string | number | null;
  commissionPct: number;
};

export type CatalogVehicleType = {
  id: string;
  categoryId: string | null;
  name: string;
  nameI18n: Record<string, string> | null;
  description: string | null;
  /** Legacy coarse class kept by the server for backwards compatibility. */
  rideClass: "ECONOMY" | "COMFORT" | "VAN" | "XL" | "CAR" | "BIKE";
  capacity: number;
  luggage: number;
  /** When false the passenger pays the quoted fare and no bidding is offered. */
  allowsNegotiation: boolean;
  supportsCash: boolean;
  supportsWallet: boolean;
  visibleToDrivers: boolean;
  visibleToPassengers: boolean;
  badgeText: string | null;
  etaMinutes: number | null;
  iconType: string;
  iconValue: string | null;
  iconUrl: string | null;
  imageUrl: string | null;
  color: string | null;
  minVehicleYear: number | null;
  minDriverRating: number | null;
  minDriverTrips: number | null;
  requiredLicenseType: string | null;
  /** Document types the dashboard marks mandatory for this exact type. */
  requiredDocuments: string[];
  requiredPhotos: string[];
  sortOrder: number;
  resolvedPricing: CatalogPricing | null;
};

export type CatalogVehicleCategory = {
  id: string;
  name: string;
  nameI18n: Record<string, string> | null;
  description: string | null;
  iconType: string;
  iconValue: string | null;
  iconUrl: string | null;
  imageUrl: string | null;
  color: string | null;
  usageType: string;
  sortOrder: number;
  types: CatalogVehicleType[];
};

export type VehicleCatalog = {
  /** Bumped by the server on every catalog edit — usable as a cache key. */
  version: number;
  categories: CatalogVehicleCategory[];
};

/** GET /catalog/vehicles?audience=driver */
export async function fetchVehicleCatalog(params?: {
  audience?: "driver" | "passenger" | "all";
  usageType?: "RIDE" | "DELIVERY" | "BOTH";
  cityId?: string;
  countryCode?: string;
  appVersion?: string;
}): Promise<VehicleCatalog> {
  const { data } = await api.get("/catalog/vehicles", {
    params: { audience: params?.audience ?? "driver", ...params },
  });
  return data as VehicleCatalog;
}

/** GET /catalog/version — cheap poll to know whether the catalog changed. */
export async function fetchCatalogVersion(): Promise<{ version: number }> {
  const { data } = await api.get("/catalog/version");
  return data as { version: number };
}

/** Arabic label for a category/type, falling back to the raw name. */
export function catalogLabel(
  entity: { name: string; nameI18n: Record<string, string> | null },
  locale = "ar",
): string {
  return entity.nameI18n?.[locale]?.trim() || entity.name;
}
