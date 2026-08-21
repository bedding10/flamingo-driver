import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { loyaltyApi } from "../../api";
import type {
  Leaderboard,
  LeaderboardScope,
  LoyaltyAccount,
  LoyaltyTier,
} from "../../api/loyalty.api";
import { useDriverProfile } from "../../hooks/useDriverProfile";
import { textAlignStart } from "../../i18n";
import {
  alpha,
  RADIUS,
  RANK_RING,
  SPACING,
  TOUCH_TARGET,
  typo,
  type RankTier,
} from "../../theme/tokens";
import { useTokens, type Tokens } from "../../theme/useTokens";
import {
  HEADER_HEIGHT,
  PillButton,
  RankAvatar,
  StatCard,
  StickyHeader,
} from "../../ui";

/**
 * Stitch `status_levels_benefits` + `driver_leaderboard`, merged into one screen
 * with two tabs because they answer the same question: where do I stand.
 *
 * WHAT IS REAL HERE:
 *  - the tier and points come from GET /loyalty/me
 *  - the driver level, next level and trips-to-next-level come from
 *    GET /driver/me (profileLevel / nextLevel / tripsToNextLevel), which the
 *    profile hook already loads
 *  - the tier ladder below is the Prisma LoyaltyTier enum, in order
 *
 * WHAT IS NOT REAL YET, and is not faked:
 *  - the city / country ranking. No server route returns it. The tab is fully
 *    designed and shows an explicit empty state; the client call is already
 *    written (GET /driver/leaderboard) and turns on by itself once the endpoint
 *    exists. See SERVER_TODO.md section 2.
 *  - per-tier benefits text. The dashboard has no benefits catalogue for
 *    drivers, so instead of inventing perks the ladder shows the thresholds it
 *    can prove and nothing else.
 */

const COPY = {
  title: "\u0627\u0644\u0637\u0628\u0642\u0627\u062a \u0648\u0627\u0644\u0635\u062f\u0627\u0631\u0629",
  tabTier: "\u0637\u0628\u0642\u062a\u064a",
  tabBoard: "\u0627\u0644\u0635\u062f\u0627\u0631\u0629",
  points: "\u0627\u0644\u0646\u0642\u0627\u0637",
  level: "\u0627\u0644\u0645\u0633\u062a\u0648\u0649",
  trips: "\u0627\u0644\u0631\u062d\u0644\u0627\u062a",
  rating: "\u0627\u0644\u062a\u0642\u064a\u064a\u0645",
  nextLevel:
    "\u0627\u0644\u0645\u0633\u062a\u0648\u0649 \u0627\u0644\u062a\u0627\u0644\u064a",
  tripsToNext:
    "\u0631\u062d\u0644\u0629 \u0645\u062a\u0628\u0642\u064a\u0629 \u0644\u0644\u062a\u0631\u0642\u064a\u0629",
  ladder:
    "\u0633\u0644\u0651\u0645 \u0627\u0644\u0637\u0628\u0642\u0627\u062a",
  current: "\u0637\u0628\u0642\u062a\u0643 \u0627\u0644\u062d\u0627\u0644\u064a\u0629",
  scopeCity: "\u0645\u062f\u064a\u0646\u062a\u064a",
  scopeCountry:
    "\u0627\u0644\u062c\u0632\u0627\u0626\u0631 \u0643\u0627\u0645\u0644\u0629",
  boardEmpty:
    "\u062a\u0631\u062a\u064a\u0628 \u0627\u0644\u0633\u0627\u0626\u0642\u064a\u0646 \u063a\u064a\u0631 \u0645\u062a\u0627\u062d \u0645\u0646 \u0627\u0644\u062e\u0627\u062f\u0645 \u0628\u0639\u062f. \u0633\u064a\u0638\u0647\u0631 \u0647\u0646\u0627 \u062a\u0644\u0642\u0627\u0626\u064a\u064b\u0627 \u0628\u0645\u062c\u0631\u062f \u062a\u0641\u0639\u064a\u0644\u0647.",
  boardError:
    "\u062a\u0639\u0630\u0631 \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u062a\u0631\u062a\u064a\u0628.",
  retry: "\u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629",
  me: "\u0623\u0646\u062a",
  tripsUnit: "\u0631\u062d\u0644\u0629",
} as const;

/** The Prisma LoyaltyTier enum, in ladder order. No invented tiers. */
const TIER_ORDER: LoyaltyTier[] = ["BRONZE", "SILVER", "GOLD", "PLATINUM"];

const TIER_LABELS: Record<LoyaltyTier, string> = {
  BRONZE: "\u0628\u0631\u0648\u0646\u0632\u064a",
  SILVER: "\u0641\u0636\u064a",
  GOLD: "\u0630\u0647\u0628\u064a",
  PLATINUM: "\u0628\u0644\u0627\u062a\u064a\u0646\u064a",
};

/**
 * The ring token set has no PLATINUM entry, so platinum borrows DIAMOND. Done
 * here, once, rather than adding a token that no design calls for.
 */
const RING_TIER: Record<LoyaltyTier, RankTier> = {
  BRONZE: "BRONZE",
  SILVER: "SILVER",
  GOLD: "GOLD",
  PLATINUM: "DIAMOND",
};

export function TiersScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const t = useTokens();
  const styles = useMemo(() => makeStyles(t), [t]);
  const { data: profile } = useDriverProfile();

  const [tab, setTab] = useState<"tier" | "board">("tier");
  const [account, setAccount] = useState<LoyaltyAccount | null>(null);
  const [loadingTier, setLoadingTier] = useState(true);

  const [scope, setScope] = useState<LeaderboardScope>("city");
  const [board, setBoard] = useState<Leaderboard | null>(null);
  const [loadingBoard, setLoadingBoard] = useState(false);
  const [boardFailed, setBoardFailed] = useState(false);

  useEffect(() => {
    let mounted = true;
    loyaltyApi
      .fetchLoyaltyAccount()
      .then((data) => {
        if (mounted) setAccount(data);
      })
      // A missing loyalty account is not an error worth a red banner: the tier
      // block simply falls back to the profile level.
      .catch(() => undefined)
      .finally(() => {
        if (mounted) setLoadingTier(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const loadBoard = useCallback(
    async (next: LeaderboardScope) => {
      setLoadingBoard(true);
      setBoardFailed(false);
      try {
        setBoard(await loyaltyApi.fetchDriverLeaderboard({ scope: next }));
      } catch {
        setBoardFailed(true);
        setBoard(null);
      } finally {
        setLoadingBoard(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (tab === "board") void loadBoard(scope);
  }, [tab, scope, loadBoard]);

  const tier = account?.tier ?? "BRONZE";

  return (
    <View style={styles.root}>
      <StickyHeader
        onBackPress={navigation.canGoBack() ? navigation.goBack : undefined}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + HEADER_HEIGHT + SPACING.xl,
            paddingBottom: insets.bottom + SPACING.xxl,
          },
        ]}
      >
        <Text style={styles.heading}>{COPY.title}</Text>

        {/* Two tabs, same pill language as the rest of the app. */}
        <View style={styles.tabs}>
          {(
            [
              ["tier", COPY.tabTier, "workspace-premium"],
              ["board", COPY.tabBoard, "leaderboard"],
            ] as const
          ).map(([key, label, icon]) => {
            const active = tab === key;
            return (
              <Pressable
                key={key}
                onPress={() => setTab(key)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                style={[styles.tab, active && styles.tabActive]}
              >
                <MaterialIcons
                  name={icon}
                  size={t.iconSize.md}
                  color={active ? t.colors.onPrimary : t.colors.onSurfaceVariant}
                />
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {tab === "tier" ? (
          <View style={styles.section}>
            {/* The hero: avatar in its tier ring, exactly like Stitch. */}
            <View style={[styles.hero, t.shadowCard]}>
              <RankAvatar
                uri={profile?.photoUrl ?? undefined}
                name={profile?.name ?? undefined}
                tier={RING_TIER[tier]}
                rating={profile?.rating ?? undefined}
                size={96}
              />
              <Text style={styles.heroTier}>{TIER_LABELS[tier]}</Text>
              {loadingTier ? (
                <ActivityIndicator color={t.colors.primary} />
              ) : (
                <Text style={styles.heroPoints}>
                  {(account?.points ?? 0) + " " + COPY.points}
                </Text>
              )}
            </View>

            {/* Real aggregates from GET /driver/me. */}
            <View style={styles.stats}>
              <StatCard
                caption={COPY.level}
                value={String(profile?.profileLevel ?? "-")}
                icon="military-tech"
                style={styles.stat}
              />
              <StatCard
                caption={COPY.trips}
                value={String(
                  profile?.completedTripsCount ?? profile?.totalTrips ?? 0,
                )}
                icon="route"
                style={styles.stat}
              />
              <StatCard
                caption={COPY.rating}
                value={
                  profile?.rating != null ? profile.rating.toFixed(2) : "-"
                }
                icon="star"
                tone="warning"
                style={styles.stat}
              />
            </View>

            {/* Progress to the next PROFILE level - the only progression the
                server actually computes today. */}
            {profile?.nextLevel != null ? (
              <View style={[styles.card, t.shadowCard]}>
                <Text style={styles.cardTitle}>
                  {COPY.nextLevel + ": " + String(profile.nextLevel)}
                </Text>
                {profile.tripsToNextLevel != null ? (
                  <Text style={styles.cardMeta}>
                    {profile.tripsToNextLevel + " " + COPY.tripsToNext}
                  </Text>
                ) : null}
              </View>
            ) : null}

            {/* The ladder. Current tier highlighted, nothing invented above it. */}
            <Text style={styles.sectionTitle}>{COPY.ladder}</Text>
            <View style={styles.ladder}>
              {TIER_ORDER.map((item) => {
                const current = item === tier;
                const ring = RANK_RING[RING_TIER[item]];
                return (
                  <View
                    key={item}
                    style={[styles.rung, current && styles.rungCurrent]}
                  >
                    <View
                      style={[styles.rungDot, { backgroundColor: ring }]}
                    />
                    <Text style={styles.rungLabel}>{TIER_LABELS[item]}</Text>
                    {current ? (
                      <Text style={styles.rungCurrentTag}>{COPY.current}</Text>
                    ) : null}
                  </View>
                );
              })}
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            {/* City vs all of Algeria. */}
            <View style={styles.tabs}>
              {(
                [
                  ["city", COPY.scopeCity],
                  ["country", COPY.scopeCountry],
                ] as const
              ).map(([key, label]) => {
                const active = scope === key;
                return (
                  <Pressable
                    key={key}
                    onPress={() => setScope(key)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                    style={[styles.tab, active && styles.tabActive]}
                  >
                    <Text
                      style={[styles.tabText, active && styles.tabTextActive]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {loadingBoard ? (
              <View style={styles.center}>
                <ActivityIndicator color={t.colors.primary} />
              </View>
            ) : boardFailed ? (
              <View style={styles.center}>
                <Text style={styles.error}>{COPY.boardError}</Text>
                <PillButton
                  label={COPY.retry}
                  variant="secondary"
                  onPress={() => {
                    void loadBoard(scope);
                  }}
                />
              </View>
            ) : !board?.available || board.rows.length === 0 ? (
              <View style={[styles.card, t.shadowCard]}>
                <MaterialIcons
                  name="leaderboard"
                  size={t.iconSize.xl}
                  color={t.colors.onSurfaceVariant}
                />
                <Text style={styles.cardMeta}>{COPY.boardEmpty}</Text>
              </View>
            ) : (
              <View style={styles.board}>
                {board.rows.map((row) => (
                  <View
                    key={row.driverId}
                    style={[
                      styles.row,
                      row.isMe && styles.rowMe,
                      t.shadowCard,
                    ]}
                  >
                    <Text style={styles.rank}>{"#" + row.rank}</Text>
                    <RankAvatar
                      uri={row.photoUrl ?? undefined}
                      name={row.name}
                      tier={row.tier ? RING_TIER[row.tier] : undefined}
                      rating={row.rating ?? undefined}
                      size={44}
                    />
                    <View style={styles.rowBody}>
                      <Text style={styles.rowName}>
                        {row.name + (row.isMe ? "  \u00b7  " + COPY.me : "")}
                      </Text>
                      {row.cityName ? (
                        <Text style={styles.rowMeta}>{row.cityName}</Text>
                      ) : null}
                    </View>
                    <Text style={styles.score}>
                      {row.score + " " + (row.scoreUnit ?? COPY.tripsUnit)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function makeStyles(t: Tokens) {
  const light = t.mode === "light";
  const border = light
    ? t.colors.outlineVariant
    : alpha(t.colors.surfaceVariant, 0.6);

  return StyleSheet.create({
    root: { flex: 1, backgroundColor: t.colors.background },
    content: { paddingHorizontal: SPACING.gutter, gap: SPACING.lg },
    heading: {
      ...typo("headlineLg"),
      color: t.colors.onSurface,
      textAlign: textAlignStart(),
    },
    tabs: { flexDirection: "row", gap: SPACING.sm },
    tab: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: SPACING.xs,
      minHeight: TOUCH_TARGET,
      borderRadius: RADIUS.full,
      backgroundColor: t.colors.surfaceContainerHigh,
    },
    tabActive: { backgroundColor: t.colors.primaryContainer },
    tabText: { ...typo("labelMd"), color: t.colors.onSurfaceVariant },
    tabTextActive: { color: t.colors.onPrimary },
    section: { gap: SPACING.lg },
    hero: {
      alignItems: "center",
      gap: SPACING.sm,
      padding: SPACING.xl,
      borderRadius: RADIUS.card,
      backgroundColor: t.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: border,
    },
    heroTier: { ...typo("titleMd"), color: t.colors.onSurface },
    heroPoints: { ...typo("labelMd"), color: t.colors.primary },
    stats: { flexDirection: "row", gap: SPACING.sm },
    stat: { flex: 1 },
    card: {
      gap: SPACING.xs,
      padding: SPACING.lg,
      borderRadius: RADIUS.card,
      backgroundColor: t.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: border,
      alignItems: "flex-start",
    },
    cardTitle: {
      ...typo("labelMd"),
      color: t.colors.onSurface,
      textAlign: textAlignStart(),
    },
    cardMeta: {
      ...typo("labelSm"),
      color: t.colors.onSurfaceVariant,
      textAlign: textAlignStart(),
    },
    sectionTitle: {
      ...typo("titleMd"),
      color: t.colors.onSurface,
      textAlign: textAlignStart(),
    },
    ladder: { gap: SPACING.sm },
    rung: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.md,
      minHeight: TOUCH_TARGET,
      paddingHorizontal: SPACING.lg,
      borderRadius: RADIUS.xl,
      backgroundColor: t.colors.surfaceContainer,
      borderWidth: 1.5,
      borderColor: "transparent",
    },
    rungCurrent: {
      borderColor: t.colors.primary,
      backgroundColor: alpha(t.colors.primary, light ? 0.08 : 0.12),
    },
    rungDot: { width: 14, height: 14, borderRadius: RADIUS.full },
    rungLabel: {
      ...typo("labelMd"),
      color: t.colors.onSurface,
      flex: 1,
      textAlign: textAlignStart(),
    },
    rungCurrentTag: { ...typo("labelSm"), color: t.colors.primary },
    center: { alignItems: "center", gap: SPACING.md, paddingVertical: SPACING.xl },
    error: { ...typo("bodyMd"), color: t.colors.error, textAlign: "center" },
    board: { gap: SPACING.sm },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.md,
      padding: SPACING.md,
      borderRadius: RADIUS.xl,
      backgroundColor: t.colors.surfaceContainerLow,
      borderWidth: 1.5,
      borderColor: "transparent",
    },
    rowMe: {
      borderColor: t.colors.primary,
      backgroundColor: alpha(t.colors.primary, light ? 0.08 : 0.12),
    },
    rank: { ...typo("titleMd"), color: t.colors.onSurfaceVariant, minWidth: 44 },
    rowBody: { flex: 1, gap: 2 },
    rowName: {
      ...typo("labelMd"),
      color: t.colors.onSurface,
      textAlign: textAlignStart(),
    },
    rowMeta: {
      ...typo("labelSm"),
      color: t.colors.onSurfaceVariant,
      textAlign: textAlignStart(),
    },
    score: { ...typo("labelMd"), color: t.colors.primary },
  });
}
