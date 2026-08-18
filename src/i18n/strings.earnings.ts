/**
 * Earnings analysis copy.
 *
 * The wording is deliberately exact about what the server can prove: a total
 * the backend computed, and a recent list that is capped. Nothing here implies
 * a monthly figure or a projection, because neither exists.
 */
export const earningsStrings = {
  title: "تحليل الأرباح",

  today: "اليوم",
  week: "هذا الأسبوع",
  all: "الإجمالي",

  netLabel: "صافي الأرباح",
  netCaption: {
    today: "منذ منتصف الليل",
    week: "من يوم الاثنين",
    all: "منذ بداية العمل",
  },

  tripsLabel: "الرحلات المكتملة",
  tripsCaption: "الإجمالي الكلي",
  commissionLabel: "عمولة المنصة",
  averageLabel: "متوسط الرحلة",
  fromRecent: "من الرحلات المعروضة",

  listTitle: "آخر الرحلات",
  listNote: "يعرض الخادم آخر 100 رحلة فقط",
  noMonthNote:
    "لا يوفر الخادم حاليًا حصيلة شهرية، لذلك تقتصر الفترات على اليوم والأسبوع والإجمالي.",

  unnamedTrip: "رحلة",
  grossLine: "الإجمالي",
  commissionLine: "العمولة",

  empty: "لا توجد أرباح في هذه الفترة بعد.",
  error: "تعذر جلب الأرباح.",
  retry: "إعادة المحاولة",
} as const;
