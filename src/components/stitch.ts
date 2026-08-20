/**
 * PHASE 1 - the design system's component surface (section 47).
 *
 * This module exposes the thirteen canonical component names from the skill's
 * component list. Screens written from PHASE 2 onward should import from here,
 * so there is exactly one documented name per role.
 *
 * WHY THIS IS A BARREL AND NOT THIRTEEN RENAMED FILES
 * --------------------------------------------------
 * Eleven of the thirteen roles already had a working implementation in this
 * codebase under an older name, several of them carrying hard-won behaviour:
 * VehicleMarker's `tracksViewChanges` handling, ProfileAvatar's frame cache,
 * DriverTabBar's mounted-map constraint. Two - StitchHeader and
 * StitchBottomSheet - genuinely did not exist and were built in this phase.
 *
 * Physically renaming the eleven files would have rewritten the import lines of
 * fourteen screens without changing a single pixel or behaviour. Section 1 says
 * not to replace working architecture for convenience and section 5 says to
 * prefer incremental refactor, so the canonical NAMES are provided here while
 * the implementations stay where they are, with their history and their
 * comments intact.
 *
 * The practical effect is the same as the rename: there is one component per
 * role, discoverable under the name the skill uses, and a new screen never has
 * to guess which of two similar components to reach for.
 *
 * Each alias below is annotated with what it actually is, so nobody has to read
 * this file twice to find out.
 */

// ---- form and action ------------------------------------------------------

/** Pill button, filled / outline / ghost. Implementation: PrimaryButton. */
export { PrimaryButton as StitchButton } from "./PrimaryButton";

/** Text field with label, error and numeric mode. Implementation: InputField. */
export { InputField as StitchInput } from "./InputField";

// ---- surfaces -------------------------------------------------------------

/** 24px-radius card with a title and optional hint. Implementation: SectionCard. */
export { SectionCard as StitchCard } from "./SectionCard";

/**
 * Anchored sheet: 24px top corners, grab handle, never full-screen.
 * Built in PHASE 1 - the tree had no way to draw a Stitch sheet before.
 */
export { StitchBottomSheet } from "./StitchBottomSheet";

/**
 * Screen header: 20px title, 48px touch targets, optional trailing action.
 * Built in PHASE 1 - screens were using the native stack header, which is how
 * the banned gold tint reached the whole app.
 */
export { StitchHeader, type StitchHeaderAction } from "./StitchHeader";

// ---- status and identity --------------------------------------------------

/** Status pill with tone and optional presence dot. Implementation: StatusPill. */
export { StatusPill as StitchBadge, type PillTone } from "./StatusPill";

/**
 * Avatar with the server-rendered level frame drawn over it.
 * Implementation: ProfileAvatar.
 */
export {
  ProfileAvatar as StitchAvatar,
  type ProfileAvatarProps,
} from "./ProfileAvatar";

/**
 * The floating status card on the map: presence, vehicle, hint and warnings.
 * Implementation: HomeStatusCard.
 */
export { HomeStatusCard as StitchStatCard } from "./HomeStatusCard";

// ---- map ------------------------------------------------------------------

/**
 * The driver's own vehicle on the map, with heading and a pink fallback puck.
 * Implementation: VehicleMarker.
 */
export {
  VehicleMarker as StitchMapMarker,
  vehicleMarkerUrl,
  type VehicleMarkerProps,
} from "./VehicleMarker";

// ---- the three list states ------------------------------------------------

/** "Nothing here yet", with an optional action. Implementation: EmptyState. */
export { EmptyState as StitchEmptyState } from "./EmptyState";

/**
 * "This failed", danger tone, retry always offered. Implementation: ErrorState.
 * These two are deliberately distinct components: a driver must be able to tell
 * a quiet day from a broken connection.
 */
export { ErrorState as StitchErrorState } from "./EmptyState";

/**
 * Loading placeholders. `StitchLoadingState` is the stacked-card list, which is
 * the default "a list is loading" case; the single bar and single card are
 * exported too for screens that are not lists.
 */
export {
  SkeletonList as StitchLoadingState,
  Skeleton,
  SkeletonCard,
} from "./Skeleton";

// ---- navigation -----------------------------------------------------------

/**
 * The floating three-section bar: Requests / Map / Menu, map in the centre.
 * Implementation: DriverTabBar. Mounted once by DriverNavigator, never by a
 * screen - see the R-8 note there.
 *
 * `navSpace()` is exported alongside it because any floating card on the map
 * has to use it to clear the bar.
 */
export {
  DriverTabBar as StitchBottomNavigation,
  navSpace,
  TAB_BAR_HEIGHT,
  TAB_BAR_MARGIN,
  type DriverTab,
} from "./DriverTabBar";
