/**
 * PHASE 7 copy: bottom navigation, trip sharing and the legal screen.
 *
 * A separate module for the same reason as strings.menu.ts and
 * strings.support.ts: src/i18n/strings.ts carries a damaged byte sequence in one
 * entry, so it is never rewritten.
 */
export const tabStrings = {
  requests: "الطلبات",
  map: "الخريطة",
  menu: "القائمة",
} as const;

export const shareStrings = {
  open: "مشاركة الرحلة",
  title: "مشاركة الرحلة",
  body: "يُنشئ رابطًا مؤقّتًا يتابع به أهلك موقع السيارة بلا حساب. الرابط للقراءة فقط ولا يمكن لأحد تعديل الرحلة منه، وينتهي وحده بعد المدّة التي تختارها.",
  privacy: "لا يظهر في الرابط رقم هاتف الراكب ولا الأجرة ولا أي معرّف داخلي: الحالة، نقطة الانطلاق والوصول، المسار، اسمك الأول، ولوحة السيارة وموقعها.",
  durationLabel: "مدّة الصلاحية",
  minutes: "دقيقة",
  hours: "ساعة",
  submit: "إنشاء الرابط ومشاركته",
  shareMessage: "تابع رحلتي على flaminGO 🦩:",
  created: "تم إنشاء الرابط ومشاركته.",
  failed: "تعذّر إنشاء رابط المشاركة.",
  notShareable: "لا يمكن مشاركة رحلة منتهية.",
  noTrip: "لا توجد رحلة جارية لمشاركتها.",
  activeTitle: "روابط نشطة",
  activeEmpty: "لا توجد روابط نشطة لهذه الرحلة.",
  views: "مشاهدات",
  expiresAt: "ينتهي",
  revoke: "إبطال",
  revoked: "تم إبطال الرابط.",
  revokeFailed: "تعذّر إبطال الرابط.",
  close: "إغلاق",
} as const;

export const legalStrings = {
  title: "الشروط والخصوصية",
  termsTitle: "شروط الاستخدام",
  termsBody:
    "استخدامك للتطبيق كسائق شريك يعني التزامك بقوانين المرور، وبصحّة الوثائق التي ترفعها، وبمعاملة الركّاب باحترام. الإدارة قد تُعلّق الحساب عند التلاعب بالأجرة أو إلغاء الرحلات المتكرّر أو أي بلاغ سلامة مُثبت.",
  privacyTitle: "الخصوصية والموقع",
  privacyBody:
    "يُرسل التطبيق موقعك إلى الخادم أثناء عملك فقط: عندما تكون متصلًا أو في رحلة. عند الانتقال إلى غير متصل يتوقّف إرسال الموقع تمامًا. يُستخدم الموقع لمطابقة الطلبات القريبة، ولمتابعة الرحلة، ولدعم بلاغات SOS.",
  dataTitle: "بياناتك",
  dataBody:
    "وثائقك وصورة ملفك تُخزّن في مساحة تخزين خاصة بالمشروع، ويراها فريق المراجعة فقط. رصيدك وحركاته سجلّ محاسبي لا يمكن تعديله من التطبيق. جهات الطوارئ التي تسجّلها تُستخدم عند بلاغ SOS فقط.",
  supportTitle: "التواصل",
  supportBody:
    "أي اعتراض أو طلب حذف بيانات يُرسل من شاشة الدعم داخل التطبيق، فتُفتح تذكرة مرقّمة يمكنك متابعة ردودها.",
  versionTitle: "إصدار التطبيق",
  buildLabel: "البناء",
  packageLabel: "الحزمة",
} as const;
