import { api } from "./client";

/**
 * Legal documents — dashboard-managed, app-rendered.
 *
 * The backend owns every word: LegalDocument rows are written and published in
 * the admin panel (POST /legal-documents, POST /legal-documents/:id/publish),
 * and the app only reads the PUBLISHED ones. GET /public/legal is intentionally
 * unauthenticated (@Public on the server) so the terms can also be shown before
 * sign-in.
 *
 * Server contract (LegalService.publicList): the row is returned with
 * publishedTitle/publishedBody preferred over the draft title/body, so what the
 * app receives is always the published revision, never an in-progress edit.
 */

export type LegalDocumentType =
  | "TERMS_OF_SERVICE"
  | "PRIVACY_POLICY"
  | "DRIVER_AGREEMENT"
  | "COOKIE_POLICY"
  | "REFUND_POLICY";

export type LegalAudience = "ALL" | "PASSENGER" | "DRIVER";

export type PublicLegalDocument = {
  id: string;
  type: LegalDocumentType;
  audience: LegalAudience;
  locale: string;
  title: string;
  body: string;
  summary: string | null;
  /** publishedVersion — 0 means nothing has been published yet. */
  version: number;
  requiresAcceptance: boolean;
  effectiveAt: string | null;
  publishedAt: string | null;
};

/**
 * GET /public/legal?audience=DRIVER&locale=ar
 *
 * The server widens `audience=DRIVER` to DRIVER + ALL, so shared documents
 * (cookie/refund policies written once for both apps) still arrive.
 */
export async function fetchPublicLegalDocuments(params?: {
  audience?: LegalAudience;
  locale?: string;
}): Promise<PublicLegalDocument[]> {
  const { data } = await api.get("/public/legal", {
    params: {
      audience: params?.audience ?? "DRIVER",
      locale: params?.locale ?? "ar",
    },
  });
  return (Array.isArray(data) ? data : []) as PublicLegalDocument[];
}

/**
 * GET /legal-documents/pending — documents this signed-in driver still has to
 * accept, and POST /legal-documents/:id/accept to record the consent.
 *
 * Not wired to a screen yet; kept here because the acceptance gate is the next
 * step after this screen and the endpoints already exist on the server.
 */
export async function fetchPendingConsents() {
  const { data } = await api.get("/legal-documents/pending");
  return data as {
    pending: PublicLegalDocument[];
    accepted: PublicLegalDocument[];
  };
}

/** POST /legal-documents/:id/accept */
export async function acceptLegalDocument(documentId: string) {
  const { data } = await api.post(
    "/legal-documents/" + documentId + "/accept",
    {},
  );
  return data as unknown;
}
