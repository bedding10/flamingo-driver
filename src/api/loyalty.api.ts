import { api } from "./client";

/**
 * Tier progression and the leaderboard.
 *
 * TWO DIFFERENT THINGS, deliberately in one file because the Stitch screens mix
 * them:
 *
 *  1. LOYALTY / TIER - real and shipped. GET /loyalty/me returns the account
 *     (tier + points), GET /loyalty/me/history the ledger. The tiers are the
 *     Prisma enum LoyaltyTier: BRONZE, SILVER, GOLD, PLATINUM. There is no
 *     "legendary" tier on the server, so the app must not show one.
 *
 *  2. LEADERBOARD - NOT on the server yet. No controller exposes a ranking of
 *     drivers by city or country. fetchDriverLeaderboard below is written
 *     against the contract requested in SERVER_TODO.md section 2 and returns a
 *     null-ish result when the route is missing (404), so the screen shows an
 *     empty state rather than an error. Nothing is faked.
 *
 * The driver's own level is a THIRD, separate thing that already works: it comes
 * back inside GET /driver/me (profileLevel, nextLevel, nextLevelAt,
 * tripsToNextLevel) and is read from the profile hook, not from here.
 */

export type LoyaltyTier = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";

export type LoyaltyAccount = {
  id: string;
  userId: string;
  tier: LoyaltyTier;
  points: number;
  lifetimePoints?: number;
  /** Points needed to reach the next tier, when the server computes it. */
  pointsToNextTier?: number | null;
  nextTier?: LoyaltyTier | null;
  updatedAt?: string;
};

export type LoyaltyLedgerEntry = {
  id: string;
  points: number;
  reason: string | null;
  type?: string;
  createdAt: string;
};

/** GET /loyalty/me */
export async function fetchLoyaltyAccount(): Promise<LoyaltyAccount> {
  const { data } = await api.get("/loyalty/me");
  return data as LoyaltyAccount;
}

/** GET /loyalty/me/history */
export async function fetchLoyaltyHistory(params?: {
  page?: number;
  limit?: number;
}): Promise<{ items: LoyaltyLedgerEntry[]; total?: number }> {
  const { data } = await api.get("/loyalty/me/history", { params });
  // The list endpoints in this backend return either an array or {items,total}.
  if (Array.isArray(data)) return { items: data as LoyaltyLedgerEntry[] };
  return data as { items: LoyaltyLedgerEntry[]; total?: number };
}

export type LeaderboardScope = "city" | "country";

export type LeaderboardRow = {
  rank: number;
  driverId: string;
  name: string;
  photoUrl: string | null;
  cityName?: string | null;
  /** Whatever the server ranks on: trips, points or rating. */
  score: number;
  scoreUnit?: string;
  rating?: number | null;
  tier?: LoyaltyTier | null;
  isMe?: boolean;
};

export type Leaderboard = {
  scope: LeaderboardScope;
  period: string;
  rows: LeaderboardRow[];
  /** The signed-in driver's own position, even when outside the top rows. */
  me?: LeaderboardRow | null;
  /** False when the route does not exist yet on this server build. */
  available: boolean;
};

/**
 * GET /driver/leaderboard?scope=city|country&period=week|month
 *
 * NOT IMPLEMENTED SERVER SIDE YET. A 404 or 501 is treated as "feature absent"
 * and reported through `available: false`; any other failure is rethrown so a
 * real outage is not disguised as an empty board.
 */
export async function fetchDriverLeaderboard(params?: {
  scope?: LeaderboardScope;
  period?: "week" | "month" | "all";
}): Promise<Leaderboard> {
  const scope = params?.scope ?? "city";
  const period = params?.period ?? "week";
  try {
    const { data } = await api.get("/driver/leaderboard", {
      params: { scope, period },
    });
    const payload = data as Partial<Leaderboard> & {
      rows?: LeaderboardRow[];
      items?: LeaderboardRow[];
    };
    return {
      scope,
      period,
      rows: payload.rows ?? payload.items ?? [],
      me: payload.me ?? null,
      available: true,
    };
  } catch (error) {
    const status = (error as { response?: { status?: number } })?.response
      ?.status;
    if (status === 404 || status === 501) {
      return { scope, period, rows: [], me: null, available: false };
    }
    throw error;
  }
}
