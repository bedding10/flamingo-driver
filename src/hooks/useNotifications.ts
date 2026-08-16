import { useCallback } from "react";
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
