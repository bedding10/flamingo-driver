/**
 * Driver domain types.
 *
 * Every union below is a copy of a Prisma enum in the backend schema. If a value
 * is not here, the server cannot produce it, and the UI must not branch on it.
 *
 * PHASE 1 changed three of these enums on the server side, so they are updated
 * here in lockstep (migration 20260816070000_phase1_driver_onboarding):
 *   - DocumentType gained CARTE_GRISE and TECHNICAL_INSPECTION
 *   - DocumentStatus gained EXPIRED
 *   - DriverDocument gained issuedAt, and the serializer now also returns
 *     expiresAt and note
 *   - Vehicle gained features[], and the serializer now returns
 *     verificationStatus / verificationNote
 *
 * DriverProfile is transcribed field by field from DriverSelfService.serialize()
 * (modules/drivers/driver-self.service.ts). It is NOT symmetrical with the
 * update body: the server RETURNS a nested `vehicle` object but ACCEPTS flat
 * `carMake` / `carModel` / ... fields. Both shapes are modelled separately
 * instead of being merged, because merging them would mean guessing.
 */
export type DriverStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "SUSPENDED"
  | "BANNED";

export type DriverAvailability = "OFFLINE" | "ONLINE" | "ON_TRIP";

/** Mirrors DOC_TYPES in modules/drivers/dto/driver-self.dto.ts. */
export const DOCUMENT_TYPES = [
  "LICENSE",
  "ID_CARD",
  "INSURANCE",
  "REGISTRATION",
  "PROFILE_PHOTO",
  "CARTE_GRISE",
  "TECHNICAL_INSPECTION",
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

/**
 * The four documents the server treats as mandatory for a driver file
 * (REQUIRED_DRIVER_DOC_TYPES in driver-self.dto.ts). Nothing else blocks
 * approval, and this app must not invent a fifth requirement.
 */
export const REQUIRED_DRIVER_DOC_TYPES = [
  "LICENSE",
  "CARTE_GRISE",
  "TECHNICAL_INSPECTION",
  "INSURANCE",
] as const;

/**
 * What the documents screen actually shows, in the order a driver collects
 * them: the four required ones first, then the optional identity card.
 *
 * PROFILE_PHOTO is deliberately absent - it is handled by the profile screen,
 * not as a paper document. REGISTRATION is absent too: it is the legacy name
 * for the grey card and CARTE_GRISE replaced it in PHASE 1. Legacy REGISTRATION
 * rows already stored on old accounts remain valid on the server and are still
 * visible in the dashboard; they are simply not offered as a new slot here.
 */
export const DRIVER_DOC_SLOTS = [
  "LICENSE",
  "CARTE_GRISE",
  "TECHNICAL_INSPECTION",
  "INSURANCE",
  "ID_CARD",
] as const satisfies ReadonlyArray<DocumentType>;

/** PHASE 1: EXPIRED exists now. The server sets it for display from expiresAt. */
export type DocumentStatus = "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";

export type VehicleVerificationStatus = "PENDING" | "APPROVED" | "REJECTED";

/** Mirrors RIDE_CLASSES in modules/drivers/dto/driver-self.dto.ts. */
export const RIDE_CLASSES = [
  "ECONOMY",
  "COMFORT",
  "VAN",
  "XL",
  "CAR",
  "BIKE",
] as const;
export type RideClass = (typeof RIDE_CLASSES)[number];

/**
 * Which dates each document carries, taken from the paper document itself:
 *
 *   - a driving licence, an insurance certificate and a technical inspection
 *     all carry an issue date AND an expiry date
 *   - an Algerian carte grise carries an issue date and does not expire
 *   - an identity card is accepted here without dates: the server does not
 *     require them and asking for them would only add a failure point
 *
 * The server accepts both fields as optional on every type, so this table is a
 * UI requirement, never a claim about the API.
 */
export const DOC_DATE_RULES: Record<
  DocumentType,
  { issued: boolean; expires: boolean }
> = {
  LICENSE: { issued: true, expires: true },
  CARTE_GRISE: { issued: true, expires: false },
  TECHNICAL_INSPECTION: { issued: true, expires: true },
  INSURANCE: { issued: true, expires: true },
  ID_CARD: { issued: false, expires: false },
  REGISTRATION: { issued: false, expires: false },
  PROFILE_PHOTO: { issued: false, expires: false },
};

export function documentNeedsDates(type: DocumentType): boolean {
  const rule = DOC_DATE_RULES[type];
  return rule.issued || rule.expires;
}

/**
 * One row of driver.documents as serialized by the server.
 *
 * `url` is generated per request from the stored object key, so it is safe to
 * display but must never be written back or cached across sessions.
 *
 * `note` is the operator's rejection reason. It is only meaningful while the
 * status is REJECTED, and it is the single reason a driver knows what to fix.
 */
export type DriverDocument = {
  id: string;
  type: DocumentType;
  url: string | null;
  status: DocumentStatus;
  /** ISO-8601, or null. PHASE 1. */
  issuedAt?: string | null;
  /** ISO-8601, or null. PHASE 1. */
  expiresAt?: string | null;
  /** Operator note; carries the rejection reason. PHASE 1. */
  note?: string | null;
};

/** driver.vehicle: the single ACTIVE vehicle, or null when none exists yet. */
export type DriverVehicle = {
  id: string;
  make: string | null;
  model: string | null;
  color: string | null;
  plate: string | null;
  year: number | null;
  rideClass: RideClass | null;
  vehicleTypeId: string | null;
  /** PHASE 1: free-form feature keys, deduplicated server-side. */
  features?: string[] | null;
  verificationStatus?: VehicleVerificationStatus | null;
  verificationNote?: string | null;
};

/** Exact shape of GET /driver/me. */
export type DriverProfile = {
  id: string;
  userId: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  /**
   * Display URL generated by the server on every read from the stored object
   * key: user.avatarUrl first, then the PROFILE_PHOTO document.
   */
  photoUrl: string | null;
  status: DriverStatus;
  /** Server-computed convenience flag; equals status === "APPROVED". */
  approved: boolean;
  availability: DriverAvailability;
  rating: number;
  totalTrips: number;
  /**
   * Phase 11 - read-only, computed by the backend from COMPLETED trips only.
   * The app never sends these fields and never derives a level from a count:
   * no threshold (10 / 50 / 100 / 500) exists anywhere in this codebase.
   */
  completedTripsCount?: number | null;
  profileLevel?: string | null;
  /** Public frame URL built server-side from the R2 object key. */
  profileFrameUrl?: string | null;
  nextLevel?: string | null;
  nextLevelAt?: number | null;
  tripsToNextLevel?: number | null;
  cityId: string | null;
  /** City NAME, not the id. The id is `cityId`. */
  city: string | null;
  vehicle: DriverVehicle | null;
  documents: DriverDocument[];
};

/**
 * PATCH /driver/me body (UpdateDriverProfileDto).
 *
 * Every field is optional and only what the driver changed should be sent:
 * touching any vehicle IDENTITY field (make / model / plate / year) makes the
 * server reset the vehicle verification back to PENDING, so sending unchanged
 * values would silently invalidate an approved vehicle.
 *
 * carFeatures is NOT an identity field: PHASE 1 deliberately kept it out of the
 * server's identityChanged check, so editing the comfort list of an approved
 * vehicle does not send it back to review.
 *
 * rideClass / vehicleTypeId are deliberately absent: the driver no longer
 * sets their own service class. It is assigned by staff during vehicle
 * review (PATCH /vehicles/:id/verify on the backend), so a driver cannot
 * silently reclassify an approved vehicle to chase more ride offers.
 */
export type UpdateDriverProfileInput = {
  name?: string;
  phone?: string;
  carMake?: string;
  carModel?: string;
  carColor?: string;
  carPlate?: string;
  carYear?: number;
  carFeatures?: string[];
  cityId?: string;
};

/** Response of POST /driver/me/upload-url. */
export type UploadTicket = {
  /** Presigned PUT URL. Valid for 30 minutes. */
  uploadUrl: string;
  /**
   * Object key in storage, e.g. "driver-docs/<driverId>/LICENSE-<ts>.jpg".
   * THIS is what gets registered with POST /driver/me/documents.
   */
  objectPath: string;
  /**
   * Ready-to-display URL for this object: the permanent public URL when
   * R2_PUBLIC_URL is set, otherwise a temporary signed one. For immediate
   * preview only - never persist it and never send it back to the server.
   */
  readUrl: string;
};

/** The authenticated account behind the driver, from POST /auth/me. */
export type AuthUser = {
  id: string;
  phone?: string | null;
  name?: string | null;
  email?: string | null;
  role: string;
  avatarUrl?: string | null;
};

/** Latest document per type, newest first as returned by the server. */
export function latestDocument(
  documents: DriverDocument[] | undefined,
  type: DocumentType,
): DriverDocument | null {
  if (!documents) return null;
  return documents.find((document) => document.type === type) ?? null;
}

/**
 * Status to SHOW for a document.
 *
 * The server already downgrades an APPROVED document to EXPIRED for display
 * when its expiry has passed. This repeats the same rule locally so a phone
 * holding a cached profile cannot show "معتمدة" on a document that expired
 * yesterday. It is display only: the stored status is never changed from here.
 */
export function displayDocumentStatus(
  document: DriverDocument | null,
): DocumentStatus | null {
  if (!document) return null;
  if (document.status === "APPROVED" && document.expiresAt) {
    const expiry = Date.parse(document.expiresAt);
    if (Number.isFinite(expiry) && expiry <= Date.now()) return "EXPIRED";
  }
  return document.status;
}

/**
 * Required documents that still block the file: never submitted, rejected, or
 * expired. A PENDING document is NOT missing - it is waiting for an operator,
 * and telling the driver to upload it again would only create duplicates.
 */
export function missingRequiredDocuments(
  documents: DriverDocument[] | undefined,
): DocumentType[] {
  const missing: DocumentType[] = [];
  for (const type of REQUIRED_DRIVER_DOC_TYPES) {
    const status = displayDocumentStatus(latestDocument(documents, type));
    if (status === null || status === "REJECTED" || status === "EXPIRED") {
      missing.push(type);
    }
  }
  return missing;
}
