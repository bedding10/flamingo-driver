import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { ProfileAvatar } from "../../components/ProfileAvatar";
import { useDriverProfile } from "../../hooks/useDriverProfile";
import { KNOWN_LEVELS, loadRewardsFeature } from "../../features/rewards";
import { LEVEL_LABELS, hubStrings as t } from "../../i18n/strings.profile.hub";
import { rewardsStrings } from "../../i18n/strings.rewards";
import {
  AppText,
  Badge,
  Card,
  ListRow,
  ProgressBar,
  Screen,
  rtlRow,
} from "../../ui";
import { spacing } from "../../theme";

/**
 * Reference: `status_levels_benefits.html`.
 *
 * SPLIT DOWN THE MIDDLE, BY WHAT THE SERVER KNOWS
 *
 * Real, from GET /driver/me: the current tier, the completed-trip count behind
 * it, the next tier, the trip count it unlocks at, and how many trips remain.
 * That is a genuine progression bar, so it is drawn.
 *
 * Missing: what each tier GIVES (the benefit list the reference fills with
 * commission cuts and priority dispatch) and the thresholds of tiers other than
 * the immediate next one. Neither exists in the API. The tier list is therefore
 * rendered as names only, with the current one marked, and the absence is
 * stated instead of being filled with plausible-looking perks - a driver must
 * never plan their week around a benefit this app invented.
 */
export function LevelsScreen() {
  const { data: profile, isLoading } = useDriverProfile();
  const benefits = loadRewardsFeature("levels");

  if (isLoading || !profile) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      </Screen>
    );
  }

  const current = profile.profileLevel ?? null;
  const completed = profile.completedTripsCount ?? profile.totalTrips;
  const target = profile.nextLevelAt ?? null;
  const remaining = profile.tripsToNextLevel ?? null;
  const progress = target && target > 0 ? Math.min(1, completed / target) : null;

  return (
    <Screen scroll bottomInset>
      <Card>
        <View style={styles.hero}>
          <ProfileAvatar
            avatarUrl={profile.photoUrl}
            frameUrl={profile.profileFrameUrl}
            size={104}
            fallback={profile.name}
            accessibilityLabel={t.levelsTitle}
          />
          <AppText variant="caption" tone="secondary">
            {t.currentLevel}
          </AppText>
          <AppText variant="headline">
            {current ? (LEVEL_LABELS[current] ?? current) : t.noLevelYet}
          </AppText>
          <AppText variant="caption" tone="muted">
            {`${t.completedLabel}: ${completed}`}
          </AppText>
        </View>
      </Card>

      {profile.nextLevel && progress !== null ? (
        <Card>
          <View style={styles.rowBetween}>
            <AppText variant="subtitle">{t.nextLevel}</AppText>
            <AppText variant="label" tone="brand">
              {LEVEL_LABELS[profile.nextLevel] ?? profile.nextLevel}
            </AppText>
          </View>
          <ProgressBar value={progress} tone="brand" height={10} />
          <View style={styles.rowBetween}>
            <AppText variant="caption" tone="secondary">
              {remaining !== null ? `${remaining} ${t.remainingTrips}` : " "}
            </AppText>
            <AppText variant="caption" tone="muted">
              {target !== null ? `${completed} / ${target}` : " "}
            </AppText>
          </View>
        </Card>
      ) : (
        <Card tone="sunken">
          <AppText tone="secondary">{t.atTop}</AppText>
        </Card>
      )}

      <Card padded={false}>
        {KNOWN_LEVELS.map((level) => (
          <ListRow
            key={level}
            icon={level === current ? "medal" : "trophy"}
            title={LEVEL_LABELS[level] ?? level}
            trailing={
              level === current ? (
                <Badge label={t.reached} tone="brand" />
              ) : undefined
            }
          />
        ))}
      </Card>

      {/* Benefits and other thresholds: declared missing, not invented. */}
      {benefits.available ? null : (
        <Card tone="sunken">
          <View style={styles.rowBetween}>
            <AppText variant="subtitle">{t.allLevels}</AppText>
            <Badge label={rewardsStrings.gapBadge} tone="warning" icon="info" />
          </View>
          <AppText tone="secondary">{t.thresholdsGap}</AppText>
          <AppText variant="caption" tone="muted">
            {benefits.reason}
          </AppText>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
  },
  hero: { alignItems: "center", gap: spacing.xs },
  rowBetween: {
    ...rtlRow,
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
});
