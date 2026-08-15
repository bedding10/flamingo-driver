import { api } from "./client";

/**
 * Trip chat, driver side.
 *
 * These map 1:1 onto the server's TripCommunicationController
 * (`/trip-communication/*`), which is the SAME controller the passenger app
 * talks to - one messaging system, two clients. Nothing here is driver-only.
 *
 * Authorisation is entirely server-side: tripParty() answers 404 for a trip the
 * caller is not part of, so a driver cannot read another ride's thread even by
 * guessing a UUID. The screen never has to police that.
 */

export type TripChatMessage = {
  id: string;
  tripId: string;
  senderId: string;
  body: string;
  /** ISO timestamp, or null while the other party has not opened the thread. */
  readAt: string | null;
  createdAt: string;
};

/**
 * What the driver is allowed to do right now.
 *
 * `canChat` is the server's decision, derived from the
 * `passenger.tripCommunication` setting AND the live trip status. The app must
 * not re-derive it from the status alone: staff can disable chat globally.
 */
export type TripCommunicationContext = {
  tripId: string;
  status: string;
  active: boolean;
  canChat: boolean;
  canCall: boolean;
  phoneMode: "HIDDEN" | "DIRECT" | "BRIDGE";
  /** Only ever populated when the server decided a number may be revealed. */
  phoneNumber: string | null;
  unreadCount: number;
  participant: { id: string; name: string | null; avatarUrl: string | null };
};

export type TripMessagePage = {
  items: TripChatMessage[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
};

/** GET /trip-communication/:tripId */
export async function fetchTripCommunication(tripId: string) {
  const { data } = await api.get("/trip-communication/" + tripId);
  return data as TripCommunicationContext;
}

/** GET /trip-communication/:tripId/messages */
export async function fetchTripMessages(tripId: string, page = 1, limit = 50) {
  const { data } = await api.get("/trip-communication/" + tripId + "/messages", {
    params: { page, limit },
  });
  return data as TripMessagePage;
}

/** POST /trip-communication/:tripId/messages */
export async function sendTripMessage(tripId: string, body: string) {
  const { data } = await api.post(
    "/trip-communication/" + tripId + "/messages",
    { body },
  );
  return data as TripChatMessage;
}

/**
 * POST /trip-communication/:tripId/messages/read
 *
 * Clears the unread badge by marking the PASSENGER's messages read. The server
 * decides which rows those are (`senderId != me`), so this cannot be abused to
 * mark one's own messages as read.
 */
export async function markTripMessagesRead(tripId: string) {
  const { data } = await api.post(
    "/trip-communication/" + tripId + "/messages/read",
  );
  return data as { updated: number; readAt: string };
}
