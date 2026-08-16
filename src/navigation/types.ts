/**
 * Route maps. Screens land here as their phases are built; the names are fixed
 * now so navigation code never uses raw strings.
 */
export type AuthStackParamList = {
  Login: undefined;
};

/**
 * Reachable while the account is not APPROVED. A driver in review must still be
 * able to complete the file that is being reviewed, which is why Profile and
 * Documents live here and not only behind the approval gate.
 */
export type OnboardingStackParamList = {
  Pending: undefined;
  Profile: undefined;
  Documents: undefined;
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
   * PHASE 3 - open bidding requests (FareQuote / FareOffer). No params: the
   * list is always the driver's own eligible requests, decided server side.
   */
  Requests: undefined;
  /**
   * Trip chat. tripId is required rather than read from the trip store so a
   * push notification tapped from a cold start can route straight here before
   * the store has been hydrated.
   */
  TripChat: { tripId: string };
};
