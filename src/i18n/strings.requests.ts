/**
 * PHASE 3 copy - the requests (negotiation) page.
 *
 * Kept in its own module on purpose: src/i18n/strings.ts must not be rewritten
 * (it holds a byte-damaged string that a full re-emit would silently "fix" into
 * something else).
 */
export const requestStrings = {
  title: "الطلبات",
  subtitle: "طلبات مفتوحة للتفاوض في مدينتك",
  refresh: "تحديث",
  empty: "لا توجد طلبات مفتوحة الآن",
  emptyHint: "تظهر الطلبات هنا تلقائيًا عند وصولها.",
  offlineTitle: "أنت غير متصل",
  offlineHint: "اجعل حالتك متصلًا من الشاشة الرئيسية لعرض الطلبات.",
  notApproved: "حسابك قيد المراجعة، لا يمكن استلام الطلبات بعد.",
  vehicleRequired: "تحتاج مركبة معتمدة قبل تقديم العروض.",
  onTrip: "أنت في رحلة جارية.",

  suggested: "السعر المقترح",
  passengerAsked: "طلب الراكب",
  range: "المجال المسموح",
  distance: "المسافة",
  kmSuffix: "كم",
  duration: "المدة التقديرية",
  minutesSuffix: "د",
  commission: "العمولة",
  pickup: "نقطة الانطلاق",
  dropoff: "الوصول",
  unknownAddress: "موقع على الخريطة",
  passengerNote: "ملاحظة الراكب",
  closesIn: "ينتهي بعد",
  closed: "انتهت مهلة الطلب",

  amountLabel: "عرضك",
  amountPlaceholder: "أدخل المبلغ",
  outOfRange: "المبلغ خارج المجال المسموح",
  send: "أرسل عرضك",
  update: "حدّث عرضك",
  withdraw: "اسحب العرض",
  sending: "جارٍ الإرسال…",
  myOfferPending: "عرضك قيد انتظار الراكب",
  myOfferAmount: "عرضك الحالي",

  acceptedTitle: "تم قبول عرضك",
  acceptedBody: "انتقل إلى الشاشة الرئيسية لبدء الرحلة.",
  rejected: "لم يُقبل عرضك على هذا الطلب.",
  rejectedOther: "اختار الراكب سائقًا آخر.",
  expired: "انتهت صلاحية عرضك قبل رد الراكب.",

  errors: {
    DRIVER_NOT_APPROVED: "حسابك غير معتمد بعد.",
    FARE_OFFER_DRIVER_UNAVAILABLE:
      "يجب أن تكون متصلًا (ONLINE) لتقديم العروض.",
    DRIVER_VERIFIED_VEHICLE_REQUIRED: "تحتاج مركبة معتمدة أولًا.",
    DRIVER_NOT_FOUND: "لم يتم العثور على ملف السائق.",
    FARE_QUOTE_NOT_FOUND: "لم يعد هذا الطلب متاحًا.",
    FARE_QUOTE_EXPIRED: "انتهت مهلة هذا الطلب.",
    FARE_QUOTE_INVALID_STATE: "هذا الطلب لم يعد مفتوحًا للتفاوض.",
    FARE_QUOTE_NOT_ELIGIBLE: "هذا الطلب لا يناسب مركبتك أو مدينتك.",
    FARE_OFFER_OUT_OF_RANGE: "المبلغ خارج المجال الذي يقبله النظام.",
    FARE_OFFER_NOT_FOUND: "لم يتم العثور على العرض.",
    FARE_OFFER_INVALID_STATE: "لا يمكن تعديل هذا العرض الآن.",
    NETWORK_ERROR: "لا يوجد اتصال بالإنترنت.",
    REQUEST_FAILED: "تعذر تنفيذ الطلب، حاول مرة أخرى.",
  } as Record<string, string>,
} as const;

/** Maps an ApiError.code to Arabic copy, with a safe default. */
export function requestErrorText(code: string): string {
  return requestStrings.errors[code] ?? requestStrings.errors.REQUEST_FAILED;
}
