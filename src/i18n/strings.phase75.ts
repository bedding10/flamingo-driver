/**
 * PHASE 7.5 copy: the redesigned home, the rebuilt menu and the offer card.
 *
 * A separate module for the same reason as strings.menu.ts / strings.phase7.ts:
 * src/i18n/strings.ts carries a damaged byte sequence in one entry, so that file
 * is never rewritten.
 */
export const home75Strings = {
  /** Compact availability labels for the top pill. */
  pillOnline: "متصل",
  pillOffline: "غير متصل",
  pillOnTrip: "في رحلة",
  linkDown: "لا يوجد اتصال",
  linkConnecting: "يعيد الاتصال",
  startReceiving: "بدء الاستقبال",
  stopReceiving: "إيقاف الاستقبال",
  onTripLocked: "في رحلة",
  waiting: "في انتظار طلب قريب",
  offlineHint: "لن تصلك طلبات حتى تبدأ الاستقبال.",
  onTripHint: "أكمل الرحلة الحالية أولًا.",
  recenter: "إعادة التمركز",
  share: "مشاركة الرحلة",
} as const;

export const menu75Strings = {
  sectionAccount: "الحساب",
  sectionMoney: "المال",
  sectionWork: "العمل",
  sectionVehicle: "المركبة",
  sectionSupport: "الدعم والأمان",
  sectionOther: "أخرى",

  profile: "ملفي الشخصي",
  profileHint: "الاسم، الصورة، الهاتف وكلمة المرور",
  documents: "الوثائق",
  documentsHint: "رخصة القيادة، البطاقة الرمادية، الفحص التقني، التأمين",

  wallet: "المحفظة والأرباح",
  walletHint: "الرصيد، الأرباح، وطلب سحب",

  requests: "الطلبات المفتوحة",
  requestsHint: "عروض الأجرة على طلبات الركاب القريبة",

  vehicle: "مركبتي",
  vehicleHint: "بيانات المركبة، الوثائق وصلاحيتها، والميزات",

  notifications: "الإشعارات",
  notificationsHint: "كل ما وصلك محفوظ هنا",
  support: "الدعم والمساعدة",
  supportHint: "فتح تذكرة ومتابعة الردود",
  safety: "الأمان و SOS",
  safetyHint: "جهات الطوارئ والبلاغات السابقة",

  legal: "الشروط والخصوصية",
  legalHint: "البيانات التي تُجمع، ومتى، ولماذا",
  appearance: "المظهر",
  appearanceDark: "داكن",
  appearanceLight: "فاتح",

  signOut: "تسجيل الخروج",
  signOutHint: "سيتوقّف استقبال الطلبات",

  levelLabel: "المستوى",
  ratingLabel: "التقييم",
  completedLabel: "رحلات مكتملة",
  totalLabel: "إجمالي الرحلات",
  vehicleMissing: "لا توجد مركبة مسجّلة",
  noPhone: "لا يوجد رقم",
} as const;

export const offer75Strings = {
  newRequest: "طلب جديد",
  passengerFallback: "راكب",
  completedShort: "رحلة مكتملة",
  tripDistance: "مسافة الرحلة",
  netLabel: "صافيك",
  commissionLabel: "عمولة",
  accept: "قبول",
  skip: "تخطي",
  awaiting: "جارٍ التأكيد",
  /**
   * Counter-offering is NOT part of the socket offer protocol: the gateway
   * accepts ride:accept and ride:decline only. Fare bidding lives in the open
   * requests screen (GET /driver/fare-offers/opportunities), so the driver is
   * told where it is instead of being given a button that cannot send anything.
   */
  bidElsewhere: "اقتراح الأجرة متاح في «الطلبات المفتوحة» لطلبات المزايدة.",
} as const;

/**
 * Ride-class labels. A lookup with a fallback, so an unknown or newly added
 * server value renders as itself rather than crashing or showing nothing.
 */
export const rideClassLabels: Record<string, string> = {
  ECONOMY: "اقتصادي",
  STANDARD: "عادي",
  COMFORT: "مريح",
  PREMIUM: "ممتاز",
  VAN: "عائلي",
  MOTO: "دراجة",
  MOTORCYCLE: "دراجة",
};
