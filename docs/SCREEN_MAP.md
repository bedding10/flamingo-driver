# Reference pack -> React Native screens

The 42 HTML files are the **design reference**. They are not shipped, they are
not converted to WebViews, and no screen embeds HTML. This table is the
contract: each reference becomes a React Native screen, bound to an endpoint
that is **verified to exist**, or it is marked GAP.

Order of work (as agreed): reference files -> design system -> screens ->
components -> backend binding -> testing.

> **Revision 2.** Four rows in revision 1 were wrong. They were written from
> the reference pack plus `DRIVER_API_MAPPING.md`, before the corresponding
> source files had been read. Every correction is marked `CORRECTED` below,
> with the file that settled it. Nothing here is inferred from a filename any
> more.

## Legend

| Mark | Meaning |
| --- | --- |
| DONE | Shipped in `src/` and covers the reference |
| BUILD | To be written, backend exists and is verified |
| GAP | No backend endpoint exists - UI only, behind a feature flag, never faked as real data |

A reference is also DONE when it is covered by a **component** rather than a
screen. This app is map-centric: the offer and the running trip live as cards
over the map, and splitting them into routes would fork the trip lifecycle.
The covering file is named in the row.

---

## 1. Onboarding and account

| # | Reference | Route / file | Status | Data |
| --- | --- | --- | --- | --- |
| 1 | `splash_screen.html` | `screens/BootScreen.tsx` | DONE | token bootstrap + `GET /auth/me` |
| 2 | `upload_driving_license.html` | `screens/onboarding/DocumentsScreen.tsx` | DONE | `POST /driver/me/upload-url` -> R2 PUT -> `POST /driver/me/documents` |
| 3 | `document_verification_checklist.html` | `screens/onboarding/DocumentsScreen.tsx` | DONE | `GET /driver/me` (`documents[]`) |
| 4 | `application_under_review.html` | `screens/onboarding/PendingApprovalScreen.tsx` | DONE | `GET /driver/me` (`status`) |
| 5 | `driver_approved_success.html` | `screens/onboarding/ApprovedScreen.tsx` | BUILD | `GET /driver/me` transition to `APPROVED` |
| 6 | `my_vehicle.html` | `screens/profile/VehicleScreen.tsx` | DONE | `GET /driver/me` (`vehicle`) |
| 7 | `driver_profile_hub.html` | `screens/profile/ProfileHubScreen.tsx` | DONE | `GET /driver/me` (rating, trips, level) |

> **CORRECTED - document expiry.** Revision 1 claimed there is no `EXPIRED`
> document status (gap 8.2) and that expiry is derived client-side.
> `src/types/driver.ts` says otherwise: `DocumentStatus` is
> `PENDING | APPROVED | REJECTED | EXPIRED`, and `DocumentType` also carries
> `CARTE_GRISE` and `TECHNICAL_INSPECTION`. The badge renders the server value.
> Gap 8.2 is withdrawn.

> **Row 5 scope.** `navigation/ApprovalGate.tsx` already routes the driver out
> of onboarding the moment `status === "APPROVED"`, so nobody is stuck without
> this screen. It is a celebration interstitial, not a gate - which is why it
> is last in the queue rather than first.

> **Row 6 scope.** The vehicle screen is deliberately read-only and sends the
> driver to `Profile` to edit. Two screens writing the same `PATCH /driver/me`
> would race, and identity fields (make / model / plate / year) reset the
> vehicle's verification to `PENDING` on the server. `GET /catalog/vehicles`
> is **not** called: vehicle type and ride class are assigned by staff during
> review, and this app will not offer a picker over a value it cannot set.

## 2. Map, zones and demand

| # | Reference | Route / file | Status | Data |
| --- | --- | --- | --- | --- |
| 8 | `main_driver_map.html` | `screens/home/DriverHomeScreen.tsx` | DONE | `POST /driver/me/availability`, socket `driver:location` |
| 9 | `work_location_search.html` | `screens/onboarding/ProfileScreen.tsx` | DONE | `GET /geography/public/wilayas`, `GET /geography/public/cities`, `PATCH /driver/me { cityId }` |
| 10 | `demand_heatmap_main.html` | `screens/zones/HeatmapScreen.tsx` | GAP | no demand/heatmap endpoint (gap 8.3) |
| 11 | `zone_demand_details.html` | `screens/zones/ZoneDetailScreen.tsx` | GAP | same gap as above |

> **CORRECTED - work location.** Revision 1 routed this to a new
> `screens/zones/WorkLocationScreen.tsx` backed by `GET /geo/geocode`,
> `GET /geofence/serviceable` and a `workZone.api`. Two of those three do not
> exist in this client: `src/api/geography.api.ts` exposes `fetchWilayas()` and
> `fetchCities(wilayaId)` and nothing else, and there is no `workZone` module.
> More importantly the picker **already exists**, in the identity section of
> `onboarding/ProfileScreen.tsx` (`useWilayas` / `useCities`, chips at the 56pt
> touch floor), and it already writes `cityId`. A second screen would have been
> a rival writer of the same field. Only `cityId` is ever sent - the wilaya is
> derived server-side so a client cannot claim a cheaper one.
>
> What is genuinely missing is free-text destination search and a serviceable
> -area check. Both are GAP, not BUILD, and are folded into gap 8.3.

## 3. Requests, bargaining and the trip

| # | Reference | Route / file | Status | Data |
| --- | --- | --- | --- | --- |
| 12 | `available_requests.html` | `screens/requests/RequestsScreen.tsx` | DONE | `GET /driver/fare-offers/opportunities` |
| 13 | `new_ride_request.html` | `components/RideOfferCard.tsx` | DONE | socket `ride:offer` -> `ride:accept` / `ride:decline`; ring driven by `expiresInMs` |
| 14 | `ride_negotiation_offer.html` | `screens/requests/FareOfferScreen.tsx` | BUILD | `POST /driver/fare-offers` |
| 15 | `negotiation_waiting_state.html` | `screens/requests/OfferWaitingScreen.tsx` | BUILD | `GET /driver/fare-offers`, `POST /driver/fare-offers/:id/withdraw` |
| 16 | `navigation_to_passenger.html` | `components/ActiveTripCard.tsx` | DONE | `POST /driver/trips/:id/arriving` |
| 17 | `driver_arrived.html` | `components/ActiveTripCard.tsx` | DONE | `POST /driver/trips/:id/start` (waiting is a UI sub-state of `ARRIVING`) |
| 18 | `active_trip.html` | `components/ActiveTripCard.tsx` | DONE | socket `trip:status`, `POST .../complete` |
| 19 | `trip_completed.html` | `screens/trip/TripCompletedScreen.tsx` | BUILD | `GET /driver/me/trips/:id` |
| 20 | `passenger_chat.html` | `screens/trip/TripChatScreen.tsx` | DONE | `GET /trip-communication/:tripId`, socket `trip:message` |
| 21 | `messages_inbox.html` | `screens/trip/MessagesInboxScreen.tsx` | BUILD* | derived from `GET /driver/me/trips`; there is no threads-list endpoint, so the inbox lists recent trips that have a thread |

> **CORRECTED - rows 13 and 16-18.** Revision 1 listed four new screens:
> `RideOfferSheet`, `NavigationScreen`, `ArrivedScreen`, `ActiveTripScreen`.
> `DriverHomeScreen` already renders `RideOfferCard` and `ActiveTripCard` as
> floating cards over `DriverMap`, driven by `useRideOffer` and
> `useTripLifecycle`. Building the screens would have produced a second copy of
> the accept / arrive / start / complete state machine, and two components
> racing to advance the same trip. Both cards were instead **rebuilt on the
> kit** this session with their prop contracts unchanged, so `DriverHomeScreen`
> did not have to be touched.
>
> Keeping the driver on the map is also the correct product call: the map is
> the working surface, and a full-screen route hides the road.

> **Row 19 blocker, stated openly.** `useTripLifecycle` calls
> `applyStatus(tripId, "COMPLETED")`, and `trip.store` clears `currentTrip` on
> any terminal status - so at the instant the trip ends there is nothing left
> in memory to summarise. The screen must therefore re-read the trip by id
> (`GET /driver/me/trips/:id`) rather than expect it to be handed over. That is
> a lifecycle change, not a layout change, which is why it is not bundled with
> the card work.

> `DRIVER_WAITING` does not exist in `TripStatus`. The arrived and waiting
> references both sit on `ARRIVING` and differ only in the UI.

## 4. Money

| # | Reference | Route / file | Status | Data |
| --- | --- | --- | --- | --- |
| 22 | `driver_wallet.html` | `screens/wallet/WalletScreen.tsx` | DONE | `GET /wallet/me` (read-only ledger) |
| 23 | `earnings_analysis.html` | `screens/wallet/EarningsScreen.tsx` | DONE | `GET /driver/me/earnings` - buckets are `today` / `week` / `all` only |
| 24 | `top_up_wallet.html` | `screens/wallet/TopUpScreen.tsx` | GAP | no top-up endpoint |
| 25 | `transfer_balance.html` | `screens/wallet/TransferScreen.tsx` | GAP | no transfer endpoint; withdrawal is also missing (gap 8.1) |

> The month bucket in the reference chart has no server equivalent (gap 8.5).
> The tab set is `today / week / all`, not `day / week / month`. The response
> is also capped at 100 rows, so the list is "recent trips", never "all trips".

## 5. Ratings and reviews

| # | Reference | Route / file | Status | Data |
| --- | --- | --- | --- | --- |
| 26 | `rating_overview.html` | `screens/rating/RatingScreen.tsx` | BUILD* | headline `rating` from `GET /driver/me`; the star **breakdown**, the rating **count** and any driver-side rating submission have no endpoint |
| 27 | `trip_reviews_history.html` | `screens/rating/ReviewsScreen.tsx` | GAP | no reviews list endpoint |
| 28 | `review_detail.html` | `screens/rating/ReviewDetailScreen.tsx` | GAP | same |

## 6. Gamification (no backend today)

`daily_goals_progress`, `rewards_tracker`, `milestone_celebration`,
`badges_achievements`, `status_levels_benefits`, `driver_leaderboard`,
`weekly_prize_pool`, `season_recap_rewards`, `referral_hub`,
`referral_history` -> `screens/rewards/*`.

All **GAP**. None of goals, badges, leaderboards, prize pools, seasons or
referrals exists in the driver API. These screens are built as real React
Native UI against a single typed source in `src/features/rewards/`, which
returns `unavailable` until endpoints exist, and they stay behind a feature
flag that is **off** by default. A driver never sees an invented balance,
ranking or prize.

Built so far:

| Reference | File | Real data | Gap shown as unavailable |
| --- | --- | --- | --- |
| `daily_goals_progress` | `screens/rewards/DailyGoalsScreen.tsx` | today's earnings + trip count, from `GET /driver/me/earnings` | goal target, streak, reward |
| `status_levels_benefits` | `screens/rewards/LevelsScreen.tsx` | `profileLevel`, `completedTripsCount`, `nextLevel`, `nextLevelAt` from `GET /driver/me` | per-tier benefits, and every threshold except the next one |

## 7. Support and safety

| # | Reference | Route / file | Status | Data |
| --- | --- | --- | --- | --- |
| 29 | `help_support.html` | `screens/support/SupportScreen.tsx` | DONE | support tickets |
| 30 | `notifications_center.html` | `screens/notifications/NotificationsScreen.tsx` | DONE | stored notifications |
| 31 | `emergency_sos.html` | `screens/safety/SafetyScreen.tsx` | DONE | `emergency.api`, contacts + SOS |
| 32 | `safety_inspection.html` | `screens/safety/InspectionScreen.tsx` | GAP | no vehicle-inspection endpoint |

---

## 8. The kit behind all of it (`src/ui`)

Step 2 delivered the design system; step 4 added the four primitives the
reference pack uses that the kit was missing.

| Primitive | Why it exists |
| --- | --- |
| `Input` | pink focus ring, error replaces the hint, RTL writing direction, 48pt floor |
| `Toggle` | emerald on / slate off; the whole row is the hit target, not the 52pt track |
| `AlertBanner` | the tinted notice for permissions, rejected documents and declared gaps |
| `SlideAction` | slide to confirm for irreversible trip steps, dragged right-to-left |

`SlideAction` uses `PanResponder` + `Animated` from React Native core rather
than Reanimated: it is a small interaction, and core Animated has no version
coupling to Reanimated or Gesture Handler.

The older one-off components in `src/components` (`InputField`, `SectionCard`,
`PrimaryButton`, ...) still exist and are still used by the screens written
before the kit. Nothing was deleted, and no screen was rewritten just to change
which button it imports.

---

## Rules this map enforces

1. No endpoint is invented. A missing endpoint is a GAP, in writing, here.
2. No row is written from a filename. If the source was not read, the row says
   so.
3. Countdowns use the server deadline (`expiresInMs`), never a constant.
4. Location cadence stays 4-5s on a trip and 8-10s idle, matching the 4s
   persistence gate.
5. `ride:request` and `ride:cancel` are passenger events and are never emitted
   by this app; `/drivers/*` (plural) is staff-only and is never called.
6. Every new screen is built from `src/ui` + `src/theme`. No new hex literals.
7. Gold appears only as a tier ring or a rating star - never on a button.
8. Earnings are always emerald.
9. A reference becomes a component, not a screen, when a screen would fork an
   existing state machine or hide the map during a trip.
