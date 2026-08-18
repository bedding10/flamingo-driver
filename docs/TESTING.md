# Testing

## What was actually run on this branch

Be blunt about this, because a green-looking branch that was never compiled is
worse than an honest red one.

The UI migration on `feature/stitch-ui-kit` was authored in a sandbox with **no
network and no `node_modules`**. That means:

| Command | Run on this branch? |
| --- | --- |
| `npm run typecheck` (`tsc --noEmit`) | **No.** Not once. |
| `npm run lint` (`eslint --max-warnings=0`) | **No.** |
| `expo start` / `expo export` / `expo-doctor` | **No.** |
| Anything on a device or emulator | **No.** |
| `npm run design:check` | **Yes** - it is written to need nothing but node. |

So the first CI run on this branch is a real first run. Expect it to find
things. The most likely failure is `lint`, because it runs with
`--max-warnings=0` and a single unused import fails the build - which is exactly
why `design:check` looks for dead imports itself.

## `npm run design:check`

`scripts/check-design-system.mjs` encodes the rules of the `src/ui` migration
that eslint cannot know about. No dependencies, plain node, so it runs anywhere.

| Rule | Meaning |
| --- | --- |
| `dead-import` | An imported name is never used. Fails eslint too, but this catches it without `node_modules`. |
| `raw-text` | A screen or component imports `Text` from `react-native` instead of `AppText`. |
| `rtl-textalign` | `textAlign: "left"` in a right-to-left app. |
| `hardcoded-colour` (advice) | A hex literal outside `src/theme`. `#000000` and `#FFFFFF` are allowed: a modal scrim is not a brand colour. |
| `literal-row` (advice) | `flexDirection: "row"` instead of the `rtlRow` helper. |

### Strict vs advisory

Only paths in `STRICT_PATHS` fail the run. Everywhere else the same finding is
printed as advice. This is deliberate: the migration is unfinished, and a
checker that turns the whole repo red on day one is a checker somebody deletes.

**When you migrate a directory onto the kit, add it to `STRICT_PATHS`.** That
list is the real record of how far the migration has got.

### How the checker itself was tested

Against fixtures, not by hoping:

- A clean file whose JSDoc deliberately names symbols it does not import -
  reported nothing, so comments are stripped before the usage scan.
- A violating file whose JSDoc mentions two imports it never uses - both were
  still reported as `dead-import`, along with `raw-text` and `rtl-textalign`.
- The same faults in a non-strict path - reported as advice, exit code 0.
- The three newest real files (`FareOpportunityCard.tsx`,
  `ReportRequestSheet.tsx`, `RequestsScreen.tsx`) - 0 errors, 0 advisory.

Known blind spot: string literals are not stripped, so a name that appears only
inside a string counts as used. That direction is chosen on purpose - a missed
dead import is an annoyance, a false accusation is a broken build.

## What still needs a human, a device and the real backend

None of this can be checked statically:

1. **Direct accept has no confirmation step.** One tap on a card creates a trip.
   This was a project-owner decision, not an oversight - but it is the single
   riskiest interaction in the app and it should be watched with a real finger
   on a real phone before release.
2. **Socket flows.** `fare:offer_accepted`, `fare:offer_rejected`,
   `fare:offer_expired`, `ride:offer`, `ride:assigned`, `trip:status`. Offline
   there is no way to make these fire.
3. **The fare band.** The card refuses amounts outside `[minFare, maxFare]` from
   the quote. Confirm the server agrees rather than returning
   `FARE_OFFER_OUT_OF_RANGE` anyway.
4. **RTL rendering.** `rtlRow` and mirrored chevrons are correct in source; only
   a device shows whether the result reads properly in Arabic.
5. **Maps, haptics, permissions.** Nothing about `react-native-maps`,
   `expo-haptics` or location permission can be exercised here.
6. **`ACTIVE_TRIP_EXISTS`.** Claiming a quote while a trip is running must fail
   cleanly and show the driver why.

## Suggested first CI run

```bash
npm ci
npm run design:check   # cheapest, no build needed
npm run typecheck
npm run lint
npm run ci:validate
```

Run `design:check` first: it needs no install step and catches the dead-import
class of failure in under a second.
