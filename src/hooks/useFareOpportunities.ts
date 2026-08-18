import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  claimFareQuote,
  listFareOpportunities,
  submitFareOffer,
  withdrawFareOffer,
} from "../api/fareOffers.api";
import { reportRequest, type ComplaintReason } from "../api/complaints.api";
import { fetchDriverTrip } from "../api/driver.api";
import { toApiError } from "../api/client";
import { DRIVER_PROFILE_KEY } from "./useDriverProfile";
import { joinTripRoom, onSocketEvent } from "../socket/socket.service";
import { useDriverStore } from "../stores/driver.store";
import { useTripStore } from "../stores/trip.store";
import type { FareOpportunity } from "../types/fareOffer";
import type { RideClass } from "../types/driver";
import type { Trip } from "../types/trip";
import { requestErrorText, requestStrings } from "../i18n/strings.requests";

export const FARE_OPPORTUNITIES_KEY = ["fare", "opportunities"] as const;

/**
 * Open bidding requests are pulled, not pushed: the server has no
 * "fare:quote_created" broadcast to drivers, so a poll is the only honest way
 * to keep the list fresh. 15s stays well inside the 60s bid TTL that PHASE 2
 * introduced without hammering the API.
 */
const POLL_MS = 15_000;

/**
 * What the screen may narrow the list by. Everything here is applied by the
 * SERVER (proximity, radius, ride class); nothing is filtered locally, so the
 * list the driver sees is the list the server would act on.
 */
export type FareOpportunityFiltersInput = {
  lat?: number | null;
  lng?: number | null;
  radiusKm?: number | null;
  rideClass?: RideClass | null;
};

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
  /** Set when the request became this driver's trip; caller leaves for Home. */
  acceptedTripId: string | null;
  refresh: () => void;
  bid: (quoteId: string, amount: number) => void;
  withdraw: (offerId: string) => void;
  /** PHASE 2 direct accept: no confirmation, no passenger consent step. */
  directAccept: (quoteId: string, amount?: number) => void;
  /** Swipe action: drop the row for this session only (nothing is persisted). */
  hide: (quoteId: string) => void;
  /** Swipe action: a real complaint in the dashboard, not a local dismissal. */
  report: (input: {
    fareQuoteId: string;
    againstUserId: string;
    reason: ComplaintReason;
    message?: string;
  }) => void;
};

/**
 * Owns the negotiation list: GET opportunities, POST a bid, withdraw a bid,
 * direct accept, the swipe actions, and the three driver-side `fare:*` events.
 *
 * The eligibility rules are NOT reimplemented here. The server decides
 * (APPROVED + ONLINE + verified vehicle + city/class match) and the local
 * availability is used only to avoid firing a request that is certain to fail
 * with FARE_OFFER_DRIVER_UNAVAILABLE.
 */
export function useFareOpportunities(
  filters: FareOpportunityFiltersInput = {},
): FareOpportunitiesState {
  const queryClient = useQueryClient();
  const profile = useDriverStore((state) => state.profile);
  const availability = useDriverStore((state) => state.availability);
  const setCurrentTrip = useTripStore((state) => state.setCurrentTrip);

  const [notice, setNotice] = useState<string | null>(null);
  const [acceptedTripId, setAcceptedTripId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);

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

  const lat = filters.lat ?? null;
  const lng = filters.lng ?? null;
  const radiusKm = filters.radiusKm ?? null;
  const rideClass = filters.rideClass ?? null;
  // One primitive key instead of four dependencies, so the query identity and
  // the effect dependencies stay stable and lint-clean.
  const contextKey = [lat ?? "", lng ?? "", radiusKm ?? "", rideClass ?? ""].join(
    "|",
  );

  const query = useQuery({
    queryKey: [...FARE_OPPORTUNITIES_KEY, contextKey],
    queryFn: () =>
      listFareOpportunities({
        limit: 20,
        lat: lat ?? undefined,
        lng: lng ?? undefined,
        radiusKm: radiusKm ?? undefined,
        rideClass: rideClass ?? undefined,
      }),
    enabled,
    refetchInterval: enabled ? POLL_MS : false,
    // A stale bidding list is worse than an empty one.
    staleTime: 0,
  });

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: FARE_OPPORTUNITIES_KEY });
  }, [queryClient]);

  /** Shared tail of "this request is now my trip", from either path. */
  const enterTrip = useCallback(
    (tripId: string, tripStatus?: string) => {
      setAcceptedTripId(tripId);
      joinTripRoom(tripId);
      setCurrentTrip({ id: tripId, status: (tripStatus ?? "ACCEPTED") as Trip["status"] });
      void fetchDriverTrip(tripId)
        .then((data) => {
          const trip = data as Trip | null;
          if (trip?.id) setCurrentTrip(trip);
        })
        .catch(() => undefined);
      void queryClient.invalidateQueries({ queryKey: DRIVER_PROFILE_KEY });
      invalidate();
    },
    [invalidate, queryClient, setCurrentTrip],
  );

  useEffect(() => {
    const offs = [
      onSocketEvent("fare:offer_accepted", (payload) => {
        if (!payload?.tripId) return;
        setNotice(requestStrings.acceptedBody);

        // The trip and the assignment were created inside one transaction on the
        // server, so the room join and the profile re-read must happen at once.
        // Availability is NOT set locally: GET /driver/me is the only source.
        enterTrip(payload.tripId, payload.tripStatus);
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
  }, [enterTrip, invalidate]);

  const bidMutation = useMutation({
    mutationFn: (input: { fareQuoteId: string; amount: number }) =>
      submitFareOffer(input),
  });

  const withdrawMutation = useMutation({
    mutationFn: (offerId: string) => withdrawFareOffer(offerId),
  });

  const claimMutation = useMutation({
    mutationFn: (input: { fareQuoteId: string; amount?: number }) =>
      claimFareQuote(input),
  });

  const reportMutation = useMutation({
    mutationFn: (input: {
      fareQuoteId: string;
      againstUserId: string;
      reason: ComplaintReason;
      message: string;
    }) => reportRequest(input),
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

  const directAccept = useCallback(
    (quoteId: string, amount?: number) => {
      if (busyId) return;
      setActionError(null);
      setNotice(null);
      setBusyId(quoteId);
      claimMutation
        .mutateAsync({ fareQuoteId: quoteId, amount })
        .then((claimed) => {
          setNotice(requestStrings.directAcceptDone);
          enterTrip(claimed.tripId, claimed.tripStatus);
        })
        .catch((err) => setActionError(requestErrorText(toApiError(err).code)))
        .finally(() => setBusyId(null));
    },
    [busyId, claimMutation, enterTrip],
  );

  const hide = useCallback((quoteId: string) => {
    setHiddenIds((prev) => (prev.includes(quoteId) ? prev : [...prev, quoteId]));
    setNotice(requestStrings.hidden);
  }, []);

  const report = useCallback(
    (input: {
      fareQuoteId: string;
      againstUserId: string;
      reason: ComplaintReason;
      message?: string;
    }) => {
      if (busyId) return;
      setActionError(null);
      setNotice(null);
      setBusyId(input.fareQuoteId);
      const message =
        input.message?.trim() ||
        requestStrings.reasons[input.reason] ||
        requestStrings.report;
      reportMutation
        .mutateAsync({
          fareQuoteId: input.fareQuoteId,
          againstUserId: input.againstUserId,
          reason: input.reason,
          message,
        })
        .then(() => {
          setNotice(requestStrings.reportSent);
          // A reported request also leaves this driver's list for the session.
          setHiddenIds((prev) =>
            prev.includes(input.fareQuoteId)
              ? prev
              : [...prev, input.fareQuoteId],
          );
        })
        .catch((err) => setActionError(requestErrorText(toApiError(err).code)))
        .finally(() => setBusyId(null));
    },
    [busyId, reportMutation],
  );

  const listError = query.error
    ? requestErrorText(toApiError(query.error).code)
    : null;

  const items = useMemo(
    () => (query.data ?? []).filter((item) => !hiddenIds.includes(item.id)),
    [query.data, hiddenIds],
  );

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
    directAccept,
    hide,
    report,
  };
}
