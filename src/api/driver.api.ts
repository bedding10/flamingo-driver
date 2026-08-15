import { api } from "./client";
import type {
  DocumentType,
  DriverAvailability,
  DriverDocument,
  DriverProfile,
  UpdateDriverProfileInput,
  UploadTicket,
} from "../types/driver";

/** GET /driver/me */
export async function fetchDriverProfile(): Promise<DriverProfile> {
  const { data } = await api.get("/driver/me");
  return data as DriverProfile;
}

/**
 * PATCH /driver/me
 *
 * Returns the full profile (the server ends updateProfile with getProfile), so
 * the caller can seed the cache from the response instead of refetching.
 */
export async function updateDriverProfile(
  input: UpdateDriverProfileInput,
): Promise<DriverProfile> {
  const { data } = await api.patch("/driver/me", input);
  return data as DriverProfile;
}

/**
 * POST /driver/me/availability
 *
 * The server refuses ONLINE unless status is APPROVED, and refuses any change
 * while availability is ON_TRIP. Wired in Phase 4; kept here so the API layer
 * stays complete.
 */
export async function setAvailability(
  availability: Extract<DriverAvailability, "ONLINE" | "OFFLINE">,
) {
  const { data } = await api.post("/driver/me/availability", { availability });
  return data as { availability: DriverAvailability };
}

/** GET /driver/me/sanctions */
export async function fetchSanctions() {
  const { data } = await api.get("/driver/me/sanctions");
  return data as unknown;
}

/** GET /driver/me/trips (paginated) */
export async function fetchDriverTrips(params?: {
  page?: number;
  limit?: number;
}) {
  const { data } = await api.get("/driver/me/trips", { params });
  return data as unknown;
}

/** GET /driver/me/trips/:id */
export async function fetchDriverTrip(tripId: string) {
  const { data } = await api.get("/driver/me/trips/" + tripId);
  return data as unknown;
}

/**
 * POST /driver/me/upload-url
 *
 * Returns { uploadUrl, objectPath, readUrl }. The server builds the object key
 * itself from the driver id and the document kind, so the app never chooses a
 * storage path. `contentType` decides the extension server-side (png or jpg).
 */
export async function createUploadUrl(input: {
  kind: DocumentType;
  contentType?: string;
}): Promise<UploadTicket> {
  const { data } = await api.post("/driver/me/upload-url", input);
  return data as UploadTicket;
}

/**
 * POST /driver/me/documents - registers an uploaded file; always PENDING.
 *
 * `url` must be the `objectPath` from the upload ticket. The server normalizes
 * whatever it receives down to the object key, so a signed URL never lands in
 * the database, but sending the key is the correct contract.
 */
export async function addDocument(input: {
  type: DocumentType;
  url: string;
}): Promise<DriverDocument> {
  const { data } = await api.post("/driver/me/documents", input);
  return data as DriverDocument;
}

/** POST /notifications/devices - FCM token registration. */
export async function registerDevice(input: {
  token: string;
  platform?: string;
}) {
  const { data } = await api.post("/notifications/devices", input);
  return data as unknown;
}

/** DELETE /notifications/devices/:token */
export async function unregisterDevice(token: string) {
  await api.delete("/notifications/devices/" + token);
}
