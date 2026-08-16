import { api } from "./client";

/**
 * The in-app notification inbox, driver side.
 *
 * Until now the only notification surface on this phone was the OS banner from
 * FCM: once it was swiped away the message was gone forever, even though the
 * server had been storing every notification in the Notification table all
 * along and exposing it under /notifications/me. A driver who missed a banner
 * about a rejected document or a payout had no way back to it.
 *
 * Device registration is NOT here - it already lives in driver.api.ts and is
 * called by push.service.ts. Duplicating it would create two callers for one
 * server route.
 */

export type NotificationChannel = "PUSH" | "SMS" | "EMAIL" | "IN_APP";

/** The server's own audience set. `USER` means it was addressed to this driver. */
export type NotificationTarget = "ALL" | "DRIVERS" | "PASSENGERS" | "USER";

export type AppNotification = {
  id: string;
  target: NotificationTarget;
  channel: NotificationChannel;
  title: string;
  body: string;
  imageUrl: string | null;
  deepLink: string | null;
  data: Record<string, unknown> | null;
  createdAt: string;
  /** Per-user state, not a column on the notification itself. */
  readAt: string | null;
  isRead: boolean;
};

export type NotificationPage = {
  items: AppNotification[];
  total: number;
  page: number;
  limit: number;
};

/**
 * GET /notifications/me
 *
 * The server decides the audience: a driver receives `USER` rows addressed to
 * them plus the `ALL` and `DRIVERS` broadcasts. Nothing is filtered here.
 */
export async function fetchMyNotifications(page = 1, limit = 30) {
  const { data } = await api.get("/notifications/me", {
    params: { page, limit },
  });
  return data as NotificationPage;
}

/** PATCH /notifications/me/:id/read — `read` is required by the server DTO. */
export async function setNotificationRead(id: string, read: boolean) {
  const { data } = await api.patch("/notifications/me/" + id + "/read", {
    read,
  });
  return data as { readAt: string | null };
}

/** POST /notifications/me/read-all */
export async function markAllNotificationsRead() {
  const { data } = await api.post("/notifications/me/read-all", {});
  return data as { updated: number };
}

/**
 * DELETE /notifications/me/:id
 *
 * This hides the row for this driver only (UserNotificationState.deletedAt); a
 * broadcast is never destroyed for everybody from a phone.
 */
export async function deleteNotification(id: string) {
  const { data } = await api.delete("/notifications/me/" + id);
  return data as { ok: boolean };
}
