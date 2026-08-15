/**
 * Phase 8 — administrative geography types.
 *
 * These mirror the backend's public geography payloads exactly. No wilaya or
 * city VALUES live in this repo: the official Algerian division changed from
 * 48 to 58 to 69 wilayas, and a hardcoded copy in a shipped mobile binary
 * cannot be corrected without a store release. Only shapes are declared here.
 */

export type Wilaya = {
  id: string;
  /** Official wilaya number, 1..69. Drivers recognise this, so it is shown. */
  number: number;
  /** ISO-style code, e.g. "DZ-16". */
  code: string;
  nameAr: string;
  nameFr: string;
  nameEn: string;
  /**
   * Seat coordinates, approximate. For map centring only.
   * Never used to compute distance or duration — that is Google Routes,
   * server-side.
   */
  centerLat: number | null;
  centerLng: number | null;
  isOperational: boolean;
};

export type GeographyCity = {
  id: string;
  name: string;
  wilayaId: string | null;
  centerLat: number | null;
  centerLng: number | null;
};
