/**
 * PHASE 1 - presence copy.
 *
 * Kept in its own module because `strings.ts` carries corrupted bytes in one
 * legacy entry and must not be rewritten.
 */
export const presenceStrings = {
  /** The toggle was not even sent: there is no live link to the server. */
  noLink: "لا يوجد اتصال بالخادم. تحقق من الإنترنت ثم أعد المحاولة",
  /** The server dropped us to OFFLINE because the link or heartbeat died. */
  forcedOffline:
    "انقطع الاتصال بالخادم وتم تحويلك إلى غير متصل. أعد تشغيل الاستقبال عند استقرار الشبكة",
} as const;
