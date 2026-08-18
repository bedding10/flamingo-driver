/**
 * Copy for the approval interstitial.
 *
 * Its own module, like the other strings.* files: src/i18n/strings.ts must not
 * be rewritten wholesale, it carries a string that was byte-damaged once
 * already and is easy to break again.
 */
export const approvedStrings = {
  brand: "flaminGO",
  title: "تمت الموافقة على حسابك",
  subtitle: "أنت الآن سائق معتمد. يمكنك بدء استقبال الطلبات فورًا.",
  nextTitle: "خطواتك الأولى",
  stepOnline: "فعّل الاتصال من الشاشة الرئيسية",
  stepOnlineHint: "لا تصلك أي طلبات ما دمت غير متصل",
  stepRequests: "تصفّح الطلبات المفتوحة وقدّم سعرك",
  stepRequestsHint: "أو انتظر عرضًا يصلك مباشرة على الخريطة",
  stepDocuments: "راقب صلاحية وثائقك",
  stepDocumentsHint: "الوثيقة المنتهية توقف الحساب حتى تحديثها",
  cta: "ابدأ العمل",
} as const;
