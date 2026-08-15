import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { fetchDriverTrip, fetchDriverTrips } from "../api/driver.api";
import { toApiError } from "../api/client";
import {
  cancelTrip,
  completeTrip,
  markArriving,
  startTrip,
} from "../api/trip.api";
import { DRIVER_PROFILE_KEY } from "./useDriverProfile";
import {
  joinTripRoom,
  leaveTripRoom,
  onSocketEvent,
} from "../socket/socket.service";
import { useDriverStore } from "../stores/driver.store";
import { useTripStore } from "../stores/trip.store";
import { isTerminalTripStatus, type Trip, type TripStatus } from "../types/trip";
import { strings } from "../i18n/strings";

/**
 * Client mirror of TRANSITIONS in the server's trip-transitions.ts.
 *
 * It is a copy, and a copy can drift, so it is used only to decide which button
 * to draw - never to decide whether the change is legal. The server rejects an
 * illegal move with "Invalid transition X -> Y" and that answer always wins.
 */
const NEXT_STATUS: Partial<Record<TripStatus, TripStatus>> = {
  ACCEPTED: "ARRIVING",
  ARRIVING: "IN_PROGRESS",
  IN_PROGRESS: "COMPLETED",
};

/** A trip the driver is still working on. SEARCHING has no driver yet. */
function isActive(trip: Trip | null | undefined): boolean {
  if (!trip?.status) return false;
  return (
    !isTerminalTripStatus(trip.status) &&
    trip.status !== "SEARCHING" &&
    trip.status !== "SCHEDULED"
  );
}

export type TripLifecycleState = {
  trip: Trip | null;
  /** The status the primary button moves to, or null when there is none. */
  nextStatus: TripStatus | null;
  pending: boolean;
  error: string | null;
  clearError: () => void;
  advance: () => Promise<void>;
  cancel: (reason?: string) => Promise<void>;
};

/**
 * Drives ACCEPTED -> ARRIVING -> IN_PROGRESS -> COMPLETED over the REST routes
 * under /driver/trips/:id, and keeps the local trip in step with trip:status.
 */
export function useTripLifecycle(): TripLifecycleState {
  const queryClient = useQueryClient();

  const trip = useTripStore((state) => state.currentTrip);
  const setCurrentTrip = useTripStore((state) => state.setCurrentTrip);
  const applyStatus = useTripStore((state) => state.applyStatus);
  const setAvailability = useDriverStore((state) => state.setAvailability);

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pendingRef = useRef(false);

  /**
   * Cleanup shared by every ending, whoever caused it.
   *
   * The server's releaseDriver() sets the driver row back to ONLINE inside the
   * same call that completes or cancels the trip, so the app mirrors exactly
   * that - it does not decide the availability itself.
   */
  const finish = useCallback(
    (tripId: string) => {
      leaveTripRoom(tripId);
      setAvailability("ONLINE");
      void queryClient.invalidateQueries({ queryKey: DRIVER_PROFILE_KEY });
    },
    [queryClient, setAvailability],
  );

  // trip:status is the shared truth: it also fires when the passenger cancels
  // or staff intervenes, which is the only way the driver hears about those.
  useEffect(() => {
    return onSocketEvent("trip:status", (payload) => {
      const tripId = payload?.tripId;
      const status = payload?.status;
      if (!tripId || !status) return;
      if (useTripStore.getState().currentTrip?.id !== tripId) return;
      applyStatus(tripId, status);
      if (isTerminalTripStatus(status)) finish(tripId);
    });
  }, [applyStatus, finish]);

  // Cold start with a ride already running: the app may have been killed mid
  // trip. /driver/me/trips is an existing endpoint, so no new route is needed.
  useEffect(() => {
    if (useTripStore.getState().currentTrip) return;
    let cancelled = false;
    void fetchDriverTrips({ page: 1, limit: 5 })
      .then((data) => {
        if (cancelled) return;
        const items = (data as { items?: Trip[] } | null)?.items ?? [];
        const active = items.find(isActive);
        if (!active) return;
        setCurrentTrip(active);
        joinTripRoom(active.id);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [setCurrentTrip]);

  const run = useCallback(
    async (action: (tripId: string) => Promise<Trip>) => {
      const current = useTripStore.getState().currentTrip;
      if (!current?.id || pendingRef.current) return;
      pendingRef.current = true;
      setPending(true);
      setError(null);
      try {
        const updated = await action(current.id);
        const status = updated?.status ?? current.status;
        if (isTerminalTripStatus(status)) {
          finish(current.id);
          setCurrentTrip(null);
        } else {
          setCurrentTrip({ ...current, ...updated });
        }
      } catch (caught) {
        const apiError = toApiError(caught);
        const stale = apiError.message.includes("Invalid transition");
        setError(stale ? strings.trip.invalidTransition : apiError.message);
        if (stale) {
          // Local state lost the race. Reload the record instead of guessing.
          void fetchDriverTrip(current.id)
            .then((data) => {
              const fresh = data as Trip | null;
              if (!fresh?.id) return;
              if (isTerminalTripStatus(fresh.status)) {
                finish(fresh.id);
                setCurrentTrip(null);
              } else {
                setCurrentTrip(fresh);
              }
            })
            .catch(() => undefined);
        }
      } finally {
        pendingRef.current = false;
        setPending(false);
      }
    },
    [finish, setCurrentTrip],
  );

  const advance = useCallback(async () => {
    const current = useTripStore.getState().currentTrip;
    const next = current?.status ? NEXT_STATUS[current.status] : undefined;
    if (!next) return;
    if (next === "ARRIVING") await run(markArriving);
    else if (next === "IN_PROGRESS") await run(startTrip);
    else await run(completeTrip);
  }, [run]);

  const cancel = useCallback(
    async (reason?: string) => {
      await run((tripId) => cancelTrip(tripId, reason));
    },
    [run],
  );

  return {
    trip: isActive(trip) ? trip : null,
    nextStatus: trip?.status ? NEXT_STATUS[trip.status] ?? null : null,
    pending,
    error,
    clearError: useCallback(() => setError(null), []),
    advance,
    cancel,
  };
}
