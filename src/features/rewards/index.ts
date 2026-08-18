/**
 * Gamification - goals, badges, levels, leaderboards, prize pools, seasons,
 * referrals, milestones.
 *
 * STATUS: THERE IS NO BACKEND FOR ANY OF THIS.
 *
 * The reference pack contains ten screens for it. `DRIVER_API_MAPPING.md` was
 * verified against the running NestJS server and there is no endpoint for a
 * goal, a badge, a tier benefit, a ranking, a prize pool, a season or a
 * referral. Three options existed:
 *
 *   1. invent endpoints and call them - they would 404 forever;
 *   2. hardcode numbers in the screens - a driver would read an invented
 *      ranking or prize as real, which is the worst possible outcome for a
 *      screen about money;
 *   3. build the UI, put every one of these features behind ONE typed source
 *      that answers "unavailable, here is why", and keep it switched off.
 *
 * This file is option 3. When the endpoints ship, only this module changes:
 * the screens already exist and already render the real shapes.
 */

/** Flip to true only when real endpoints exist AND are in DRIVER_API_MAPPING. */
export const REWARDS_BACKEND_AVAILABLE = false;

export type RewardsFeature =
  | "dailyGoals"
  | "rewardsTracker"
  | "badges"
  | "levels"
  | "leaderboard"
  | "prizePool"
  | "season"
  | "referrals"
  | "milestones";

/** The reference file each feature comes from, kept for the gap log. */
export const REWARDS_REFERENCE: Record<RewardsFeature, string> = {
  dailyGoals: "daily_goals_progress.html",
  rewardsTracker: "rewards_tracker.html",
  badges: "badges_achievements.html",
  levels: "status_levels_benefits.html",
  leaderboard: "driver_leaderboard.html",
  prizePool: "weekly_prize_pool.html",
  season: "season_recap_rewards.html",
  referrals: "referral_hub.html",
  milestones: "milestone_celebration.html",
};

export type RewardsState<T> =
  | { available: true; data: T }
  | { available: false; feature: RewardsFeature; reason: string };

/**
 * The single entry point every gamification screen uses.
 *
 * It is generic so a screen can already declare the shape it expects; today it
 * always resolves to the unavailable branch, so a screen that forgets to handle
 * it does not compile.
 */
export function loadRewardsFeature<T>(
  feature: RewardsFeature,
): RewardsState<T> {
  return {
    available: false,
    feature,
    reason: `لا يوجد حاليًا مسار في الخادم يوفر هذه البيانات (${REWARDS_REFERENCE[feature]}).`,
  };
}

/**
 * The tier names the profile already carries (`DriverProfile.profileLevel`).
 * The LEVEL exists on the server; the BENEFITS attached to it do not, which is
 * why `status_levels_benefits.html` is still a gap.
 */
export const KNOWN_LEVELS = [
  "BRONZE",
  "SILVER",
  "GOLD",
  "DIAMOND",
  "LEGENDARY",
] as const;

export type KnownLevel = (typeof KNOWN_LEVELS)[number];
