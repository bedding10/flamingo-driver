/**
 * PHASE 5 copy: the menu, the wallet and the withdrawal request.
 *
 * It lives in its own module for the same reason as strings.phase1.ts,
 * strings.password.ts, strings.photo.ts and strings.requests.ts: src/i18n/strings.ts
 * carries a damaged byte sequence in one entry, and rewriting that file would
 * spread the damage instead of fixing it.
 */
export const menuStrings = {
  title: "القائمة",
  wallet: "المحفظة والأرباح",
  walletHint: "الرصيد، أرباح اليوم والأسبوع، وطلب سحب",
  requests: "الطلبات المفتوحة",
  requestsHint: "المزايدة على طلبات الركاب القريبة",
  documents: "الوثائق",
  documentsHint: "رخصة السياقة، البطاقة الرمادية، التأمين، المراقبة التقنية",
  profile: "ملفي وسيارتي",
  profileHint: "الاسم، المدينة، بيانات السيارة وكلمة المرور",
  ratingLabel: "التقييم",
  tripsLabel: "الرحلات المكتملة",
  vehicleMissing: "لا توجد سيارة مسجّلة",
  signOut: "تسجيل الخروج",
  signOutTitle: "تسجيل الخروج",
  signOutBody: "سيتوقف استقبال الطلبات حتى تسجّل الدخول من جديد.",
  cancel: "إلغاء",
  confirm: "تأكيد",
  footer: "flaminGO 🦩 — تطبيق السائق",
} as const;

export const walletStrings = {
  title: "المحفظة",
  balanceLabel: "الرصيد القابل للسحب",
  lockedLabel: "رصيد محجوز",
  lockedHint: "رصيد غير قابل للسحب (تعويضات وقسائم).",
  currencyFallback: "دج",
  earningsTitle: "الأرباح",
  today: "اليوم",
  week: "هذا الأسبوع",
  all: "الإجمالي",
  trips: "الرحلات المكتملة",
  earningsHint: "الأرقام صافية بعد العمولة، ويحسبها الخادم. لا يوجد حساب شهري في الخادم لذلك لا يُعرض.",
  recentTitle: "آخر الحركات",
  recentEmpty: "لا توجد حركات بعد.",
  credit: "دائن",
  debit: "مدين",
  tripRow: "رحلة",
  withdrawTitle: "طلب سحب",
  withdrawHint: "يُراجع الطلب من الإدارة، ويُحجز المبلغ من رصيدك فورًا عند الإرسال.",
  amountLabel: "المبلغ",
  amountPlaceholder: "مثال: 5000",
  noteLabel: "ملاحظة (اختياري)",
  notePlaceholder: "رقم الحساب أو أي توضيح للإدارة",
  submit: "إرسال الطلب",
  submittedTitle: "تم إرسال الطلب",
  submittedBody: "طلبك قيد المراجعة. سيظهر التغيير على رصيدك مباشرة.",
  amountInvalid: "أدخل مبلغًا صحيحًا (1 على الأقل).",
  amountTooBig: "المبلغ أكبر من رصيدك القابل للسحب.",
  historyUnavailable: "الخادم لا يوفّر للسائق قائمة بطلبات السحب السابقة، لذلك لا تُعرض قائمة هنا.",
  loadFailed: "تعذّر تحميل المحفظة.",
} as const;
