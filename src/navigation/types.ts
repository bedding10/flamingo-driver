/**
 * Route maps. Screens land here as their phases are built; the names are fixed
 * now so navigation code never uses raw strings.
 */
export type AuthStackParamList = {
  /**
   * Stitch `welcome_onboarding`, the first screen an unregistered driver sees.
   * Declared FIRST in AuthNavigator so it is the initial route.
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
 * The order below is the onboarding order: BASIC PROFILE (photo, full name,
 * account password) -> DOCUMENTS -> VEHICLE INFORMATION. A driver who has just
 * verified an OTP lands on Profile, not on Pending.
 */
export type OnboardingStackParamList = {
  Pending: undefined;
  Profile: undefined;
  Documents: undefined;
  Vehicle: undefined;
};

export type DriverStackParamList = {
  Home: undefined;
  /** The driver menu: wallet, requests, documents, vehicle, support. */
  Menu: undefined;
  /** Ledger balance and earnings aggregates. */
  Wallet: undefined;
  Profile: undefined;
  Documents: undefined;
  /**
   * The active vehicle. Registered here as well as in the onboarding stack
   * because an APPROVED driver still has to fix a plate or correct the comfort
   * list.
   */
  Vehicle: undefined;
  /**
   * Open bidding requests (FareQuote / FareOffer) - the driver side of price
   * negotiation with the passenger. No params: the list is always the driver's
   * own eligible requests, decided server side.
   */
  Requests: undefined;
  /**
   * The stored notification inbox (GET /notifications/me). It is also where a
   * tapped push lands when its payload is not a trip message.
   */
  Notifications: undefined;
  /** Support tickets: open one and list the driver's own. */
  Support: undefined;
  /**
   * A single support thread. The id is a param so a ticket can be opened
   * straight after creating it, before any list refetch has landed.
   */
  Ticket: { ticketId: string };
  /** Terms, privacy and the installed build identity. */
  Legal: undefined;
  /**
   * Trip chat. tripId is required rather than read from the trip store so a
   * push notification tapped from a cold start can route straight here before
   * the store has been hydrated.
   */
  TripChat: { tripId: string };
};

// SOS REMOVED: there is no longer a `Safety` route. The emergency screen, the
// trip-card SOS button, safetyApi and emergencyApi were all removed by request.
// Anything that re-introduces an emergency flow needs a new route added here on
// purpose rather than a stale one lying around.
