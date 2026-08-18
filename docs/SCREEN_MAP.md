# Reference pack -> React Native screens

The 42 HTML files are the **design reference**. They are not shipped, they are
not converted to WebViews, and no screen embeds HTML. This table is the
contract: each reference becomes a React Native screen, bound to an endpoint
that is **verified to exist** in `DRIVER_API_MAPPING.md`, or it is marked GAP.

Order of work (as agreed): reference files -> design system -> screens ->
components -> backend binding -> testing.

## Legend

| Mark | Meaning |
| --- | --- |
| DONE | Screen already exists in `src/screens` and covers the reference |
| BUILD | To be written, backend exists and is verified |
| GAP | No backend endpoint exists - UI only, behind a feature flag, never faked as real data |

---

## 1. Onboarding and account

| # | Reference | Route / file | Status | Data |
| --- | --- | --- | --- | --- |
| 1 | `splash_screen.html` | `screens/BootScreen.tsx` | DONE | token bootstrap + `GET /auth/me` |
| 2 | `upload_driving_license.html` | `screens/onboarding/DocumentsScreen.tsx` | DONE | `POST /driver/me/upload-url` -> R2 PUT -> `POST /driver/me/documents` |
| 3 | `document_verification_checklist.html` | `screens/onboarding/DocumentsScreen.tsx` | DONE | `GET /driver/me` (`documents[]`, status PENDING/APPROVED/REJECTED) |
| 4 | `application_under_review.html` | `screens/onboarding/PendingApprovalScreen.tsx` | DONE | `GET /driver/me` (`status`) |
| 5 | `driver_approved_success.html` | `screens/onboarding/ApprovedScreen.tsx` | BUILD | `GET /driver/me` transition to `APPROVED` |
| 6 | `my_vehicle.html` | `screens/profile/VehicleScreen.tsx` | BUILD | `GET /driver/me`, `PATCH /driver/me`, `GET /catalog/vehicles` |
| 7 | `driver_profile_hub.html` | `screens/profile/ProfileHubScreen.tsx` | BUILD | `GET /driver/me` (rating, trips, availability) |

> There is **no `EXPIRED` document status** on the server (gap 8.2). Expiry is
> shown from the driver-entered dates in `utils/documentDates.ts`, and the badge
> stays PENDING / APPROVED / REJECTED.

## 2. Map, zones and demand

| # | Reference | Route / file | Status | Data |
| --- | --- | --- | --- | --- |
| 8 | `main_driver_map.html` | `screens/home/DriverHomeScreen.tsx` | DONE | `POST /driver/me/availability`, socket `driver:location` |
| 9 | `work_location_search.html` | `screens/zones/WorkLocationScreen.tsx` | BUILD | `GET /geo/geocode`, `GET /geofence/serviceable`, `workZone.api` |
| 10 | `demand_heatmap_main.html` | `screens/zones/HeatmapScreen.tsx` | GAP | no demand/heatmap endpoint (gap 8.3) |
| 11 | `zone_demand_details.html` | `screens/zones/ZoneDetailScreen.tsx` | GAP | same gap as above |

## 3. Requests, bargaining and the trip

| # | Reference | Route / file | Status | Data |
| --- | --- | --- | --- | --- |
| 12 | `available_requests.html` | `screens/requests/RequestsScreen.tsx` | DONE | `GET /driver/fare-offers/opportunities` |
| 13 | `new_ride_request.html` | `screens/requests/RideOfferSheet.tsx` | BUILD | socket `ride:offer` -> `ride:accept` / `ride:decline`; ring driven by `expiresInMs` |
| 14 | `ride_negotiation_offer.html` | `screens/requests/FareOfferScreen.tsx` | BUILD | `POST /driver/fare-offers` |
| 15 | `negotiation_waiting_state.html` | `screens/requests/OfferWaitingScreen.tsx` | BUILD | `GET /driver/fare-offers`, `POST /driver/fare-offers/:id/withdraw` |
| 16 | `navigation_to_passenger.html` | `screens/trip/NavigationScreen.tsx` | BUILD | `POST /driver/trips/:id/arriving`, `POST /geo/directions` |
| 17 | `driver_arrived.html` | `screens/trip/ArrivedScreen.tsx` | BUILD | `POST /driver/trips/:id/start` (waiting is a UI sub-state of `ARRIVING`) |
| 18 | `active_trip.html` | `screens/trip/ActiveTripScreen.tsx` | BUILD | `trip:status`, `GET /driver/trips/:id/track`, `POST .../complete` |
| 19 | `trip_completed.html` | `screens/trip/TripCompletedScreen.tsx` | BUILD | `GET /driver/me/trips/:id`, `GET /driver/me/earnings` |
| 20 | `passenger_chat.html` | `screens/trip/TripChatScreen.tsx` | DONE | `GET /trip-communication/:tripId`, socket `trip:message` |
| 21 | `messages_inbox.html` | `screens/trip/MessagesInboxScreen.tsx` | BUILD* | derived from `GET /driver/me/trips`; there is no threads-list endpoint, so the inbox lists recent trips that have a thread |

> `DRIVER_WAITING` does not exist in `TripStatus`. The arrived/waiting screens
> both sit on `ARRIVING` and differ only in the UI.

## 4. Money

| # | Reference | Route / file | Status | Data |
| --- | --- | --- | --- | --- |
| 22 | `driver_wallet.html` | `screens/wallet/WalletScreen.tsx` | DONE | `GET /wallet/me` (read-only ledger) |
| 23 | `earnings_analysis.html` | `screens/wallet/EarningsScreen.tsx` | BUILD | `GET /driver/me/earnings` - buckets are `today` / `week` / `all` only |
| 24 | `top_up_wallet.html` | `screens/wallet/TopUpScreen.tsx` | GAP | no top-up endpoint |
| 25 | `transfer_balance.html` | `screens/wallet/TransferScreen.tsx` | GAP | no transfer endpoint; withdrawal is also missing (gap 8.1) |

> The month bucket in the reference chart has no server equivalent (gap 8.5).
> The tab set is `today / week / all`, not `day / week / month`.

## 5. Ratings and reviews

| # | Reference | Route / file | Status | Data |
| --- | --- | --- | --- | --- |
| 26 | `rating_overview.html` | `screens/rating/RatingScreen.tsx` | BUILD* | headline rating from `GET /driver/me`; the star **breakdown** has no endpoint |
| 27 | `trip_reviews_history.html` | `screens/rating/ReviewsScreen.tsx` | GAP | no reviews list endpoint |
| 28 | `review_detail.html` | `screens/rating/ReviewDetailScreen.tsx` | GAP | same |

## 6. Gamification (no backend today)

`daily_goals_progress`, `rewards_tracker`, `milestone_celebration`,
`badges_achievements`, `status_levels_benefits`, `driver_leaderboard`,
`weekly_prize_pool`, `season_recap_rewards`, `referral_hub`,
`referral_history` -> `screens/rewards/*`.

All **GAP**. None of goals, badges, levels, leaderboards, prize pools, seasons
or referrals exists in the driver API. These screens are built as real React
Native UI against a single typed source in `src/features/rewards/`, which
returns `unavailable` until endpoints exist, and they stay behind a feature
flag that is **off** by default. A driver never sees an invented balance,
ranking or prize.

The one partial exception is `daily_goals_progress`: the *earnings* half of it
can be computed from `GET /driver/me/earnings` (today's total and trip count).
The goal target, streak and reward are the gap.

## 7. Support and safety

| # | Reference | Route / file | Status | Data |
| --- | --- | --- | --- | --- |
| 29 | `help_support.html` | `screens/support/SupportScreen.tsx` | DONE | support tickets |
| 30 | `notifications_center.html` | `screens/notifications/NotificationsScreen.tsx` | DONE | stored notifications |
| 31 | `emergency_sos.html` | `screens/safety/SafetyScreen.tsx` | DONE | `emergency.api`, contacts + SOS |
| 32 | `safety_inspection.html` | `screens/safety/InspectionScreen.tsx` | GAP | no vehicle-inspection endpoint |

---

## Rules this map enforces

1. No endpoint is invented. A missing endpoint is a GAP, in writing, here.
2. Countdowns use the server deadline (`expiresInMs`), never a constant.
3. Location cadence stays 4-5s on a trip and 8-10s idle, matching the 4s
   persistence gate.
4. `ride:request` and `ride:cancel` are passenger events and are never emitted
   by this app; `/drivers/*` (plural) is staff-only and is never called.
5. Every screen is built from `src/ui` + `src/theme`. No new hex literals.
6. Gold appears only as a tier ring or a rating star - never on a button.
7. Earnings are always emerald.
