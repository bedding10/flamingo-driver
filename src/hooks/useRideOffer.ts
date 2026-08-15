import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { fetchDriverTrip } from "../api/driver.api";
import { DRIVER_PROFILE_KEY } from "./useDriverProfile";
import {
  acceptRide,
  declineRide,
  joinTripRoom,
  onSocketEvent,
} from "../socket/socket.service";
import { useDriverStore } from "../stores/driver.store";
import { useTripStore } from "../stores/trip.store";
import type { Trip } from "../types/trip";
import { strings } from "../i18n/strings";

/**
 * How long to wait for `ride:assigned` after emitting `ride:accept`.
 *
 * The server does NOT acknowledge ride:accept. RealtimeGateway.onRideAccept is
 * void and MatchingService.assignDriver can fail silently on a lost race
 * ("trip-not-searching", or the driver row already claimed). In that case the
 * only event the driver may get is ride:offer_expired - and sometimes nothing
 * at all. Without this timer the card would spin forever, so the driver is told
 * the truth instead of being left staring at a frozen screen.
 */
const ASSIGN_TIMEOUT_MS = 10_000;

export type RideOfferState = {
  offer: ReturnType<typeof useTripStore.getState>["offer"];
  /** True while an accept is waiting for the server to confirm assignment. */
  awaiting: boolean;
  notice: string | null;
  dismissNotice: () => void;
  accept: (tripId: string) => void;
  decline: (tripId: string) => void;
};

/**
 * Owns the ride offer lifecycle: ride:offer -> accept/decline -> ride:assigned.
 *
 * Every event name and payload field here is taken from MatchingService; no
 * offer state is invented client side.
 */
export function useRideOffer(): RideOfferState {
  const queryClient = useQueryClient();

  const offer = useTripStore((state) => state.offer);
  const setOffer = useTripStore((state) => state.setOffer);
  const expireOffer = useTripStore((state) => state.expireOffer);
  const setCurrentTrip = useTripStore((state) => state.setCurrentTrip);
  const setAvailability = useDriverStore((state) => state.setAvailability);

  const [awaiting, setAwaiting] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Mirrors of the state above, read inside socket listeners. The listeners are
  // registered once; reading React state directly there would capture the first
  // render's value forever (the stale-closure bug already fixed in the
  // passenger app).
  const awaitingRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAwait = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    awaitingRef.current = null;
    setAwaiting(null);
  }, []);

  useEffect(() => {
    const offs = [
      onSocketEvent("ride:offer", (payload) => {
        if (!payload?.tripId) return;
        clearAwait();
        setNotice(null);
        setOffer(payload);
        // A driver is usually looking at the road, not the phone.
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        ).catch(() => undefined);
      }),

      onSocketEvent("ride:assigned", (payload) => {
        const tripId = payload?.tripId;
        if (!tripId) return;
        clearAwait();
        setNotice(null);
        expireOffer(tripId);

        // assignDriver() already flipped the driver row to ON_TRIP inside its
        // transaction, so the local availability must follow immediately -
        // otherwise the toggle would still offer to "go offline" on a ride the
        // server will refuse to change.
        setAvailability("ON_TRIP");
        void queryClient.invalidateQueries({ queryKey: DRIVER_PROFILE_KEY });

        joinTripRoom(tripId);

        // Show something instantly from what is already known, then replace it
        // with the authoritative record. ride:assigned carries only { tripId }.
        setCurrentTrip({ id: tripId, status: "ACCEPTED" });
        void fetchDriverTrip(tripId)
          .then((data) => {
            const trip = data as Trip | null;
            if (trip?.id) setCurrentTrip(trip);
          })
          .catch(() => undefined);
      }),

      onSocketEvent("ride:offer_expired", (payload) => {
        const tripId = payload?.tripId;
        if (!tripId) return;
        const wasAccepted = awaitingRef.current === tripId;
        if (wasAccepted) clearAwait();
        if (wasAccepted || useTripStore.getState().offer?.tripId === tripId) {
          setNotice(
            payload.reason === "accepted_by_another_driver" || wasAccepted
              ? strings.offer.lostRace
              : strings.offer.expired,
          );
        }
        expireOffer(tripId);
      }),

      onSocketEvent("ride:error", (payload) => {
        clearAwait();
        setNotice(
          payload?.message === "rate_limited"
            ? strings.offer.rateLimited
            : strings.offer.failed,
        );
      }),
    ];

    return () => {
      offs.forEach((off) => off());
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [
    clearAwait,
    expireOffer,
    queryClient,
    setAvailability,
    setCurrentTrip,
    setOffer,
  ]);

  const accept = useCallback(
    (tripId: string) => {
      if (awaitingRef.current) return; // double tap guard
      setNotice(null);
      awaitingRef.current = tripId;
      setAwaiting(tripId);
      acceptRide(tripId);
      timerRef.current = setTimeout(() => {
        if (awaitingRef.current !== tripId) return;
        clearAwait();
        expireOffer(tripId);
        setNotice(strings.offer.notConfirmed);
      }, ASSIGN_TIMEOUT_MS);
    },
    [clearAwait, expireOffer],
  );

  const decline = useCallback(
    (tripId: string) => {
      clearAwait();
      setNotice(null);
      declineRide(tripId);
      // Dropped locally at once: the server frees the offer for the next driver
      // and sends nothing back to the one who refused.
      expireOffer(tripId);
    },
    [clearAwait, expireOffer],
  );

  const dismissNotice = useCallback(() => setNotice(null), []);

  return { offer, awaiting: awaiting !== null, notice, dismissNotice, accept, decline };
}
