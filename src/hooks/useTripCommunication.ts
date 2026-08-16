import { useCallback, useEffect, useMemo, useState } from "react";
import { Linking } from "react-native";
import {
  fetchTripCommunication,
  type TripCommunicationContext,
} from "../api/trip-communication.api";
import { onSocketEvent } from "../socket/socket.service";
import type { Trip } from "../types/trip";

/**
 * PHASE 4 - the communication state of the RUNNING trip, as the server sees it.
 *
 * This hook adds no endpoint and decides no policy. Everything it exposes comes
 * from GET /trip-communication/:tripId, which already answers three questions
 * the driver app was throwing away:
 *
 *   - `unreadCount`: passenger messages with readAt = null. ActiveTripCard has
 *     always accepted an `unreadCount` prop and nobody ever passed it, so the
 *     badge could not appear: a driver on the road had no idea a passenger had
 *     written to them until they opened the thread on a hunch.
 *   - `canCall` / `phoneNumber`: whether calling is allowed AND the number to
 *     dial. The server derives both from the `passenger.tripCommunication`
 *     setting (phoneMode HIDDEN / DIRECT / BRIDGE) and the live trip status, so
 *     the app must never infer a number from the trip payload - /driver/me/trips
 *     returns the passenger phone masked through maskPhone() on purpose.
 *   - `canChat`: the same server decision the chat screen uses.
 *
 * The context is re-read whenever the trip status changes, because callability
 * is bound to the status: a number that may be dialled while IN_PROGRESS must
 * stop being offered the moment the ride ends.
 */
export type TripCommunicationState = {
  /** Unread passenger messages for the running trip. 0 when there is none. */
  unreadCount: number;
  /** The number the server authorised, or null when it must stay hidden. */
  callablePhone: string | null;
  canChat: boolean;
  /** Called when the driver opens the thread; the receipt itself is the API's. */
  clearUnread: () => void;
  /** Resolves false when the dialler could not be opened. */
  call: () => Promise<boolean>;
};

export function useTripCommunication(
  trip: Trip | null | undefined,
): TripCommunicationState {
  const [context, setContext] = useState<TripCommunicationContext | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // One dependency instead of two: the effect must re-run for a new trip AND
  // for a new status, and folding both into a string keeps that explicit.
  const contextKey = useMemo(
    () => (trip?.id ? trip.id + "|" + (trip.status ?? "") : null),
    [trip?.id, trip?.status],
  );

  useEffect(() => {
    if (!contextKey) {
      setContext(null);
      setUnreadCount(0);
      return;
    }
    const tripId = contextKey.slice(0, contextKey.indexOf("|"));
    let cancelled = false;

    // Failure is silent on purpose: this only decorates the trip card. A driver
    // must never be blocked from advancing a ride because a badge call failed.
    void fetchTripCommunication(tripId)
      .then((ctx) => {
        if (cancelled) return;
        setContext(ctx);
        setUnreadCount(ctx.unreadCount);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [contextKey]);

  const tripId = trip?.id ?? null;
  const participantId = context?.participant?.id ?? null;

  // Incoming message. Ownership is decided by the passenger user id the server
  // returned, not by a local id: the driver app stores a DRIVER profile, and
  // driver.id is NOT the user id used as TripMessage.senderId.
  useEffect(() => {
    if (!tripId || !participantId) return;
    return onSocketEvent("trip:message", (payload) => {
      if (payload?.tripId !== tripId) return;
      if (payload?.senderId !== participantId) return;
      setUnreadCount((current) => current + 1);
    });
  }, [tripId, participantId]);

  // A read receipt raised by US (the reader is not the passenger) means the
  // thread was opened somewhere in this app, so the badge is spent.
  useEffect(() => {
    if (!tripId || !participantId) return;
    return onSocketEvent("trip:messages_read", (payload) => {
      if (payload?.tripId !== tripId) return;
      if (payload?.readerId === participantId) return;
      setUnreadCount(0);
    });
  }, [tripId, participantId]);

  const clearUnread = useCallback(() => setUnreadCount(0), []);

  const callablePhone =
    context?.canCall === true && context.phoneNumber ? context.phoneNumber : null;

  const call = useCallback(async () => {
    if (!callablePhone) return false;
    try {
      await Linking.openURL("tel:" + callablePhone);
      return true;
    } catch {
      return false;
    }
  }, [callablePhone]);

  return {
    unreadCount,
    callablePhone,
    canChat: context?.canChat === true,
    clearUnread,
    call,
  };
}
