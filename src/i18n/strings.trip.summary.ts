/**
 * DESIGN PHASE - the per-trip summary (reference `trip_completed.html`).
 *
 * Every label here describes a value the server actually sends. There is no
 * "tip", no "bonus" and no "passenger rating" string, because none of those
 * exist in the driver API today.
 */
export const tripSummaryStrings = {
  title: "ملخص الرحلة",

  netLabel: "صافي أرباحك",
  netCaption: "بعد خصم عمولة المنصة",
  grossLabel: "إجمالي الأجرة",
  commissionLabel: "عمولة المنصة",

  detailsTitle: "تفاصيل الرحلة",
  destinationLabel: "الوجهة",
  distanceLabel: "المسافة",
  classLabel: "فئة الخدمة",
  completedAtLabel: "وقت الإنهاء",

  unnamedTrip: "رحلة بدون عنوان مسجّل",
  unknownValue: "غير متوفّر",

  notFoundTitle: "لا يوجد ملخص لهذه الرحلة",
  notFoundBody:
    "الخادم يعيد آخر 100 عملية أرباح فقط. الرحلات الأقدم من ذلك لا ملخص لها، ولن نعرض لك أرقامًا مُقدَّرة بدل الأرقام الحقيقية.",

  ratingGap:
    "تقييم الراكب لهذه الرحلة غير متاح: لا يوجد في الواجهة الخلفية أي مصدر لتقييم رحلة مفردة.",

  error: "تعذّر تحميل الملخص",
  retry: "إعادة المحاولة",
  back: "رجوع",
} as const;
