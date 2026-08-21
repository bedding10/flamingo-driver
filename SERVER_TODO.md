# ما ينقص الخادم (SERVER_TODO)

هذا الملف كُتب بعد قراءة كود الخادم نفسه (Backend-main: 513 مسارًا و`prisma/schema.prisma`
بـ 2746 سطرًا)، لا تخمينًا. القاعدة في المشروع: **لا نختلق حقلًا ولا رقمًا في التطبيق** —
ما لا يوفّره الخادم يُبنى بالتصميم مع حالة فارغة صريحة، ويُسجّل هنا.

كل بند مكتوب هكذا: *ما نحتاجه · لماذا (أي شاشة تنتظره وما الحل المؤقت) · المسار المقترح*.

العقد الحالي (ما هو موجود فعلًا) في `DRIVER_API_MAPPING.md`.

---

## تصحيحات مهمة بعد فحص الخادم

أشياء ظننتها ناقصة وهي **موجودة**، فحُذفت من قائمة النواقص وسيربطها التطبيق:

- **كتالوج المركبات كامل**: `VehicleCategory` + `VehicleType` مع إدارة كاملة من اللوحة
  (`/vehicle-categories`, `/vehicle-types`, `/features`, `/vehicle-pricing`, `/service-areas`)
  و`GET /catalog/vehicles?audience=driver|passenger` للتطبيقات. فئة "دراجة نارية" وأنواع
  "اقتصادية / Comfort / نسائية" تُنشأ من اللوحة دون أي تعديل في الكود.
- **توجيه الطلب حسب النوع مُنفّذ في الخادم**: `MatchingEngineService` يفلتر السائقين بـ
  `vehicles.some({ isActive: true, vehicleTypeId })`، أي أن طلب "دراجة" لا يصل إلا لمن
  مركبته من ذلك النوع. (انظر التحذير في §1 حول التراجع إلى `rideClass`.)
- **المستندات القانونية**: `/public/legal` (عام بلا مصادقة) + `/legal-documents/*`
  (كتابة/نشر/نسخ/موافقة المستخدم). أصبحت شاشة الشروط والخصوصية تقرأ منه، ولا يوجد نص
  قانوني داخل التطبيق.
- **المحفظة والمال**: `GET /wallet/me`, `POST /withdrawals` (سحب), `POST /driver-funding/requests`
  (تعبئة/تمويل), `POST /driver-transfers` (تحويل بين السائقين), `GET /payments/payouts/me`,
  `PUT /payments/payouts/me` (بيانات البنك), `GET /invoices/me`, `GET /tips/driver/summary`.
- **الإشعارات**: `GET /notifications/me`, `PATCH /notifications/me/:id/read`,
  `POST /notifications/me/read-all` (وليس `/notifications/devices` فقط).
- **الخريطة الحرارية والمناطق**: `GET /surge/heatmap`, `GET /surge`, `GET /zones`,
  `GET /geofence/serviceable`, `POST /geo/directions`.
- **الإحالات والولاء والحوافز**: `/referrals/my-code`, `/referrals/mine`, `/loyalty/me`,
  `/loyalty/me/history`, `/growth/incentives`.
- **المستوى (Level)**: `profile-levels` محسوب ويُرجَع داخل `GET /driver/me`
  (`profileLevel`, `nextLevel`, `tripsToNextLevel`, `profileFrameUrl`).
- **الدعم والمفقودات والهوية**: `/support/tickets/me`, `/lost-items/driver`, `/kyc/me`.

---

## 1) اختيار نوع المركبة من التطبيق (أولوية قصوى — يحجب شاشة الوثائق)

**المشكلة**: السائق لا يستطيع تحديد نوع مركبته. `UpdateDriverProfileDto` لا يقبل
`vehicleTypeId` ولا `rideClass`، وفي `driver-self.service.ts` تعليق صريح بأن الفئة والنوع
"يضبطهما الإداري فقط عبر `PATCH /vehicles/:id/verify`". ولأن `ValidationPipe` مضبوط على
`whitelist: true, forbidNonWhitelisted: true` فإن إرسال `vehicleTypeId` في
`PATCH /driver/me` يُرجع **400** ولا يُتجاهل بصمت.

**المطلوب** (أحد الحلين):

1. إضافة `@IsOptional() @IsUUID() vehicleTypeId?: string` إلى `UpdateDriverProfileDto`،
   على أن يؤدي تغييره إلى إعادة `verificationStatus` إلى `PENDING` (مثل تغيير اللوحة)
   حتى لا يرقّي السائق نفسه بلا مراجعة، مع التحقق من `minVehicleYear` /
   `requiredDocuments` / `requiredLicenseType` الخاصة بالنوع.
2. أو مسار مستقل: `POST /driver/me/vehicle-type { vehicleTypeId }` بنفس القواعد.

**تحذير في المطابقة**: عند عدم وجود أي سائق مطابق لـ `vehicleTypeId` يتراجع المحرّك إلى
`rideClass` فقط. هذا يعني أن طلب "دراجة" قد يصل لسيارة إن كانت `rideClass = BIKE` أو أن
طلب اقتصادي يصل لمركبة لم تُربط بنوع. المطلوب: خيار في اللوحة
(`strictVehicleTypeMatching`) لتعطيل التراجع للفئات التي يجب ألا تختلط (دراجة ↔ سيارة،
ونسائية).

**حالة التطبيق الآن**: شاشة الوثائق تقرأ الكتالوج من `GET /catalog/vehicles?audience=driver`
وتعرض الفئات (سيارة/دراجة) وأنواعها، لكن الحفظ سيبقى معطّلًا حتى يُقبل الحقل أعلاه.

## 2) لوحة الصدارة والطبقات (لا يوجد شيء في الخادم)

- **صدارة السائقين في المدينة وفي الجزائر كاملة**: لا يوجد أي مسار. `GET /statistics/top-drivers`
  موجود لكنه للموظفين (`STAFF`) وغير مقسّم بمدينة/فترة.
  المقترح: `GET /driver/leaderboard?scope=city|country&period=week|month`
  ⇒ `{ scope, period, updatedAt, me: { rank, points, trips, rating }, top: [{ rank, driverId, name, photoUrl, city, trips, rating, points, tier }] }`
  مع إخفاء الأسماء الكاملة إن لزم (الاسم الأول + الحرف الأول).
- **الطبقات ومزاياها** (شاشة `status_levels_benefits`): `profile-levels` يعطي المستوى الحالي
  والتالي فقط. المطلوب `GET /driver/tiers` ⇒ قائمة الطبقات مع الشروط والمزايا (نسبة عمولة،
  أولوية طلبات، مكافآت) لتُدار من اللوحة.
- **نقاط الطبقة**: `LoyaltyAccount` مبني على مشتريات المستخدم (BRONZE→PLATINUM) وليس على
  أداء السائق. المطلوب تعريف نقاط السائق (رحلات مكتملة + تقييم + نسبة قبول) في الخادم
  حتى لا يحسبها التطبيق.
- **حالة التطبيق الآن**: الشاشتان تُبنيان بالتصميم مع حالة فارغة صريحة (قرار سابق منك).

## 3) التفاوض على السعر عند وصول طلب جديد

الموجود: `FareQuote` + `FareOffer` + `POST /driver/fare-offers` +
`GET /driver/fare-offers/opportunities` + `POST /driver/fare-offers/:id/withdraw`، وخصيصة
`allowsNegotiation` لكل نوع مركبة، وحدود `negotiationMin/negotiationMax` في قاعدة السعر.

**الناقص**:

1. **ربط التفاوض بالطلب المُرسل (`ride:offer`)**: `FareOffer.fareQuoteId` إلزامي، والطلب
   الذي يصل للسائق عبر `ride:offer` يحمل `tripId` وأجرة ثابتة بلا `fareQuoteId`. لذلك لا
   يمكن للسائق تقديم سعر مضاد على طلب رحلة وصله. المطلوب إضافة `fareQuoteId` (أو
   `negotiable: true` + حدود السعر) إلى حمولة `ride:offer`، أو مسار
   `POST /driver/trips/:id/counter-offer { amount, note?, etaMinutes? }`.
2. **أحداث Socket للتفاوض**: لا يوجد أي حدث للعروض. المطلوب `ride:counter_offer`
   (وصول عرض/رد الراكب)، `ride:offer_accepted`، `ride:offer_rejected`. بدونها تظلّ شاشة
   الانتظار تسأل الخادم كل 15 ثانية (`POLL_MS`) وهو استهلاك بطارية وتأخير ظاهر.
3. **مدة صلاحية العرض**: `FareOffer.expiresAt` موجود لكن لا يُرسل للتطبيق في
   `opportunities` بشكل مضمون — نحتاجه لعرض العدّاد المتقلّص بدقة.

## 4) الوثائق ونوع المركبة

- `DocumentType` فيه خمسة أنواع فقط (`LICENSE`, `ID_CARD`, `INSURANCE`, `REGISTRATION`,
  `PROFILE_PHOTO`). الناقص:
  - `VTC_PERMIT` (رخصة النقل) — تشغل مؤقتًا خانة `ID_CARD` حسب قرارك.
  - `VEHICLE_PHOTO` مع `slot: FRONT | REAR | LEFT | RIGHT | INTERIOR` لصور المركبة في
    شاشة الوثائق.
  - `side: FRONT | BACK` لرخصة السياقة (الشاشة تعرض وجهين، والخادم يخزّن ملفًا واحدًا).
- `DocumentStatus` بلا `EXPIRED` رغم وجود `expiresAt`؛ الشاشة تحسب الانتهاء محليًا الآن.
- سبب الرفض: `DriverDocument.note` موجود ✅ ويُعرض.
- المطلوب أيضًا: `requiredDocuments` الخاصة بالنوع المختار يجب أن تُفرض في
  `POST /driver/me/documents` لا في التطبيق فقط.

## 5) فحص المركبة (شاشة safety_inspection)

لا يوجد نموذج ولا مسار. المقترح: `GET /driver/me/inspection` ⇒ بنود مصنّفة
(خارجي/داخلي/سلامة) مع حالة كل بند، و`PATCH /driver/me/inspection/:itemId`.
حاليًا: خارج النطاق حتى تقرّر.

## 6) الرحلة والملاحة

- `POST /geo/directions` يعطي المسار ✅، لكن لا توجد خطوات ملاحة (turn-by-turn). البانر
  يعرض المسار وETA والمسافة فقط (قرارك).
- لا يوجد حدث `trip:eta` — التطبيق يعيد الحساب عند كل تحديث موقع.

## 7) السمعة والتقييمات

`GET /ratings/user/:userId` و`POST /ratings` موجودان. الناقص لشاشات `rating_overview` و
`trip_reviews_history` و`review_detail`:

- توزيع النجوم (كم 5، كم 4 ...) وعدد التقييمات الكلي: `GET /driver/me/ratings/summary`.
- وسوم التقييم (نظافة، قيادة هادئة ...) وتعليقات الركّاب مع صفحات.

## 8) شاشات تُبنى بحالة فارغة (لا يوجد مصدر بيانات)

`driver_leaderboard`, `rewards_tracker`, `daily_goals_progress`, `badges_achievements`,
`milestone_celebration`, `season_recap_rewards`, `weekly_prize_pool`, `my_benefits_savings`,
`partner_offers_marketplace`, `fuel_discount_detail`, `redeem_offer_qr`.
`GET /growth/incentives` قد يغطي جزءًا من المكافآت — يحتاج شكل بيانات مخصّصًا للسائق.

## 9) الدعم والقانوني

- مقالات المساعدة (help center): لا توجد. `content-blocks` قد تصلح كحاوية
  (`GET /content-blocks/live`) — يُحدَّد مفتاح خاص بالسائق.
- الشروط والخصوصية: ✅ تُدار من اللوحة وتُقرأ من `/public/legal` (منجَز).
- بوابة الموافقة: `GET /legal-documents/pending` + `POST /legal-documents/:id/accept`
  موجودان ولم يُربطا بشاشة بعد.

## 10) واجهات لم يعُد التطبيق يستخدمها

حسب قرارك بإزالة نظام الاستغاثة كاملًا، لن يستهلك تطبيق السائق:
`/safety/incidents/*`, `/safety/share/*`, `/emergency-contacts/*`.
ويُذكَّر هنا بنتيجة إزالة رسالة تتبّع الموقع: التتبّع صار في المقدمة فقط، وقد يوقف
أندرويد المراقب عند إطفاء الشاشة.

## 11) أشياء صغيرة

- `hasPassword: boolean` في `GET /driver/me` أو `/auth/me`: شاشة "أكمل ملفك" تضبط كلمة
  المرور عبر `POST /auth/password/change` بلا معرفة إن كانت مضبوطة أصلًا.
- `wallet:updated` كحدث Socket بعد كل رحلة/سحب بدل إعادة الجلب اليدوي.
- `period=month` في `GET /driver/me/earnings` (اليوم/الأسبوع/الكل فقط).
