import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { driverApi } from "../api";
import { onSocketEvent } from "../socket/socket.service";
import { useDriverStore } from "../stores/driver.store";
import type { DriverProfile, UpdateDriverProfileInput } from "../types/driver";

export const DRIVER_PROFILE_KEY = ["driver", "me"] as const;

/**
 * GET /driver/me, mirrored into the driver store.
 *
 * One query key for the whole app so approval status, availability and the
 * vehicle card can never disagree with each other. The store copy keeps the
 * cached profile available to non-React code (socket handlers, services).
 */
export function useDriverProfile() {
  const setProfile = useDriverStore((state) => state.setProfile);
  const queryClient = useQueryClient();

  const query = useQuery<DriverProfile>({
    queryKey: DRIVER_PROFILE_KEY,
    queryFn: driverApi.fetchDriverProfile,
    // Approval can be granted by an operator at any moment, so this is cheap to
    // refetch and expensive to serve stale.
    staleTime: 30_000,
  });

  useEffect(() => {
    if (query.data) setProfile(query.data);
  }, [query.data, setProfile]);

  // Phase 11 - the server announces a new level on the driver's own room after
  // a completed trip. We do not read the level from the payload: we invalidate
  // this query so the frame and the count come back from GET /driver/me, which
  // stays the single source. No new realtime layer, no new event stream.
  useEffect(
    () =>
      onSocketEvent("profile:level", () => {
        void queryClient.invalidateQueries({ queryKey: DRIVER_PROFILE_KEY });
      }),
    [queryClient],
  );

  return query;
}

/**
 * PATCH /driver/me.
 *
 * The response is the full refreshed profile, so the cache is seeded from it
 * directly: one round trip instead of save-then-refetch, and no window where the
 * screen shows the old values.
 */
export function useUpdateDriverProfile() {
  const queryClient = useQueryClient();
  const setProfile = useDriverStore((state) => state.setProfile);

  return useMutation<DriverProfile, unknown, UpdateDriverProfileInput>({
    mutationFn: driverApi.updateDriverProfile,
    onSuccess: (profile) => {
      queryClient.setQueryData(DRIVER_PROFILE_KEY, profile);
      setProfile(profile);
    },
  });
}
