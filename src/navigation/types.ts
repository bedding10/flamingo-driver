/**
 * Route maps. Screens land here as their phases are built; the names are fixed
 * now so navigation code never uses raw strings.
 */
export type AuthStackParamList = {
  /**
   * PHASE 2 - Stitch `welcome_onboarding`, the first screen an unregistered
   * driver sees. Declared FIRST in AuthNavigator so it is the initial route:
   * section 12 makes Welcome step 1 of onboarding.
   */
  Welcome: undefined;
  /**
   * `mode` preselects which of the two doors to the SAME account opens: "sms"
   * for a new driver, because POST /auth/firebase is the only account-creating
   * path the backend has, or "password" for a returning one who has already set
   * a password.
   *
   * Optional, so every existing `navigate("Login")` keeps compiling and still
   * lands on the SMS flow.
   */
  Login: { mode?: "sms" | "password" } | undefined;
};

/**
 * Reachable while the account is not APPROVED. A driver in review must still be
 * able to complete the file that is being reviewed, which is why Profile,
 * Documents and Vehicle live here and not only behind the approval gate.
 *
 * PHASE 2: the order below is the order sections 13 and 62 mandate -
 * BASIC PROFILE -> DOCUMENTS -> VEHICLE INFORMATION. Vehicle used to be the
 * second half of the Profile form, which made that order impossible to express.
 */
export type OnboardingStackParamList = {
  Pending: undefined;
  Profile: undefined;
  Documents: undefined;
  Vehicle: undefined;
};

export type DriverStackParamList = {
  Home: undefined;
  /**
   * PHASE 5 - the driver menu. It replaces the old behaviour where the map's
   * hamburger jumped straight into the profile form, which left the wallet and
   * the requests list with no entry point.
   */
  Menu: undefined;
  /** PHASE 5 - ledger balance, earnings aggregates and withdrawal request. */
  Wallet: undefined;
  Profile: undefined;
  Documents: undefined;
  /**
   * PHASE 2 - the active vehicle. Registered here as well as in the onboarding
   * stack because an APPROVED driver still has to fix a plate or correct the
   * comfort list; without this route, moving the fields out of Profile would
   * have removed vehicle editing from the app entirely.
   */
  Vehicle: undefined;
  /**
   * PHASE 3 - open bidding requests (FareQuote / FareOffer). No params: the
   * list is always the driver's own eligible requests, decided server side.
   */
  Requests: undefined;
  /**
   * PHASE 6 - the stored notification inbox (GET /notifications/me). It is also
   * where a tapped push lands when its payload is not a trip message, so an
   * unrecognised notification still leads somewhere useful.
   */
  Notifications: undefined;
  /** PHASE 6 - support tickets: open one and list the driver's own. */
  Support: undefined;
  /**
   * PHASE 6 - a single support thread. The id is a param so a ticket can be
   * opened straight after creating it, before any list refetch has landed.
   */
  Ticket: { ticketId: string };
  /** PHASE 6 - emergency contacts and the driver's own SOS reports. */
  Safety: undefined;
  /** PHASE 7 - terms, privacy and the installed build identity. */
  Legal: undefined;
  /**
   * Trip chat. tripId is required rather than read from the trip store so a
   * push notification tapped from a cold start can route straight here before
   * the store has been hydrated.
   */
  TripChat: { tripId: string };
};
