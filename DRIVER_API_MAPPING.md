# DRIVER_API_MAPPING.md

**flaminGO Driver — Phase 1 deliverable.**
Every row below was extracted from the live backend tree (`backend/src`, `prisma/schema.prisma`).
Nothing here is assumed. Where the Master Spec assumed a name that does not exist on the
server, the real name is used and the difference is recorded in section 9 (Spec vs Server).

- Backend: NestJS + Prisma + PostgreSQL + Redis + Socket.IO
- Total HTTP routes in the server: **495**
- Routes reachable with role `DRIVER`: **14** (plus shared/public ones listed below)
- Global API prefix: `/api` -> `EXPO_PUBLIC_API_URL = https://<host>/api`
- Socket namespace: default `/`, auth via the same JWT access token

---

## 1. Master mapping table

| Feature | HTTP API | Socket event | Status |
| --- | --- | --- | --- |
| Login (phone + Firebase) | `POST /auth/firebase` body `{ idToken, role: "DRIVER" }` | - | READY |
| Session refresh | `POST /auth/refresh` `{ refreshToken }` | - | READY |
| Logout | `POST /auth/logout` | - | READY |
| Current identity | `POST /auth/me` | - | READY |
| Change password | `POST /auth/password/change` | - | READY |
| Driver profile (read) | `GET /driver/me` | - | READY |
| Driver + vehicle profile (write) | `PATCH /driver/me` | - | READY |
| Document upload URL | `POST /driver/me/upload-url` `{ kind, contentType? }` | - | READY |
| Register uploaded document | `POST /driver/me/documents` `{ type, url }` | - | READY |
| Sanctions / suspension state | `GET /driver/me/sanctions` | - | READY |
| Go Online / Go Offline | `POST /driver/me/availability` `{ availability: "ONLINE" \| "OFFLINE" }` | - | READY |
| Location tracking | **no REST endpoint** | OUT `driver:location` `{ lat, lng, heading?, speed? }` | READY (socket only) |
| Receive trip offer | - | IN `ride:offer` | READY |
| Offer expired | - | IN `ride:offer_expired` `{ tripId }` | READY |
| Accept trip | **no REST endpoint** | OUT `ride:accept` `{ tripId }` | READY (socket only) |
| Reject trip | **no REST endpoint** | OUT `ride:decline` `{ tripId }` | READY (socket only) |
| Assignment confirmed | - | IN `ride:assigned` `{ tripId }` | READY |
| Join trip room | - | OUT `trip:join` `{ tripId }` | READY |
| Trip status stream | - | IN `trip:status` `{ tripId, status }` | READY |
| In-trip chat | `GET /trip-communication/:tripId` | IN `trip:message` | READY |
| Arrived at pickup | `POST /driver/trips/:id/arriving` | (server emits `trip:status`) | READY |
| Start trip | `POST /driver/trips/:id/start` | (server emits `trip:status`) | READY |
| Complete trip | `POST /driver/trips/:id/complete` | (server emits `trip:status`) | READY |
| Cancel trip (driver) | `POST /driver/trips/:id/cancel` | (server emits `trip:status`) | READY |
| Alternative status change | `PATCH /driver/me/trips/:id/status` `{ status, reason? }` | - | READY |
| Trip route replay | `GET /driver/trips/:id/track` | - | READY |
| Trip list / history | `GET /driver/me/trips` (paginated) | - | READY |
| Trip detail | `GET /driver/me/trips/:id` | - | READY |
| Earnings | `GET /driver/me/earnings` | - | READY |
| Wallet balance | `GET /wallet/me` | - | READY (read-only) |
| Payout history | `GET /payments/payouts/me` | - | READY (read-only) |
| **Withdrawal request** | **MISSING for role DRIVER** | - | **GAP — see 8.1** |
| Fare bargaining: send offer | `POST /driver/fare-offers` | - | READY |
| Fare bargaining: my offers | `GET /driver/fare-offers` | - | READY |
| Fare bargaining: opportunities | `GET /driver/fare-offers/opportunities` | - | READY |
| Fare bargaining: withdraw | `POST /driver/fare-offers/:id/withdraw` | - | READY |
| Push registration (FCM) | `POST /notifications/devices` `{ token, platform }` | - | READY |
| Push de-registration | `DELETE /notifications/devices/:token` | - | READY |
| Vehicle catalog | `GET /catalog/vehicles` | - | READY |
| Geocode / reverse / directions | `GET /geo/geocode`, `GET /geo/reverse`, `POST /geo/directions` | - | READY |
| Service-area check | `GET /geofence/serviceable` | - | READY |
| Legal documents to accept | `GET /legal-documents/pending`, `POST /legal-documents/:id/accept` | - | READY |
| Lost items (driver view) | `GET /lost-items/driver` | - | READY |
| Socket transport error | - | IN `ride:error` `{ message }` | READY |

---

## 2. Authentication (verified)

```
Driver enters phone -> Firebase Phone Auth -> Firebase idToken
     -> POST /auth/firebase { idToken, role: "DRIVER" }
     -> { accessToken, refreshToken }  (store in expo-secure-store)
     -> socket connects with the same accessToken
```

- `POST /auth/otp/request` and `POST /auth/otp/verify` exist but **local OTP is disabled**
  (`requestOtp` throws unless `AUTH_OTP_CHANNEL=sms`, and `verifyOtp` issues no tokens).
  Firebase is the only working auth path — exactly as decided for the passenger app.
- Rate limits per IP (`AUTH_RATE_LIMITS`): register 10/min, login 15/min, firebase 15/min,
  refresh 30/min, passwordChange 5/min.
- Guards: `JwtAuthGuard` + `RolesGuard` with `@Roles("DRIVER")` on `/driver/*`.
  `/drivers/*` (plural) is **STAFF-only** — the driver app must never call it.

---

## 3. Socket contract (verified, exact names)

On connect the server joins the socket to `user:{userId}` automatically, so all
driver-targeted events arrive without any subscribe call.

**Driver -> Server (inbound handlers):**

| Event | Payload | Guard |
| --- | --- | --- |
| `driver:location` | `{ lat, lng, heading?, speed? }` | role must be DRIVER; invalid lat/lng dropped silently; rate-limited (over-limit = silent drop, no error) |
| `ride:accept` | `{ tripId }` | role DRIVER |
| `ride:decline` | `{ tripId }` | role DRIVER |
| `trip:join` | `{ tripId }` | participants only (server verifies `isParticipant`, else `ride:error: forbidden`) |

`ride:request` and `ride:cancel` are **PASSENGER-only** — the driver app must not emit them.

**Server -> Driver (listen):**

| Event | Payload |
| --- | --- |
| `ride:offer` | `{ tripId, pickupLat, pickupLng, pickupAddress, destLat, destLng, destAddress, rideClass, vehicleTypeId, fare, commissionPct, currency, distanceKm, expiresInMs, passenger }` |
| `ride:offer_expired` | `{ tripId }` |
| `ride:assigned` | `{ tripId }` |
| `trip:status` | `{ tripId, status }` |
| `driver:moved` | `{ tripId?, driverId, lat, lng, heading, speed, busy }` (trip room echo) |
| `trip:message` | in-trip chat message |
| `ride:error` | `{ message }` e.g. `rate_limited`, `forbidden` |

**Offer countdown is 20 seconds, not 15.** `OFFER_TIMEOUT_MS = 20_000`
(`matching.service.ts:40`) and the value is echoed in the payload as `expiresInMs` —
the UI must count down from `expiresInMs`, never from a hardcoded number.

**GPS cadence:** the server persists at most one tracking point every
`TRACK_PERSIST_INTERVAL_SEC = 4` seconds per trip (Redis `NX EX` gate) and stores the
latest position in Redis geo on every event. Emitting every 4-5s while on a trip and
every 8-10s while idle-online matches the server without waste. Anything faster is
discarded by the rate limiter.

---

## 4. Trip state machine (Prisma `TripStatus`)

```
SCHEDULED  SEARCHING  ACCEPTED  ARRIVING  IN_PROGRESS  COMPLETED  CANCELLED
```

Driver-permitted transitions (enforced in `TripsService.driverChangeStatus`):

```
ACCEPTED    --POST /driver/trips/:id/arriving--> ARRIVING
ARRIVING    --POST /driver/trips/:id/start-----> IN_PROGRESS
IN_PROGRESS --POST /driver/trips/:id/complete--> COMPLETED   (auto financial settlement)
any active  --POST /driver/trips/:id/cancel----> CANCELLED
```

There is **no `DRIVER_WAITING` state** on the server: waiting at the pickup point is the
ARRIVING state, so it is a UI sub-state only, never a status sent to the API.

Other enums the driver app needs:

| Enum | Values |
| --- | --- |
| `DriverStatus` (account) | PENDING, APPROVED, REJECTED, SUSPENDED, BANNED |
| `DriverAvailability` | OFFLINE, ONLINE, ON_TRIP (ON_TRIP is server-managed, never sent by the app) |
| `DocumentType` | LICENSE, ID_CARD, INSURANCE, REGISTRATION, PROFILE_PHOTO |
| `DocumentStatus` | PENDING, APPROVED, REJECTED |
| `FareOfferStatus` | PENDING, ACCEPTED, REJECTED, WITHDRAWN, EXPIRED |
| `PayoutItemStatus` | PENDING, PAID, FAILED |
| `PayoutBatchStatus` | DRAFT, SUBMITTED, PROCESSING, PAID, FAILED, CANCELED |

---

## 5. Go Online rules (server-enforced, must be mirrored in the UI)

From `driver-self.service.ts:179`:

1. `availability: "ONLINE"` is rejected with 403 unless `driver.status === "APPROVED"`
   -> a PENDING driver must see the onboarding/approval screen, not the Go Online button.
2. Availability cannot change while `availability === "ON_TRIP"` (400) -> disable the
   toggle during an active trip.
3. Every successful call refreshes `lastSeenAt`.

---

## 6. Onboarding + documents (verified flow)

```
PATCH /driver/me            (name, phone, carMake, carModel, carColor, carPlate,
                             carYear, rideClass, vehicleTypeId, vehicleCategoryId, cityId)
POST  /driver/me/upload-url { kind: DocumentType, contentType? }  -> signed R2 upload URL
PUT   <signed url>          (raw file upload, no auth header)
POST  /driver/me/documents  { type: DocumentType, url }           -> status PENDING
GET   /driver/me            -> read back each document status
```

Approval/rejection is done by STAFF in the Dashboard (`PATCH /drivers/documents/:docId/review`).
The app only reads status — no business logic, per rule 19 of the spec.

---

## 7. Earnings shape (verified)

`GET /driver/me/earnings` returns the last 100 `DriverEarning` rows joined with
`{ trip.id, destAddress, distanceKm, rideClass, completedAt }`, plus server-computed
`today` / `week` / `all` totals (week starts Monday). **There is no month bucket** —
render today/week/all, or compute a month view client-side from the returned rows
(accurate only for the last 100 trips).

---

## 8. Recorded backend gaps (log, do not invent — spec rule 4)

### 8.1 Driver withdrawal request — MISSING
`@Controller("wallet")` exposes exactly one route: `GET /wallet/me`.
Money-out flows exist only for staff:
`/driver-transfers` and `/driver-funding` are guarded `@Roles("STAFF", "AGENT")`.
The driver can **read** payouts (`GET /payments/payouts/me`) but cannot create a
withdrawal request. -> The Wallet screen ships read-only (balance, commissions,
transactions, payout history) with withdrawal presented as "handled by the operator",
until a `DRIVER`-scoped endpoint is added.

### 8.2 `DocumentStatus` has no `EXPIRED`
The spec lists Pending/Approved/Rejected/**Expired**; Prisma has only the first three.
Expiry must not be faked in the app.

### 8.3 No dedicated "demand zones / heatmap" endpoint
`GET /geofence/serviceable` returns serviceability only. Uber-style demand heat zones
have no data source -> omit that layer from the map.

### 8.4 No `wallet_update` or `driver_status` socket events
Wallet and availability changes are REST-only; the app must refetch after mutations
(no push channel exists for them).

### 8.5 No month bucket in earnings (see section 7).

---

## 9. Spec vs Server — corrections applied

| Master Spec says | Server reality | Action |
| --- | --- | --- |
| `trip_request` | `ride:offer` | use `ride:offer` |
| `trip_update` | `trip:status` | use `trip:status` |
| `location_update` | `driver:location` (out) / `driver:moved` (in) | use both real names |
| `driver_status` event | does not exist | REST `POST /driver/me/availability` |
| `wallet_update` event | does not exist | refetch `GET /wallet/me` |
| `notification` event | does not exist | FCM push via `POST /notifications/devices` |
| Countdown 15s | `OFFER_TIMEOUT_MS = 20_000`, echoed as `expiresInMs` | drive UI from payload |
| `POST /trip/start` | `POST /driver/trips/:id/start` | use the real path |
| Accept/Reject via REST | socket-only `ride:accept` / `ride:decline` | socket, with REST status calls afterwards |
| States `DRIVER_ACCEPTED`, `TRIP_STARTED`, `DRIVER_WAITING`... | `ACCEPTED`, `IN_PROGRESS`, (no WAITING) | use the Prisma enum verbatim |
| Withdrawal screen | no driver endpoint | gap 8.1, read-only wallet |
| Bare React Native 0.74 | passenger app is Expo (SDK 51-era, RN 0.74, Hermes, expo-secure-store, expo-location, react-native-maps, @react-native-firebase) | reuse the passenger stack for one toolchain, one EAS pipeline, shared theme |

**Not in the spec but present on the server and worth shipping:** driver-side fare
bargaining (`/driver/fare-offers*`) — the passenger app already negotiates, so the
driver needs the counter-offer UI for the feature to work end-to-end.

---

## 10. Phase plan status

| Phase | Scope | State |
| --- | --- | --- |
| 1 | Backend analysis + this file | **DONE** |
| 2 | Project skeleton: navigation, theme, API client, socket service, secure storage | next |
| 3 | Login, profile, onboarding, documents | pending |
| 4 | Driver Home, Online/Offline, location tracking | pending |
| 5 | Offer modal, trip lifecycle | pending |
| 6 | Earnings, wallet (read-only), settings | pending |
| 7 | End-to-end scenario against the live server | pending |
