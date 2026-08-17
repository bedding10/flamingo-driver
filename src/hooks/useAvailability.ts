import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { driverApi, toApiError } from "../api";
import { useDriverStore } from "../stores/driver.store";
import {
  DRIVER_LISTEN,
  ensureSocketConnection,
  onSocketEvent,
  onSocketStatus,
} from "../socket/socket.service";
import { presenceStrings } from "../i18n/strings.presence";
import { DRIVER_PROFILE_KEY } from "./useDriverProfile";
import type { DriverAvailability, DriverProfile } from "../types/driver";

/**
 * The ONLINE / OFFLINE switch, wired to POST /driver/me/availability.
 *
 * Server rules are respected here rather than re-implemented in the UI, because
 * the server is the source of truth for all of them:
 *
 *  - ONLINE is refused with 403 unless the account is APPROVED.
 *  - ANY change is refused with 400 while availability is ON_TRIP. That is why
 *    the toggle is disabled in that state instead of being sent and failing.
 *  - PHASE 1: ONLINE is refused with 400 unless the server can see a live
 *    socket for this driver. A row saying ONLINE is not presence.
 *  - The response body is `{ availability }`, so it is applied verbatim.
 *
 * The update is optimistic (a driver taps this at a red light and must see it
 * flip immediately) and rolls back to the previous value on failure, so a
 * rejected request can never leave the app believing it is online while the
 * server has it offline - which would mean sitting there receiving nothing.
 */
export function useAvailability() {
  const queryClient = useQueryClient();
  const availability = useDriverStore((state) => state.availability);
  const setAvailability = useDriverStore((state) => state.setAvailability);
  const profile = useDriverStore((state) => state.profile);

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkUp, setLinkUp] = useState(false);

  const onTrip = availability === "ON_TRIP";
  const approved = profile?.status === "APPROVED";

  /** Mirrors the real link state; the ONLINE request needs it to succeed. */
  useEffect(
    () => onSocketStatus((next) => setLinkUp(next === "connected")),
    [],
  );

  /**
   * The server forces OFFLINE when the socket closes or the heartbeat expires,
   * and announces it on `driver:presence`. The app follows that decision
   * instead of keeping a stale ONLINE button: it is the same record the
   * matching engine reads.
   *
   * ON_TRIP is never overwritten here - an active trip is not a link state.
   */
  useEffect(
    () =>
      onSocketEvent(DRIVER_LISTEN.presence, (payload) => {
        if (payload.online) return;
        const current = useDriverStore.getState().availability;
        if (current !== "ONLINE") return;
        setAvailability("OFFLINE");
        queryClient.setQueryData<DriverProfile>(DRIVER_PROFILE_KEY, (cached) =>
          cached ? { ...cached, availability: "OFFLINE" } : cached,
        );
        setError(presenceStrings.forcedOffline);
      }),
    [queryClient, setAvailability],
  );

  const toggle = useCallback(async () => {
    if (pending || onTrip) return;
    const previous = availability;
    const next: Extract<DriverAvailability, "ONLINE" | "OFFLINE"> =
      previous === "ONLINE" ? "OFFLINE" : "ONLINE";

    // Going online without a link would be refused by the server, so the
    // request is not sent at all: a reconnect is started and the driver is told
    // why. Going OFFLINE is always allowed to proceed.
    if (next === "ONLINE" && !linkUp) {
      ensureSocketConnection();
      setError(presenceStrings.noLink);
      return;
    }

    setError(null);
    setPending(true);
    setAvailability(next);

    try {
      const result = await driverApi.setAvailability(next);
      const confirmed = result?.availability ?? next;
      setAvailability(confirmed);
      // Keep the cached profile in step so a remount does not resurrect the old
      // value from the query cache.
      queryClient.setQueryData<DriverProfile>(DRIVER_PROFILE_KEY, (current) =>
        current ? { ...current, availability: confirmed } : current,
      );
    } catch (caught) {
      setAvailability(previous);
      setError(toApiError(caught).message);
    } finally {
      setPending(false);
    }
  }, [availability, linkUp, onTrip, pending, queryClient, setAvailability]);

  return {
    availability,
    isOnline: availability === "ONLINE" || availability === "ON_TRIP",
    onTrip,
    /** The server would reject going online; the button is disabled instead. */
    blocked: !approved,
    /** True only while a real socket is connected. */
    linkUp,
    pending,
    error,
    clearError: () => setError(null),
    toggle,
  };
}
