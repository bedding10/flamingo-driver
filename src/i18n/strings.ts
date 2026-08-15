/**
 * UI copy in one file.
 *
 * The driver app ships Arabic only for now (the fleet is in Algeria). Screens
 * import from here instead of hardcoding text, so adding fr/en later is a
 * change to this folder and not a rewrite of every screen.
 */
export const strings = {
  common: {
    retry: "إعادة المحاولة",
    signOut: "تسجيل الخروج",
    refresh: "تحديث",
    loading: "جارٍ التحميل...",
    save: "حفظ",
    cancel: "إلغاء",
    back: "رجوع",
    saved: "تم الحفظ",
  },

  login: {
    brand: "flaminGO",
    role: "للسائقين",
    phoneTitle: "تسجيل الدخول",
    phoneSubtitle: "أدخل رقم هاتفك المسجّل لدى الشركة",
    phoneLabel: "رقم الهاتف",
    phonePlaceholder: "0555 55 55 55",
    sendCode: "إرسال رمز التحقق",
    codeTitle: "رمز التحقق",
    codeSubtitle: "أدخل الرمز المكوّن من 6 أرقام المُرسل إلى",
    codeLabel: "الرمز",
    codePlaceholder: "------",
    verify: "تأكيد ودخول",
    changeNumber: "تغيير الرقم",
    resend: "إعادة إرسال الرمز",
    resendIn: "إعادة الإرسال بعد",
    seconds: "ثانية",
  },

  approval: {
    pendingTitle: "حسابك قيد المراجعة",
    pendingBody:
      "أكمل بياناتك ووثائقك لتسريع المراجعة. سيتم تفعيل زر الاتصال بعد اعتماد الحساب من إدارة flaminGO.",
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
    openProfile: "بياناتي ومركبتي",
    openDocuments: "الوثائق",
    checklistTitle: "ما ينقص لإتمام ملفك",
    checklistProfile: "بيانات المركبة (الطراز واللوحة)",
    checklistDocuments: "الوثائق المطلوبة",
    checklistDone: "ملفك مكتمل. الملف الآن في انتظار مراجعة الإدارة.",
  },

  // المرحلة 11: أسماء المستويات للعرض فقط. المستوى نفسه يأتي من الخادم؛
  // لا يوجد في التطبيق أي رقم عتبة (10 / 50 / 100 / 500) ولا أي حساب للمستوى.
  level: {
    bronze: "برونزي",
    silver: "فضي",
    gold: "ذهبي",
    diamond: "ماسي",
    legendary: "أسطوري",
    tripsShort: "رحلة",
    levelLabel: "المستوى",
    nextLevel: "المستوى التالي",
    progress: "التقدم",
  },

  profile: {
    title: "بياناتي",
    identitySection: "البيانات الشخصية",
    nameLabel: "الاسم الكامل",
    namePlaceholder: "مثال: محمد بن علي",
    phoneLabel: "رقم الهاتف",
    phoneLocked:
      "رقم الهاتف مرتبط بتسجيل دخولك، وتغييره يتم عبر الإدارة.",
    cityLabel: "المدينة",
    cityLocked:
      "المدينة تُضبط من لوحة الإدارة.",
    // المرحلة 8: اختيار الولاية والمدينة من بيانات Backend.
    wilayaLabel: "الولاية",
    wilayaHint:
      "اختر ولاية عملك، ثم اختر المدينة. تظهر فقط الولايات التي يعمل فيها flaminGO.",
    wilayaLoading: "جارٍ تحميل الولايات…",
    wilayaEmpty:
      "لا توجد ولايات متاحة حاليًا. حاول لاحقًا أو تواصل مع الدعم.",
    wilayaFailed: "تعذّر تحميل الولايات.",
    citySelectPrompt: "اختر الولاية أولًا",
    cityLoading: "جارٍ تحميل المدن…",
    cityEmpty: "لا توجد مدن مفعّلة في هذه الولاية.",
    ratingLabel: "التقييم",
    tripsLabel: "الرحلات المنجزة",
    vehicleSection: "المركبة",
    vehicleHint:
      "تغيير الصانع أو الطراز أو اللوحة أو السنة يُعيد المركبة إلى المراجعة من جديد.",
    makeLabel: "الصانع",
    makePlaceholder: "مثال: Renault",
    modelLabel: "الطراز",
    modelPlaceholder: "مثال: Symbol",
    colorLabel: "اللون",
    colorPlaceholder: "مثال: أبيض",
    plateLabel: "لوحة التسجيل",
    platePlaceholder: "00000-000-00",
    yearLabel: "سنة الصنع",
    yearPlaceholder: "2018",
    rideClassLabel: "فئة الخدمة",
    rideClassLocked:
      "فئة الخدمة تُضبط من لوحة الإدارة عند مراجعة مركبتك، وليس من التطبيق.",
    rideClassPending: "بانتظار المراجعة",
    currentVehicle: "المركبة الحالية",
    saveChanges: "حفظ التعديلات",
    nothingChanged: "لا توجد تعديلات للحفظ.",
    modelAndPlateRequired:
      "طراز المركبة ولوحة التسجيل مطلوبان.",
    yearInvalid: "سنة الصنع غير صحيحة.",
    saveFailed: "تعذّر حفظ البيانات.",
  },

  vehicle: {
    empty: "لم تُسجّل مركبة بعد. أضف بيانات مركبتك للمتابعة.",
    unknownModel: "مركبة بدون اسم",
    color: "اللون",
    year: "سنة الصنع",
  },

  documents: {
    title: "الوثائق",
    subtitle:
      "صورة واضحة لكل وثيقة، والمراجعة تتم من الإدارة.",
    LICENSE: "رخصة السياقة",
    ID_CARD: "بطاقة الهوية",
    INSURANCE: "وثيقة التأمين",
    REGISTRATION: "بطاقة رمادية (تسجيل المركبة)",
    PROFILE_PHOTO: "الصورة الشخصية",
    upload: "رفع الوثيقة",
    replace: "استبدال الوثيقة",
    statusPending: "قيد المراجعة",
    statusApproved: "معتمدة",
    statusRejected: "مرفوضة",
    statusMissing: "مفقودة",
    sourceTitle: "مصدر الصورة",
    sourceCamera: "الكاميرا",
    sourceLibrary: "معرض الصور",
    cameraDenied: "لم يُسمح بالوصول إلى الكاميرا.",
    libraryDenied: "لم يُسمح بالوصول إلى معرض الصور.",
    pickFailed: "تعذّر قراءة الصورة المختارة.",
    uploadFailed: "تعذّر رفع الوثيقة. أعد المحاولة.",
    uploaded: "تم رفع الوثيقة وهي الآن قيد المراجعة.",
    rejectedHint:
      "الوثائق المرفوضة يجب رفعها مرة أخرى بصورة أوضح.",
  },

  home: {
    goOnline: "ابدأ استقبال الرحلات",
    goOffline: "إيقاف الاستقبال",
    onTripLabel: "في رحلة الآن",
    offlineHint:
      "أنت غير متصل. لن تصلك أي طلبات رحلات حتى تشغّل الاستقبال.",
    onlineHint:
      "أنت متصل. أبقِ التطبيق مفتوحاً ليصلك طلب الرحلة فور توفره.",
    onTripHint:
      "لديك رحلة جارية. لا يمكن تغيير حالة الاتصال قبل إنهائها.",
    notApproved:
      "لا يمكنك الاتصال قبل اعتماد حسابك من إدارة flaminGO.",
    vehicleMissing: "لم تُسجّل مركبة بعد.",
    linkConnected: "متصل",
    linkConnecting: "جارٍ الاتصال",
    linkDown: "انقطع الاتصال",
    recenter: "توسيط موقعي",
    permissionDenied:
      "لم يُسمح بالوصول إلى الموقع. الموقع مطلوب لاستقبال الرحلات القريبة.",
    permissionBlocked:
      "إذن الموقع مرفوض نهائياً. اضغط هنا لفتح الإعدادات والسماح بالوصول.",
    permissionServicesOff:
      "خدمة الموقع (GPS) مغلقة في هاتفك. اضغط هنا لتشغيلها.",
  },

  /**
   * Background location. The disclosure text is not decoration: Google Play
   * requires a prominent in-app disclosure BEFORE the background permission
   * prompt, and it must say what is collected, why, and that it happens in the
   * background.
   */
  tracking: {
    disclosureTitle: "تتبّع الموقع أثناء العمل",
    disclosureBody:
      "لكي تصلك طلبات الرحلات ويرى الراكب اقترابك، يجمع flaminGO Driver موقعك أيضًا والتطبيق في الخلفية أو الشاشة مقفلة.\n\nيبدأ التتبّع فقط عندما تشغّل الاستقبال، ويتوقف فور إيقافه أو تسجيل الخروج. وسيبقى إشعار دائم في شريط الإشعارات يذكّرك بأن التتبّع يعمل.",
    disclosureAccept: "موافق، تابع",
    disclosureDecline: "ليس الآن",
    /** Shown on the persistent Android foreground-service notification. */
    notificationTitle: "أنت متصل ومتاح لاستقبال الرحلات",
    notificationBody:
      "تتبّع الموقع يعمل لأنك متصل. أوقف الاستقبال لإيقافه.",
    backgroundDenied:
      "لم يُسمح بالموقع في الخلفية. قد تتوقف الطلبات عن الوصول إذا أقفلت الشاشة.",
  },

  trip: {
    statusAccepted: "متوجّه إلى الراكب",
    statusArriving: "وصلت إلى نقطة الانطلاق",
    statusInProgress: "الرحلة جارية",
    actionArrived: "وصلت",
    actionStart: "ابدأ الرحلة",
    actionComplete: "إنهاء الرحلة",
    cancel: "إلغاء",
    back: "تراجع",
    confirm: "تأكيد",
    phoneHidden: "الرقم مخفي",
    completeConfirmTitle: "إنهاء الرحلة؟",
    completeConfirmBody: "ستُحتسب الأجرة وتُغلق الرحلة نهائيًا.",
    cancelConfirmTitle: "إلغاء الرحلة؟",
    cancelConfirmBody: "الإلغاء نهائي وقد يؤثر على تقييمك.",
    invalidTransition: "تغيّرت حالة الرحلة. تمّ تحديثها من الخادم.",
  },

  safety: {
    sos: "استغاثة",
    confirmTitle: "إرسال نداء استغاثة؟",
    confirmBody:
      "سيصل بلاغك فورًا إلى فريق السلامة مع موقعك الحالي ورقم الرحلة، وسيُبلَّغ جهات الطوارئ المسجّلة لديك.",
    confirmSend: "أرسل النداء",
    back: "تراجع",
    sentTitle: "تم إرسال النداء",
    sentBody: "فريق السلامة اطّلع على بلاغك ويتابعه الآن.",
    errorTitle: "تعذّر إرسال النداء",
    errorBody: "حاول مجددًا أو اتصل بالطوارئ مباشرة.",
  },

  /**
   * محادثة الرحلة.
   *
   * لم تكن هناك أي مفاتيح ترجمة للمحادثة في تطبيق السائق لأن الشاشة نفسها
   * لم تكن موجودة. الصياغة قصيرة عمدًا: السائق يقرأ وهو متوقف لحظة واحدة.
   */
  chat: {
    title: "محادثة الراكب",
    passengerFallback: "الراكب",
    active: "المحادثة مفتوحة خلال الرحلة",
    closed: "انت��ت المحادثة",
    empty: "لا توجد رسائل بعد.",
    placeholder: "اكتب رسالة...",
    closedPlaceholder: "لا يمكن الإرسال بعد انتهاء الرحلة",
    send: "إرسال",
    sent: "تم الإرسال",
    read: "تمت القراءة",
    unreadBadge: "رسائل جديدة",
    openChat: "مراسلة الراكب",
    loadFailed: "تعذّر جلب المحادثة.",
    sendFailed: "تعذّر إرسال الرسالة. تحقق من الاتصال.",
    rateLimited: "رسائل كثيرة بسرعة. انتظر لحظة.",
    quickOnMyWay: "أنا في الطريق إليك",
    quickArrived: "وصلت، أنتظرك بالخارج",
    quickWaiting: "هل تحتاج دقيقتين؟",
  },

  offer: {
    title: "طلب رحلة جديد",
    accept: "قبول",
    decline: "رفض",
    pickup: "الانطلاق",
    dropoff: "الوجهة",
    unknownAddress: "عنوان غير محدد",
    kmSuffix: "كم",
    netApprox: "صافي تقريبي",
    commissionLabel: "عمولة",
    secondsSuffix: "ث",
    passengerFallback: "راكب",
    awaiting: "جارٍ تأكيد الرحلة...",
    lostRace: "أُسندت الرحلة إلى سائق آخر",
    expired: "انتهت مهلة العرض",
    notConfirmed: "لم يصل تأكيد من الخادم. راجع رحلاتك قبل قبول عرض آخر.",
    rateLimited: "محاولات كثيرة بسرعة. انتظر لحظة.",
    failed: "تعذّر إرسال ردّك. تحقق من الاتصال.",
  },

  errors: {
    invalidPhone: "رقم الهاتف غير صحيح. تأكد من كتابته بشكل صحيح.",
    invalidCode: "الرمز غير صحيح. تحقّق من الأرقام وأعد المحاولة.",
    expiredCode: "انتهت صلاحية الرمز. اطلب رمزاً جديداً.",
    tooManyRequests:
      "تم إرسال عدد كبير من الطلبات. انتظر قليلاً ثم أعد المحاولة.",
    network: "لا يوجد اتصال بالإنترنت. تحقّق من الشبكة وأعد المحاولة.",
    smsFailed: "تعذّر إرسال رسالة التحقق حالياً. أعد المحاولة بعد قليل.",
    notDriver: "هذا الحساب غير مسجّل كسائق لدى flaminGO.",
    accountInactive: "هذا الحساب غير نشط. تواصل مع إدارة flaminGO.",
    configMissing:
      "إعدادات Firebase غير مكتملة في هذا الإصدار. استخدم نسخة مبنية عبر EAS.",
    generic: "حدث خطأ غير متوقع. أعد المحاولة.",
  },
} as const;
