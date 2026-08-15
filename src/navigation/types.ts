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
  Profile: undefined;
  Documents: undefined;
  /**
   * Trip chat. tripId is required rather than read from the trip store so a
   * push notification tapped from a cold start can route straight here before
   * the store has been hydrated.
   */
  TripChat: { tripId: string };
};
