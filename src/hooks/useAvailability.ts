import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { driverApi, toApiError } from "../api";
import { useDriverStore } from "../stores/driver.store";
import { DRIVER_PROFILE_KEY } from "./useDriverProfile";
import type { DriverAvailability, DriverProfile } from "../types/driver";

/**
 * The ONLINE / OFFLINE switch, wired to POST /driver/me/availability.
 *
 * Three server rules are respected here rather than being re-implemented in the
 * UI, because the server is the source of truth for all of them:
 *
 *  - ONLINE is refused with 403 unless the account is APPROVED.
 *  - ANY change is refused with 400 while availability is ON_TRIP. That is why
 *    the toggle is disabled in that state instead of being sent and failing.
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

  const onTrip = availability === "ON_TRIP";
  const approved = profile?.status === "APPROVED";

  const toggle = useCallback(async () => {
    if (pending || onTrip) return;
    const previous = availability;
    const next: Extract<DriverAvailability, "ONLINE" | "OFFLINE"> =
      previous === "ONLINE" ? "OFFLINE" : "ONLINE";

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
  }, [availability, onTrip, pending, queryClient, setAvailability]);

  return {
    availability,
    isOnline: availability === "ONLINE" || availability === "ON_TRIP",
    onTrip,
    /** The server would reject going online; the button is disabled instead. */
    blocked: !approved,
    pending,
    error,
    clearError: () => setError(null),
    toggle,
  };
}
