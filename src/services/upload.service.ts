import { driverApi } from "../api";
import type { DocumentType, DriverDocument } from "../types/driver";

/**
 * Document upload, following the flow the server already owns. The app invents
 * no storage system of its own:
 *
 *   1. POST /driver/me/upload-url  -> { uploadUrl, objectPath, readUrl }
 *   2. PUT  <uploadUrl>            -> bytes go straight to Cloudflare R2 and
 *                                     never pass through the API server
 *   3. POST /driver/me/documents   -> registers `objectPath`, status PENDING
 *
 * Step 2 must NOT use the `api` axios instance: it would prefix the API baseURL
 * and attach the Bearer token, and a presigned R2 URL rejects a request that
 * carries an extra Authorization header. Same rule as the passenger avatar
 * upload, which is already proven in production.
 */

/** Dates printed on the paper document. Both optional, both ISO-8601. */
export type DocumentDatesInput = {
  issuedAt?: string;
  expiresAt?: string;
};

/** The server only stores images for documents; it defaults to image/jpeg. */
function contentTypeFor(uri: string): string {
  const clean = uri.split("?")[0].toLowerCase();
  if (clean.endsWith(".png")) return "image/png";
  if (clean.endsWith(".webp")) return "image/webp";
  if (clean.endsWith(".heic") || clean.endsWith(".heif")) return "image/heic";
  return "image/jpeg";
}

/** True while the URI still points at the device rather than at storage. */
export function isLocalUri(uri: string | null | undefined): boolean {
  if (!uri) return false;
  return (
    uri.startsWith("file:") ||
    uri.startsWith("content:") ||
    uri.startsWith("ph:") ||
    uri.startsWith("assets-library:")
  );
}

/**
 * Uploads a locally picked image and registers it as a driver document.
 *
 * The registered value is `objectPath`, NOT `readUrl`. A read URL is a temporary
 * signed URL; persisting it would make the document unreadable once the
 * signature expires. The server stores the object key and regenerates a fresh
 * URL on every read (DriverSelfService.serialize -> StorageService.readUrl),
 * which returns the permanent public URL when R2_PUBLIC_URL is configured.
 *
 * `readUrl` from the ticket is still useful, but only for showing the image
 * immediately after the upload without waiting for a profile refetch.
 *
 * PHASE 1: the issue / expiry dates travel in step 3, with the registration,
 * not in step 1. The upload ticket is only about storage.
 *
 * Throws on failure so the caller keeps the driver on the screen instead of
 * pretending a document was submitted.
 */
export async function uploadDriverDocument(
  type: DocumentType,
  localUri: string,
  dates?: DocumentDatesInput,
): Promise<DriverDocument> {
  const contentType = contentTypeFor(localUri);

  const ticket = await driverApi.createUploadUrl({ kind: type, contentType });

  const file = await fetch(localUri);
  const blob = await file.blob();

  const uploaded = await fetch(ticket.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: blob,
  });
  if (!uploaded.ok) {
    throw new Error("DOCUMENT_UPLOAD_FAILED_" + uploaded.status);
  }

  // Keys are added only when they hold a value: AddDocumentDto validates
  // @IsDateString on presence, so an explicit undefined-turned-null would be a
  // 400 for every document that has no dates.
  const payload: {
    type: DocumentType;
    url: string;
    issuedAt?: string;
    expiresAt?: string;
  } = { type, url: ticket.objectPath };
  if (dates?.issuedAt) payload.issuedAt = dates.issuedAt;
  if (dates?.expiresAt) payload.expiresAt = dates.expiresAt;

  return driverApi.addDocument(payload);
}
