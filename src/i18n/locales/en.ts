/**
 * PHASE 1 - English.
 *
 * English is the SHAPE SOURCE for the other locales: `Dictionary` is derived
 * from this object, so a key added here and forgotten in `ar.ts` or `fr.ts` is
 * a TypeScript error rather than a string that silently renders in the wrong
 * language on a driver's phone.
 *
 * Copy is taken from the Stitch screens where a screen exists, and from the
 * existing Arabic app copy where it does not. It is deliberately short: this
 * text is read at a glance, often in sunlight, sometimes at a red light.
 *
 * SCOPE: PHASE 1 ships the foundation plus the slices PHASE 1 and PHASE 2 need.
 * Later phases add their own slices as their screens are built - the legacy
 * `src/i18n/strings.ts` keeps serving the screens that have not migrated yet.
 */
export const en = {
  common: {
    appName: "flaminGO",
    driverSuffix: "Driver",
    retry: "Try again",
    cancel: "Cancel",
    confirm: "Confirm",
    save: "Save",
    saved: "Saved",
    back: "Back",
    next: "Next",
    close: "Close",
    done: "Done",
    loading: "Loading…",
    refresh: "Refresh",
    signOut: "Sign out",
    ok: "OK",
    yes: "Yes",
    no: "No",
    notAvailable: "Not available",
  },

  units: {
    km: "km",
    min: "min",
    secondsShort: "s",
  },

  language: {
    title: "Language",
    arabic: "العربية",
    french: "Français",
    english: "English",
    /** Shown when the choice flips the layout direction and needs a reload. */
    restartTitle: "Restart required",
    restartBody:
      "Switching to this language changes the layout direction. The app needs to restart to apply it.",
    restartNow: "Restart now",
    restartLater: "Not now",
    restartManual:
      "Please close and reopen the app to finish changing the language.",
  },

  /** The three bottom-bar sections. Map is the default. */
  nav: {
    requests: "Requests",
    map: "Map",
    menu: "Menu",
  },

  splash: {
    tagline: "Drive with flaminGO",
  },

  /**
   * PHASE 2 - Stitch `welcome_onboarding`, the first screen an unregistered
   * driver sees.
   *
   * The heading is split into `titleLead` + `titleBrand` so the brand word can
   * take the pink accent Stitch puts on it. Splitting a sentence across keys is
   * normally a word-order trap, but this word falls at the END of the sentence
   * in all three languages, so the split is safe here.
   */
  welcome: {
    titleLead: "Welcome to",
    titleBrand: "flaminGO",
    subtitle: "Join Algeria's finest fleet of drivers.",
    start: "Start registration",
    signIn: "Sign in",
  },

  /**
   * PHASE 2 - Stitch `phone_number_entry` and `otp_verification`.
   *
   * `phonePlaceholder` has NO leading zero on purpose. Stitch puts a fixed
   * `+213` block beside the field, so the field holds the national number, and
   * `normalizeE164` maps a bare "555123456" to "+213555123456" through its last
   * branch exactly as it maps "0555123456" through the trunk branch. Both forms
   * work; the placeholder shows the one the layout implies.
   *
   * `resendIn` and `stepOf` take variables rather than being concatenated from
   * fragments, because a number wedged between two translated fragments cannot
   * be ordered correctly in three languages.
   */
  login: {
    role: "For drivers",
    phoneTitle: "Phone number",
    phoneSubtitle:
      "Enter your phone number and we'll send you a verification code",
    phoneLabel: "Phone number",
    phonePlaceholder: "555 123 456",
    phoneHelper: "We'll verify this number with a short text message.",
    sendCode: "Send code",
    codeTitle: "Verify code",
    codeSubtitle: "We sent a verification code to",
    codeLabel: "Verification code",
    verify: "Verify and continue",
    changeNumber: "Change number",
    resend: "Resend code",
    resendQuestion: "Didn't get the code?",
    resendIn: "Resend code in {time}",
    stepOf: "Step {current} of {total}",
    passwordTitle: "Password",
    passwordLabel: "Password",
    passwordSubtitle: "Enter your flaminGO password",
    signIn: "Sign in",
  },

  approval: {
    pendingTitle: "Your account is under review",
    pendingBody:
      "Complete your details and documents to speed up the review. You can start driving once flaminGO approves your account.",
    rejectedTitle: "Account rejected",
    rejectedBody:
      "Your account was not approved. Review your documents, re-upload the rejected ones, or contact flaminGO.",
    suspendedTitle: "Account temporarily suspended",
    suspendedBody:
      "Your account is suspended. You cannot receive rides until the suspension is lifted.",
    bannedTitle: "Account banned",
    bannedBody: "This account has been permanently banned from flaminGO.",
    statusLabel: "Account status",
    checkAgain: "Check status",
    loadFailed: "Could not load your account status.",
  },

  level: {
    bronze: "Bronze",
    silver: "Silver",
    gold: "Gold",
    diamond: "Diamond",
    legendary: "Legendary",
    levelLabel: "Level",
    nextLevel: "Next level",
    progress: "Progress",
  },

  home: {
    goOnline: "Go online",
    goOffline: "Go offline",
    onTripLabel: "On a trip",
    offlineHint: "You are offline. No ride requests will reach you.",
    onlineHint: "You are online. Keep the app open to receive requests.",
    onTripHint: "You have an active trip. Finish it before changing status.",
    notApproved: "You cannot go online until flaminGO approves your account.",
    vehicleMissing: "No vehicle registered yet.",
    linkConnected: "Connected",
    linkConnecting: "Connecting…",
    linkDown: "Connection lost",
    recenter: "Recenter",
    permissionDenied:
      "Location access denied. Location is required to receive nearby rides.",
    permissionBlocked:
      "Location permission is permanently denied. Tap to open settings.",
    permissionServicesOff: "Location services (GPS) are off. Tap to turn them on.",
  },

  documents: {
    title: "Documents",
    LICENSE: "Driving licence",
    ID_CARD: "ID card",
    INSURANCE: "Insurance",
    REGISTRATION: "Carte grise",
    PROFILE_PHOTO: "Profile photo",
    statusPending: "Pending",
    statusApproved: "Verified",
    statusRejected: "Rejected",
    statusMissing: "Missing",
  },

  errors: {
    invalidPhone: "That phone number is not valid.",
    invalidCode: "That code is not correct. Check the digits and try again.",
    expiredCode: "The code has expired. Request a new one.",
    tooManyRequests: "Too many attempts. Wait a moment and try again.",
    network: "No internet connection. Check your network and try again.",
    notDriver: "This account is not registered as a flaminGO driver.",
    accountInactive: "This account is not active. Contact flaminGO.",
    generic: "Something went wrong. Please try again.",
  },
} as const;

/**
 * The contract every locale must satisfy.
 * `ar.ts` and `fr.ts` are typed against this, so a missing key fails typecheck.
 */
export type Dictionary = {
  readonly [K in keyof typeof en]: { readonly [P in keyof (typeof en)[K]]: string };
};
