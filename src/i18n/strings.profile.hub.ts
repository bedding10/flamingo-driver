import { strings } from "./strings";

/**
 * Profile hub, vehicle card and level progression copy.
 *
 * The level names reuse the Arabic already reviewed in strings.ts instead of
 * being retranslated here, so a tier can never be called two different things
 * in two screens.
 */
export const LEVEL_LABELS: Record<string, string> = {
  BRONZE: strings.level.bronze,
  SILVER: strings.level.silver,
  GOLD: strings.level.gold,
  DIAMOND: strings.level.diamond,
  LEGENDARY: strings.level.legendary,
};

export const hubStrings = {
  hubTitle: "ملفي",
  vehicleTitle: "مركبتي",
  levelsTitle: "مستواي",

  ratingLabel: "التقييم",
  ratingCaption: "متوسط من الخادم",
  completedLabel: "رحلات مكتملة",
  totalLabel: "إجمالي الرحلات",
  cityLabel: "المدينة",
  cityMissing: "غير محددة",

  ratingCountGap:
    "لا يرسل الخادم عدد التقييمات، لذلك يُعرض المتوسط وحده دون عدد.",

  editProfile: "تعديل الملف",
  editProfileHint: "الاسم والهاتف وبيانات المركبة",
  documents: "الوثائق",
  documentsOk: "كل الوثائق المطلوبة موجودة",
  documentsMissing: "وثائق تحتاج إلى انتباهك",
  vehicleRow: "مركبتي",
  vehicleRowHint: "اللوحة والمميزات وحالة المراجعة",
  earningsRow: "تحليل الأرباح",
  earningsRowHint: "اليوم والأسبوع والإجمالي",
  levelRow: "مستواي والتقدم",
  levelRowHint: "المستوى الحالي والمتبقي للتالي",

  // ---- vehicle ----------------------------------------------------------
  plateLabel: "رقم اللوحة",
  makeModelLabel: "المركبة",
  colorLabel: "اللون",
  yearLabel: "سنة الصنع",
  classLabel: "فئة الخدمة",
  classHint: "تُحدد من طرف الإدارة عند مراجعة المركبة",
  featuresEmpty: "لم تحدد أي ميزة بعد",
  noVehicle: "لا توجد مركبة مسجلة في ملفك بعد.",
  addVehicle: "إضافة بيانات المركبة",
  editVehicle: "تعديل بيانات المركبة",
  identityWarning:
    "تعديل الماركة أو الطراز أو اللوحة أو سنة الصنع يُعيد المركبة إلى المراجعة. تعديل المميزات لا يُعيدها.",

  // ---- levels -----------------------------------------------------------
  currentLevel: "المستوى الحالي",
  noLevelYet: "لم يُمنح مستوى بعد",
  nextLevel: "المستوى التالي",
  remainingTrips: "رحلة متبقية",
  atTop: "أنت في أعلى مستوى متاح.",
  allLevels: "المستويات",
  reached: "الحالي",
  thresholdsGap:
    "يرسل الخادم عتبة المستوى التالي فقط، ولا يرسل عتبات بقية المستويات ولا مزايا كل مستوى، لذلك لا تُعرض هنا.",

  loadError: "تعذر جلب الملف.",
  retry: "إعادة المحاولة",
} as const;

/**
 * Service-class labels. The KEYS are the server's RideClass enum; the Arabic is
 * this app's vocabulary for display only and is never sent back.
 */
export const RIDE_CLASS_LABELS: Record<string, string> = {
  ECONOMY: "اقتصادية",
  COMFORT: "مريحة",
  VAN: "فان",
  XL: "كبيرة",
  CAR: "سيارة",
  BIKE: "دراجة",
};
