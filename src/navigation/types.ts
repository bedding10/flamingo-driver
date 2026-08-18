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
  /**
   * DESIGN PHASE - earnings analysis (reference `earnings_analysis.html`).
   * Reads GET /driver/me/earnings: today / week / all, plus the last 100 rows.
   * There is no month bucket on the server, so the screen never shows one.
   */
  Earnings: undefined;
  /**
   * DESIGN PHASE - the account hub (reference `driver_profile_hub.html`).
   * Distinct from `Profile`, which is the editable form; this is the read view
   * with the tier frame, the counters and the entries into the rest.
   */
  ProfileHub: undefined;
  /** DESIGN PHASE - read-only vehicle card (reference `my_vehicle.html`). */
  Vehicle: undefined;
  /**
   * DESIGN PHASE - tier progression (reference `status_levels_benefits.html`).
   * Progression is real; per-tier benefits are a declared gap.
   */
  Levels: undefined;
  /**
   * DESIGN PHASE - today's progress (reference `daily_goals_progress.html`).
   * The earnings half is real; targets and streaks are a declared gap.
   */
  DailyGoals: undefined;
  Profile: undefined;
  Documents: undefined;
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
  /**
   * DESIGN PHASE - the per-trip summary (reference `trip_completed.html`).
   *
   * tripId only, for the same reason as TripChat: the summary must survive a
   * cold start and must not depend on the trip store, which clears
   * `currentTrip` as soon as the status turns terminal.
   */
  TripSummary: { tripId: string };
};
