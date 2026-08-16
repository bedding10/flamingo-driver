import { useCallback, useEffect } from "react";
import { AppState } from "react-native";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { notificationsApi } from "../api";
import type { AppNotification } from "../api/notifications.api";

export const NOTIFICATIONS_KEY = ["notifications", "me"] as const;

/** One page is enough: the server orders by createdAt desc. */
const PAGE_LIMIT = 30;

export type NotificationsState = {
  items: AppNotification[];
  total: number;
  unreadCount: number;
  loading: boolean;
  failed: boolean;
  refetch: () => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  remove: (id: string) => void;
  mutating: boolean;
};

/**
 * PHASE 7 - one refresh rule for the inbox, in one place.
 *
 * There is NO socket event for a new notification: RealtimeGateway emits
 * ride:*, trip:*, driver:moved, fare:* and profile:level, and
 * NotificationsService never touches the gateway (verified by reading both).
 * So the badge cannot be push-driven, and inventing an event would mean
 * changing the backend contract for a counter.
 *
 * Instead the same cached query is refreshed on the three moments that matter:
 * app foreground (below), pull-to-refresh and opening the inbox (the screen
 * calls refetch). react-query's refetchOnWindowFocus does nothing in React
 * Native without a focus manager, which is exactly why this AppState listener
 * exists rather than a config flag.
 */
function useForegroundRefresh() {
  const queryClient = useQueryClient();
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      }
    });
    return () => subscription.remove();
  }, [queryClient]);
}

/**
 * The notification inbox.
 *
 * Read state is per-user on the server (UserNotificationState), so it is never
 * tracked locally: every mutation invalidates the list and the server's own
 * `isRead` is what the UI draws. That is also why marking one row read cannot
 * be optimistic here - a failed PATCH would leave the phone claiming a
 * notification was read when the server disagrees.
 */
export function useNotifications(): NotificationsState {
  const queryClient = useQueryClient();
  useForegroundRefresh();

  const query = useQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: () => notificationsApi.fetchMyNotifications(1, PAGE_LIMIT),
    staleTime: 30_000,
  });

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
  }, [queryClient]);

  const readOne = useMutation({
    mutationFn: (id: string) => notificationsApi.setNotificationRead(id, true),
    onSuccess: invalidate,
  });

  const readAll = useMutation({
    mutationFn: () => notificationsApi.markAllNotificationsRead(),
    onSuccess: invalidate,
  });

  const removeOne = useMutation({
    mutationFn: (id: string) => notificationsApi.deleteNotification(id),
    onSuccess: invalidate,
  });

  const items = query.data?.items ?? [];

  return {
    items,
    total: query.data?.total ?? 0,
    unreadCount: items.reduce((sum, item) => (item.isRead ? sum : sum + 1), 0),
    loading: query.isPending,
    failed: query.isError,
    refetch: () => void query.refetch(),
    markRead: (id: string) => readOne.mutate(id),
    markAllRead: () => readAll.mutate(),
    remove: (id: string) => removeOne.mutate(id),
    mutating: readOne.isPending || readAll.isPending || removeOne.isPending,
  };
}

/**
 * PHASE 7 - the unread badge.
 *
 * It reads the SAME query key as the inbox, so the map and the menu render from
 * the cache the inbox already filled: no second endpoint, and no extra request
 * on every menu open (react-query serves the cached page while it is fresh and
 * deduplicates concurrent observers). The count is derived from the server's
 * `isRead`, never from a local counter, so it cannot drift from the inbox.
 */
export function useUnreadNotificationCount(): number {
  useForegroundRefresh();

  const query = useQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: () => notificationsApi.fetchMyNotifications(1, PAGE_LIMIT),
    staleTime: 30_000,
  });

  const items = query.data?.items ?? [];
  return items.reduce((sum, item) => (item.isRead ? sum : sum + 1), 0);
}
