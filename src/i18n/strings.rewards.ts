/**
 * Gamification copy.
 *
 * Every string that would state a target, a rank or a prize is absent on
 * purpose - those numbers do not exist yet, and the screens say that plainly
 * instead of showing a placeholder that looks like data.
 */
export const rewardsStrings = {
  goalsTitle: "أهداف اليوم",
  goalsSubtitle: "تقدمك منذ منتصف الليل",

  todayNet: "أرباح اليوم",
  todayTrips: "رحلات اليوم",
  weekNet: "أرباح الأسبوع",
  fromServer: "من الخادم",
  fromRecentRows: "محسوبة من سجل الأرباح الأخير",

  gapBadge: "غير متاح بعد",
  gapTitle: "الأهداف والمكافآت",
  gapBody:
    "لا يوفر الخادم حتى الآن أهدافًا يومية أو سلاسل إنجاز أو مكافآت. يعرض هذا القسم أرقامًا حقيقية فقط، ولن يعرض هدفًا مخترعًا.",
  gapHint: "سيُفعّل تلقائيًا عند إضافة المسارات إلى الخادم.",

  error: "تعذر جلب بيانات اليوم.",
  retry: "إعادة المحاولة",
} as const;
