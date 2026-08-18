/**
 * Requests (negotiation) copy.
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

  // ---------------- PHASE 2 ----------------
  /** القبول المباشر: الرحلة تصبح للسائق فورًا بلا موافقة إضافية من الراكب. */
  directAccept: "قبول مباشر",
  directAcceptDone: "أصبحت الرحلة لك. توجّه إلى نقطة الانطلاق.",
  negotiate: "تفاوض",
  skip: "تخطي",
  tripsSuffix: "رحلة",
  awayFromYou: "من موقعك",
  nearYou: "قريب منك",

  /** إجراءات عامة داخل قائمة الطلبات. */
  dismiss: "حسنًا",
  goHome: "العودة إلى الشاشة الرئيسية",

  /** سحب البطاقة: إخفاء أو إبلاغ. */
  hide: "إخفاء",
  hidden: "تم إخفاء الطلب من قائمتك.",
  report: "إبلاغ",
  reportTitle: "الإبلاغ عن هذا الطلب",
  reportHint: "اختر سببًا. يصل البلاغ إلى فريق الدعم في لوحة التحكم.",
  reportSend: "إرسال البلاغ",
  reportSent: "تم إرسال بلاغك إلى فريق الدعم.",
  reportNoteLabel: "تفاصيل إضافية (اختياري)",

  /** أسباب جاهزة — مطابقة لـ enum ComplaintReason في الخادم. */
  reasons: {
    UNSAFE_BEHAVIOR: "سلوك غير آمن",
    SUSPECTED_FRAUD: "شبهة احتيال",
    FAKE_REQUEST: "طلب وهمي",
    WRONG_PICKUP_LOCATION: "موقع انطلاق خاطئ",
    OFFENSIVE_LANGUAGE: "لغة مسيئة",
    OTHER: "سبب آخر",
  } as Record<string, string>,

  // ---------------- PHASE 3 ----------------
  /**
   * تأكيد القبول المباشر. القبول المباشر يُنشئ الرحلة على الخادم فورًا ولا
   * يمكن التراجع عنه من التطبيق، فلا يصح أن يكون نقرة واحدة فوق حقل رقمي.
   */
  confirmTitle: "تأكيد قبول الرحلة",
  confirmWarning:
    "بعد التأكيد تصبح الرحلة لك فورًا ولا يمكن التراجع من التطبيق. إلغاؤها بعد ذلك يُحسب إلغاءً من السائق.",
  confirmYourAmount: "المبلغ الذي أدخلته",
  confirmNetHint: "صافي ربحك يحسبه النظام بعد خصم العمولة.",
  confirmSlide: "اسحب لتأكيد القبول",
  confirmCancel: "تراجع",
  confirmGone: "لم يعد هذا الطلب متاحًا. قد يكون سائق آخر قبله أو ألغاه الراكب.",

  /** منطقة العمل والفلترة. */
  zoneTitle: "منطقة العمل",
  zoneSearchTitle: "البحث عن مكان العمل",
  zoneSearchPlaceholder: "ابحث عن مدينة أو منطقة (مثال: وهران)",
  zonePickOnMap: "اختر المنطقة من الخريطة",
  zoneRadius: "نطاق البحث",
  zoneSave: "تثبيت المنطقة",
  zoneClear: "إلغاء التحديد",
  zoneSaved: "تم تثبيت منطقة عملك. ستصلك الطلبات داخلها فقط.",
  zoneCleared: "تم إلغاء منطقة العمل.",
  zoneNone: "بلا منطقة محددة",
  filterAllClasses: "كل الفئات",

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
    FARE_OFFER_EXPIRED: "انتهت صلاحية العرض.",
    ACTIVE_TRIP_EXISTS: "لهذا الراكب رحلة نشطة بالفعل.",
    NETWORK_ERROR: "لا يوجد اتصال بالإنترنت.",
    REQUEST_FAILED: "تعذر تنفيذ الطلب، حاول مرة أخرى.",
  } as Record<string, string>,
} as const;

/** Maps an ApiError.code to Arabic copy, with a safe default. */
export function requestErrorText(code: string): string {
  return requestStrings.errors[code] ?? requestStrings.errors.REQUEST_FAILED;
}
