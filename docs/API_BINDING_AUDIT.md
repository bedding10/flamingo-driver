# Step 5 - Backend binding audit

What this file is: a record of which server endpoints actually reach a screen,
which have a client but no UI, and which the design references assume but the
backend never exposed.

**Method, and its limits.** Every row below was verified by reading the file
named in the Evidence column. Nothing here was verified by running the app:
this pass was done without network access to a package registry, so there was
no `npm install`, no `tsc`, no Metro bundle and no device. Claims of the form
"nothing imports X" mean: not found while reading `src/api/*`, `src/hooks/*`,
the `src/components` listing, and the screens named in each row - not that a
compiler proved it. Treat those as strong, not absolute.

---

## 1. Bound: endpoint -> client -> UI

| Endpoint | Client | Reaches the driver through | Evidence |
| --- | --- | --- | --- |
| `POST /driver/trips/:id/arriving\|start\|complete\|cancel` | `trip.api.ts` | `useTripLifecycle` -> `ActiveTripCard` primary button | `useTripLifecycle.ts` |
| `PATCH /driver/me/trips/:id/status` | `trip.api.ts` `setTripStatus` | available, not on the primary path | `trip.api.ts` |
| `GET /driver/me/trips` | `driver.api.ts` `fetchDriverTrips` | cold-start recovery of a running trip | `useTripLifecycle.ts` |
| `GET /driver/me/trips/:id` | `driver.api.ts` `fetchDriverTrip` | refines a trip after `ride:assigned` and after a lost transition race | `useRideOffer.ts`, `useTripLifecycle.ts` |
| `GET /trip-communication/:tripId` | `trip-communication.api.ts` | unread badge + call button on `ActiveTripCard` | `useTripCommunication.ts` |
| `GET\|POST /trip-communication/:tripId/messages` | `trip-communication.api.ts` | `TripChatScreen` | `trip-communication.api.ts` |
| `POST /trip-communication/:tripId/messages/read` | `trip-communication.api.ts` | read receipt on opening the thread | `useTripCommunication.ts` |
| `GET /driver/fare-offers/opportunities` | `fareOffers.api.ts` | `RequestsScreen` list (15 s poll) | `useFareOpportunities.ts` |
| `POST /driver/fare-offers` | `fareOffers.api.ts` `submitFareOffer` | bid / update bid on `FareOpportunityCard` | `useFareOpportunities.ts` |
| `POST /driver/fare-offers/:id/withdraw` | `fareOffers.api.ts` | withdraw button | `useFareOpportunities.ts` |
| `POST /driver/fare-offers/claim` | `fareOffers.api.ts` `claimFareQuote` | **direct accept** - wired in this session | `FareOpportunityCard.tsx` |
| `POST /support/complaints` | `complaints.api.ts` `reportRequest` | **report sheet** - wired in this session | `ReportRequestSheet.tsx` |
| `GET /driver/me/earnings` | `earnings.api.ts` | `EarningsScreen`, and `TripCompletedScreen` reads its row | `EarningsScreen.tsx` |
| `POST /safety/sos` | `safety.api.ts` `reportSos` | SOS on `ActiveTripCard` | `DriverHomeScreen.tsx` |

Socket events consumed: `ride:offer`, `ride:assigned`, `ride:offer_expired`,
`ride:error`, `trip:status`, `trip:message`, `trip:messages_read`,
`fare:offer_accepted`, `fare:offer_rejected`, `fare:offer_expired`.

---

## 2. Defect found and fixed in this pass

**D1 - two contradictory clients for `POST /driver/fare-offers`.**
`trip.api.ts` carried `createFareOffer`, `fetchFareOffers`,
`fetchFareOpportunities` and `withdrawFareOffer`, all typed `unknown`.
`createFareOffer` posted `{ tripId, amount }`, but a bid is keyed by the fare
quote (`{ fareQuoteId, amount, note?, etaMinutes? }`), so a bid sent through it
could not be matched to a quote. `withdrawFareOffer` collided by name with the
real one in `fareOffers.api.ts`. Because `src/api/index.ts` re-exports modules
as namespaces (`tripApi`, ...), the collision did not break the build - it just
left two reachable functions with one name and different behaviour.

Removed, with the reasoning kept as a comment at the removal site so the block
is not "restored" later. No importer was found.

---

## 3. Typing gaps (client exists, contract not expressed)

| Client | Problem | Consequence |
| --- | --- | --- |
| `fetchDriverTrips` | returns `unknown`; the page shape `{ items: Trip[] }` is asserted at the call site | every future caller must re-guess the shape |
| `fetchDriverTrip` | returns `unknown`; cast to `Trip \| null` by two hooks | same cast repeated, no single source of truth |
| `fetchSanctions` | returns `unknown` | no consumer found in this pass |
| `fetchTripTrack` | returns `unknown` | no consumer found in this pass |

These are worth typing before anything new is built on them, but typing them is
a contract decision (what exactly does the server page look like?) and is not
guessed here.

---

## 4. Referenced by the design, absent from the backend

These are design screens with no endpoint behind them. They are recorded so the
next person does not read the silence as an oversight in the app.

| Design reference | Missing capability |
| --- | --- |
| `messages_inbox` | no route lists conversations. `/trip-communication/*` is per-trip only, and chat is bound to a live trip (`active`, `canChat` follow the status). An inbox would mean N+1 calls over recent trips for threads the server considers closed. |
| `demand_heatmap_main`, `zone_demand_details` | no demand/heatmap or serviceable-area endpoint in the client |
| `top_up_wallet`, `transfer_balance` | no top-up, transfer or withdrawal route |
| `rating_overview`, `review_detail`, `trip_reviews_history` | rating headline only: no count, no breakdown, no driver-side submit |
| `driver_leaderboard`, `weekly_prize_pool`, `season_recap_rewards`, `badges_achievements`, `milestone_celebration`, `referral_hub`, `referral_history` | rewards surfaces with no data source; gated behind the rewards feature flag rather than filled with placeholder numbers |
| `safety_inspection` | no inspection checklist route |
| lost items | `GET /lost-items/driver` is in the server notes but has no client module |

Also absent: a `wallet_update` or `driver_status` socket event, and a month
bucket on earnings (the endpoint caps at 100 rows, so the UI says "recent
trips" instead of implying a full month).

---

## 5. Policy the app must not re-derive

- **Passenger phone.** `/driver/me/trips` masks it. The only number that may be
  dialled is `phoneNumber` from `/trip-communication/:tripId`, and only when the
  server also returned `canCall`. A HIDDEN policy removes the button; it never
  dials a mask.
- **Chat availability.** `canChat` is the server's answer, derived from the
  passenger setting AND the trip status. Staff can disable chat globally, so the
  status alone is not enough.
- **Driver net.** `driverNet` is returned by the server when it exists and is
  never recomputed from a commission percentage: a coupon or promo makes the
  local arithmetic wrong.
- **Trip transitions.** The client's `NEXT_STATUS` map only decides which button
  to draw. The server's `Invalid transition X -> Y` always wins.
