import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listFareOpportunities,
  submitFareOffer,
  withdrawFareOffer,
} from "../api/fareOffers.api";
import { fetchDriverTrip } from "../api/driver.api";
import { toApiError } from "../api/client";
import { DRIVER_PROFILE_KEY } from "./useDriverProfile";
import { joinTripRoom, onSocketEvent } from "../socket/socket.service";
import { useDriverStore } from "../stores/driver.store";
import { useTripStore } from "../stores/trip.store";
import type { FareOpportunity } from "../types/fareOffer";
import type { Trip } from "../types/trip";
import { requestErrorText, requestStrings } from "../i18n/strings.requests";

export const FARE_OPPORTUNITIES_KEY = ["fare", "opportunities"] as const;

/**
 * Open bidding requests are pulled, not pushed: the server has no
 * "fare:quote_created" broadcast to drivers, so a poll is the only honest way
 * to keep the list fresh. 15s matches the shortest useful reaction window
 * against a 120s bid TTL without hammering the API.
 */
const POLL_MS = 15_000;

export type FareOpportunitiesState = {
  items: FareOpportunity[];
  loading: boolean;
  refreshing: boolean;
  /** True when the driver is not allowed to bid at all right now. */
  blocked: boolean;
  blockedReason: string | null;
  error: string | null;
  /** Quote id whose bid is being sent, or offer id being withdrawn. */
  busyId: string | null;
  notice: string | null;
  dismissNotice: () => void;
  /** Set when the passenger accepted a bid; the caller should leave for Home. */
  acceptedTripId: string | null;
  refresh: () => void;
  bid: (quoteId: string, amount: number) => void;
  withdraw: (offerId: string) => void;
};

/**
 * Owns the negotiation list: GET opportunities, POST a bid, withdraw a bid, and
 * the three driver-side `fare:*` events.
 *
 * The eligibility rules are NOT reimplemented here. The server decides
 * (APPROVED + ONLINE + verified vehicle + city/class match) and the local
 * availability is used only to avoid firing a request that is certain to fail
 * with FARE_OFFER_DRIVER_UNAVAILABLE.
 */
export function useFareOpportunities(): FareOpportunitiesState {
  const queryClient = useQueryClient();
  const profile = useDriverStore((state) => state.profile);
  const availability = useDriverStore((state) => state.availability);
  const setCurrentTrip = useTripStore((state) => state.setCurrentTrip);

  const [notice, setNotice] = useState<string | null>(null);
  const [acceptedTripId, setAcceptedTripId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const approved = profile?.approved ?? false;
  const onTrip = availability === "ON_TRIP";
  const online = availability === "ONLINE";
  const enabled = approved && online;

  const blockedReason = !approved
    ? requestStrings.notApproved
    : onTrip
      ? requestStrings.onTrip
      : !online
        ? requestStrings.offlineHint
        : null;

  const query = useQuery({
    queryKey: FARE_OPPORTUNITIES_KEY,
    queryFn: () => listFareOpportunities(20),
    enabled,
    refetchInterval: enabled ? POLL_MS : false,
    // A stale bidding list is worse than an empty one.
    staleTime: 0,
  });

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: FARE_OPPORTUNITIES_KEY });
  }, [queryClient]);

  useEffect(() => {
    const offs = [
      onSocketEvent("fare:offer_accepted", (payload) => {
        if (!payload?.tripId) return;
        setNotice(requestStrings.acceptedBody);
        setAcceptedTripId(payload.tripId);

        // acceptOffer() created the trip and assigned this driver inside one
        // transaction, so the room join and the profile re-read must happen at
        // once. Availability is NOT set locally: GET /driver/me is the only
        // source for it.
        joinTripRoom(payload.tripId);
        setCurrentTrip({ id: payload.tripId, status: payload.tripStatus });
        void fetchDriverTrip(payload.tripId)
          .then((data) => {
            const trip = data as Trip | null;
            if (trip?.id) setCurrentTrip(trip);
          })
          .catch(() => undefined);
        void queryClient.invalidateQueries({ queryKey: DRIVER_PROFILE_KEY });
        invalidate();
      }),

      onSocketEvent("fare:offer_rejected", (payload) => {
        if (!payload?.offerId) return;
        setNotice(
          payload.reason === "another_offer_accepted"
            ? requestStrings.rejectedOther
            : requestStrings.rejected,
        );
        invalidate();
      }),

      onSocketEvent("fare:offer_expired", (payload) => {
        if (!payload?.offerId) return;
        setNotice(requestStrings.expired);
        invalidate();
      }),
    ];
    return () => offs.forEach((off) => off());
  }, [invalidate, queryClient, setCurrentTrip]);

  const bidMutation = useMutation({
    mutationFn: (input: { fareQuoteId: string; amount: number }) =>
      submitFareOffer(input),
  });

  const withdrawMutation = useMutation({
    mutationFn: (offerId: string) => withdrawFareOffer(offerId),
  });

  const bid = useCallback(
    (quoteId: string, amount: number) => {
      if (busyId) return;
      setActionError(null);
      setNotice(null);
      setBusyId(quoteId);
      bidMutation
        .mutateAsync({ fareQuoteId: quoteId, amount })
        .then(() => {
          setNotice(requestStrings.myOfferPending);
          invalidate();
        })
        .catch((err) => setActionError(requestErrorText(toApiError(err).code)))
        .finally(() => setBusyId(null));
    },
    [bidMutation, busyId, invalidate],
  );

  const withdraw = useCallback(
    (offerId: string) => {
      if (busyId) return;
      setActionError(null);
      setNotice(null);
      setBusyId(offerId);
      withdrawMutation
        .mutateAsync(offerId)
        .then(() => invalidate())
        .catch((err) => setActionError(requestErrorText(toApiError(err).code)))
        .finally(() => setBusyId(null));
    },
    [busyId, invalidate, withdrawMutation],
  );

  const listError = query.error
    ? requestErrorText(toApiError(query.error).code)
    : null;

  const items = useMemo(() => query.data ?? [], [query.data]);

  return {
    items,
    loading: enabled && query.isLoading,
    refreshing: query.isFetching && !query.isLoading,
    blocked: !enabled,
    blockedReason,
    error: actionError ?? listError,
    busyId,
    notice,
    dismissNotice: () => setNotice(null),
    acceptedTripId,
    refresh: () => void query.refetch(),
    bid,
    withdraw,
  };
}
