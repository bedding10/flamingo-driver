/**
 * PHASE 1 copy.
 *
 * These keys live in a separate file on purpose. strings.ts is a single large
 * frozen object that every screen imports; rewriting it wholesale to append a
 * dozen keys risks corrupting Arabic text that is already shipped and reviewed.
 * Adding a sibling module is the smaller, safer change, and merging the two
 * files later is a mechanical move with no behaviour attached.
 *
 * Nothing here is a translation of a server value: statuses arrive as enum
 * names and are mapped to Arabic at the edge, exactly as strings.ts already
 * does for the existing three document statuses.
 */
import { strings } from "./strings";
import type { DocumentType } from "../types/driver";

export const p1 = {
  documents: {
    CARTE_GRISE: "البطاقة الرمادية",
    TECHNICAL_INSPECTION: "شهادة الفحص التقني",
    statusExpired: "منتهية الصلاحية",
    required: "مطلوبة",
    optional: "اختيارية",
    missingTitle: "ينقص ملفك",
    allSubmitted:
      "تم إرسال كل الوثائق المطلوبة. ملفك الآن في انتظار مراجعة الإدارة.",
    datesTitle: "تواريخ الوثيقة",
    datesSubtitle:
      "أدخل التواريخ كما هي مكتوبة على الوثيقة، بصيغة: سنة-شهر-يوم.",
    issuedAtLabel: "تاريخ الإصدار",
    expiresAtLabel: "تاريخ انتهاء الصلاحية",
    datePlaceholder: "2026-08-16",
    dateInvalid: "التاريخ غير صحيح. الصيغة المطلوبة: 2026-08-16",
    issuedRequired: "تاريخ الإصدار مطلوب لهذه الوثيقة.",
    issuedInFuture: "تاريخ الإصدار لا يمكن أن يكون في المستقبل.",
    expiresRequired: "تاريخ انتهاء الصلاحية مطلوب لهذه الوثيقة.",
    expiresInPast:
      "هذه الوثيقة منتهية الصلاحية. لا يمكن رفع وثيقة منتهية؛ جدّدها أولاً.",
    expiresBeforeIssued: "تاريخ الانتهاء يجب أن يكون بعد تاريخ الإصدار.",
    continueToPhoto: "متابعة إلى الصورة",
    issuedOn: "الإصدار",
    expiresOn: "الانتهاء",
    expiredBadge: "انتهت صلاحيتها",
    expiresToday: "تنتهي اليوم",
    expiresInPrefix: "تنتهي خلال",
    daysSuffix: "يومًا",
    rejectionReason: "سبب الرفض",
    expiredHint:
      "الوثيقة المنتهية توقف حسابك عن استقبال الرحلات. ارفع نسخة سارية.",
  },

  profile: {
    featuresLabel: "مميزات المركبة",
    featuresHint:
      "اختر ما تتوفر عليه مركبتك فعلاً. تعديل المميزات لا يُعيد مركبتك إلى المراجعة.",
    vehicleStatusLabel: "حالة مراجعة المركبة",
    vehicleNoteLabel: "ملاحظة الإدارة",
  },
} as const;

/**
 * Display label per document type.
 *
 * The documents screen used to index strings.documents by the enum name
 * directly. That stops type-checking the moment a new enum member exists
 * without a matching key, so the mapping is explicit here instead: adding a
 * document type to the server now breaks the build until its Arabic label is
 * written, which is exactly the failure we want.
 */
export const DOC_LABELS: Record<DocumentType, string> = {
  LICENSE: strings.documents.LICENSE,
  ID_CARD: strings.documents.ID_CARD,
  INSURANCE: strings.documents.INSURANCE,
  REGISTRATION: strings.documents.REGISTRATION,
  PROFILE_PHOTO: strings.documents.PROFILE_PHOTO,
  CARTE_GRISE: p1.documents.CARTE_GRISE,
  TECHNICAL_INSPECTION: p1.documents.TECHNICAL_INSPECTION,
};

/**
 * Vehicle comfort features.
 *
 * The server stores free-form strings (Vehicle.features String[]), so this list
 * is the app's vocabulary, not a server enum. The KEY is what travels; the
 * label is never sent, so renaming an Arabic label later cannot corrupt stored
 * data.
 */
export const VEHICLE_FEATURE_KEYS = [
  "AIR_CONDITIONING",
  "CHILD_SEAT",
  "USB_CHARGER",
  "LUGGAGE_SPACE",
  "NON_SMOKING",
  "PET_FRIENDLY",
  "WIFI",
  "WHEELCHAIR_ACCESS",
] as const;

export const VEHICLE_FEATURE_LABELS: Record<string, string> = {
  AIR_CONDITIONING: "تكييف",
  CHILD_SEAT: "مقعد أطفال",
  USB_CHARGER: "شاحن USB",
  LUGGAGE_SPACE: "مساحة أمتعة كبيرة",
  NON_SMOKING: "ممنوع التدخين",
  PET_FRIENDLY: "يسمح بالحيوانات الأليفة",
  WIFI: "واي فاي",
  WHEELCHAIR_ACCESS: "مهيأة لذوي الاحتياجات الخاصة",
};

export const VEHICLE_STATUS_LABELS: Record<string, string> = {
  PENDING: strings.documents.statusPending,
  APPROVED: strings.documents.statusApproved,
  REJECTED: strings.documents.statusRejected,
};
