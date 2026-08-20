import type { Dictionary } from "./en";

/**
 * PHASE 1 - Arabic.
 *
 * Migrated key-by-key from the legacy `src/i18n/strings.ts`. That file is NOT
 * deleted or bulk-rewritten in this phase: it contains at least one corrupted
 * byte sequence, and a whole-file rewrite is exactly the operation that would
 * spread the damage to strings that are currently fine. Screens move onto this
 * dictionary as their phase rebuilds them.
 *
 * CORRECTION CARRIED HERE: the legacy `chat.closed` value reads
 * "انت��ت المحادثة" - the ه was lost. The correct wording is
 * "انتهت المحادثة" and it will land in the chat slice when PHASE 6 migrates it.
 */
export const ar: Dictionary = {
  common: {
    appName: "flaminGO",
    driverSuffix: "للسائقين",
    retry: "إعادة المحاولة",
    cancel: "إلغاء",
    confirm: "تأكيد",
    save: "حفظ",
    saved: "تم الحفظ",
    back: "رجوع",
    next: "التالي",
    close: "إغلاق",
    done: "تم",
    loading: "جارٍ التحميل…",
    refresh: "تحديث",
    signOut: "تسجيل الخروج",
    ok: "حسناً",
    yes: "نعم",
    no: "لا",
    notAvailable: "غير متاح",
  },

  units: {
    km: "كم",
    min: "دقيقة",
    secondsShort: "ث",
  },

  language: {
    title: "اللغة",
    arabic: "العربية",
    french: "Français",
    english: "English",
    restartTitle: "يلزم إعادة التشغيل",
    restartBody:
      "تغيير اللغة يغيّر اتجاه الواجهة، ويحتاج التطبيق إلى إعادة تشغيل لتطبيقه.",
    restartNow: "أعد التشغيل الآن",
    restartLater: "ليس الآن",
    restartManual:
      "أغلق التطبيق وأعد فتحه لإكمال تغيير اللغة.",
  },

  nav: {
    requests: "الطلبات",
    map: "الخريطة",
    menu: "القائمة",
  },

  splash: {
    tagline: "قُد مع flaminGO",
  },

  login: {
    role: "للسائقين",
    phoneTitle: "تسجيل الدخول",
    phoneSubtitle: "أدخل رقم هاتفك المسجّل لدى الشركة",
    phoneLabel: "رقم الهاتف",
    phonePlaceholder: "0555 55 55 55",
    sendCode: "إرسال رمز التحقق",
    codeTitle: "رمز التحقق",
    codeSubtitle: "أدخل الرمز المكوّن من 6 أرقام المُرسل إلى",
    codeLabel: "الرمز",
    verify: "تأكيد ودخول",
    changeNumber: "تغيير الرقم",
    resend: "إعادة إرسال الرمز",
    resendIn: "إعادة الإرسال بعد",
    passwordTitle: "كلمة المرور",
    passwordLabel: "كلمة المرور",
    passwordSubtitle: "أدخل كلمة المرور الخاصة بحسابك",
    signIn: "دخول",
  },

  approval: {
    pendingTitle: "حسابك قيد المراجعة",
    pendingBody:
      "أكمل بياناتك ووثائقك لتسريع المراجعة. يمكنك بدء العمل بعد اعتماد الحساب من إدارة flaminGO.",
    rejectedTitle: "تم رفض الحساب",
    rejectedBody:
      "لم يتم اعتماد حسابك. راجع وثائقك وأعد رفع المرفوض منها، أو تواصل مع إدارة flaminGO.",
    suspendedTitle: "الحساب موقوف مؤقتاً",
    suspendedBody:
      "تم إيقاف حسابك مؤقتاً. لا يمكنك استقبال الرحلات حتى يتم رفع الإيقاف.",
    bannedTitle: "الحساب محظور",
    bannedBody: "تم حظر هذا الحساب نهائياً من منصة flaminGO.",
    statusLabel: "حالة الحساب",
    checkAgain: "تحقّق من الحالة",
    loadFailed: "تعذّر جلب حالة حسابك.",
  },

  level: {
    bronze: "برونزي",
    silver: "فضي",
    gold: "ذهبي",
    diamond: "ماسي",
    legendary: "أسطوري",
    levelLabel: "المستوى",
    nextLevel: "المستوى التالي",
    progress: "التقدم",
  },

  home: {
    goOnline: "ابدأ استقبال الرحلات",
    goOffline: "إيقاف الاستقبال",
    onTripLabel: "في رحلة الآن",
    offlineHint: "أنت غير متصل. لن تصلك أي طلبات رحلات.",
    onlineHint: "أنت متصل. أبقِ التطبيق مفتوحاً ليصلك طلب الرحلة.",
    onTripHint: "لديك رحلة جارية. لا يمكن تغيير حالة الاتصال قبل إنهائها.",
    notApproved: "لا يمكنك الاتصال قبل اعتماد حسابك من إدارة flaminGO.",
    vehicleMissing: "لم تُسجّل مركبة بعد.",
    linkConnected: "متصل",
    linkConnecting: "جارٍ الاتصال…",
    linkDown: "انقطع الاتصال",
    recenter: "توسيط موقعي",
    permissionDenied:
      "لم يُسمح بالوصول إلى الموقع. الموقع مطلوب لاستقبال الرحلات القريبة.",
    permissionBlocked:
      "إذن الموقع مرفوض نهائياً. اضغط هنا لفتح الإعدادات.",
    permissionServicesOff:
      "خدمة الموقع (GPS) مغلقة في هاتفك. اضغط هنا لتشغيلها.",
  },

  documents: {
    title: "الوثائق",
    LICENSE: "رخصة السياقة",
    ID_CARD: "بطاقة الهوية",
    INSURANCE: "وثيقة التأمين",
    REGISTRATION: "البطاقة الرمادية",
    PROFILE_PHOTO: "الصورة الشخصية",
    statusPending: "قيد المراجعة",
    statusApproved: "معتمدة",
    statusRejected: "مرفوضة",
    statusMissing: "مفقودة",
  },

  errors: {
    invalidPhone: "رقم الهاتف غير صحيح. تأكد من كتابته بشكل صحيح.",
    invalidCode: "الرمز غير صحيح. تحقّق من الأرقام وأعد المحاولة.",
    expiredCode: "انتهت صلاحية الرمز. اطلب رمزاً جديداً.",
    tooManyRequests: "محاولات كثيرة. انتظر قليلاً ثم أعد المحاولة.",
    network: "لا يوجد اتصال بالإنترنت. تحقّق من الشبكة وأعد المحاولة.",
    notDriver: "هذا الحساب غير مسجّل كسائق لدى flaminGO.",
    accountInactive: "هذا الحساب غير نشط. تواصل مع إدارة flaminGO.",
    generic: "حدث خطأ غير متوقع. أعد المحاولة.",
  },
};
