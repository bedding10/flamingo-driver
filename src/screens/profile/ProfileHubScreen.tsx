import React from "react";
import { ActivityIndicator, RefreshControl, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ProfileAvatar } from "../../components/ProfileAvatar";
import { useDriverProfile } from "../../hooks/useDriverProfile";
import { missingRequiredDocuments } from "../../types/driver";
import { DOC_LABELS } from "../../i18n/strings.phase1";
import { LEVEL_LABELS, hubStrings as t } from "../../i18n/strings.profile.hub";
import { strings } from "../../i18n/strings";
import type { DriverStackParamList } from "../../navigation/types";
import {
  AppText,
  Badge,
  Button,
  Card,
  ListRow,
  ProgressBar,
  Screen,
  StatTile,
  rtlRow,
} from "../../ui";
import { spacing } from "../../theme";

/**
 * Reference: `driver_profile_hub.html`.
 *
 * The hub the reference draws: avatar with tier frame, rating, trip counts,
 * progression to the next tier, and the entries into the rest of the account.
 * Every one of those numbers exists on GET /driver/me, so nothing here is
 * decorative.
 *
 * Two deliberate refusals:
 *  - the reference prints "(128 ratings)" under the stars. The server sends
 *    `rating` with no count. Printing `totalTrips` there would claim every trip
 *    was rated, so the count is absent and the screen says why.
 *  - the reference has an "edit" pencil on the avatar. Uploading a profile
 *    photo is the documents flow (PROFILE_PHOTO), so this links there instead
 *    of implying a second upload path that does not exist.
 */
export function ProfileHubScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<DriverStackParamList>>();
  const { data: profile, isLoading, isError, refetch, isRefetching } =
    useDriverProfile();

  if (isLoading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      </Screen>
    );
  }

  if (isError || !profile) {
    return (
      <Screen>
        <View style={styles.center}>
          <AppText tone="secondary" align="center">
            {t.loadError}
          </AppText>
          <Button
            label={t.retry}
            variant="secondary"
            size="md"
            onPress={() => {
              void refetch();
            }}
          />
        </View>
      </Screen>
    );
  }

  const completed = profile.completedTripsCount ?? profile.totalTrips;
  const target = profile.nextLevelAt ?? null;
  const remaining = profile.tripsToNextLevel ?? null;
  const progress =
    target && target > 0 ? Math.min(1, completed / target) : null;

  const missing = missingRequiredDocuments(profile.documents);
  const vehicleLine = profile.vehicle?.plate
    ? [profile.vehicle.make, profile.vehicle.model]
        .filter(Boolean)
        .join(" ") + " \u00b7 " + profile.vehicle.plate
    : t.vehicleRowHint;

  return (
    <Screen
      scroll
      bottomInset
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => {
            void refetch();
          }}
        />
      }
    >
      <Card>
        <View style={styles.hero}>
          <ProfileAvatar
            avatarUrl={profile.photoUrl}
            frameUrl={profile.profileFrameUrl}
            size={96}
            fallback={profile.name}
            accessibilityLabel={profile.name ?? t.hubTitle}
          />
          <AppText variant="title" align="center" numberOfLines={1}>
            {profile.name || strings.profile.title}
          </AppText>
          {profile.profileLevel ? (
            <Badge
              label={LEVEL_LABELS[profile.profileLevel] ?? profile.profileLevel}
              tone="brand"
              icon="medal"
            />
          ) : null}
          <AppText variant="caption" tone="secondary" align="center">
            {`${t.cityLabel}: ${profile.city ?? t.cityMissing}`}
          </AppText>
        </View>
      </Card>

      <View style={styles.tiles}>
        <StatTile
          label={t.ratingLabel}
          value={profile.rating.toFixed(1)}
          icon="star"
          caption={t.ratingCaption}
        />
        <StatTile
          label={t.completedLabel}
          value={String(completed)}
          icon="check"
          caption={`${t.totalLabel}: ${profile.totalTrips}`}
        />
      </View>

      {/* The rating average without its sample size, stated as such. */}
      <AppText variant="caption" tone="muted">
        {t.ratingCountGap}
      </AppText>

      {/* Progression: shown only when the server actually sent a next tier. */}
      {profile.nextLevel && progress !== null ? (
        <Card onPress={() => navigation.navigate("Levels")}>
          <View style={styles.rowBetween}>
            <AppText variant="subtitle">{t.nextLevel}</AppText>
            <AppText variant="label" tone="brand">
              {LEVEL_LABELS[profile.nextLevel] ?? profile.nextLevel}
            </AppText>
          </View>
          <ProgressBar value={progress} tone="brand" />
          {remaining !== null ? (
            <AppText variant="caption" tone="secondary">
              {`${remaining} ${t.remainingTrips}`}
            </AppText>
          ) : null}
        </Card>
      ) : null}

      <Card padded={false}>
        <ListRow
          icon="user"
          title={t.editProfile}
          subtitle={t.editProfileHint}
          onPress={() => navigation.navigate("Profile")}
          showChevron
        />
        <ListRow
          icon="car"
          title={t.vehicleRow}
          subtitle={vehicleLine}
          onPress={() => navigation.navigate("Vehicle")}
          showChevron
        />
        <ListRow
          icon="document"
          title={t.documents}
          subtitle={
            missing.length
              ? `${t.documentsMissing}: ${missing
                  .map((type) => DOC_LABELS[type])
                  .join(" \u060c ")}`
              : t.documentsOk
          }
          trailing={
            missing.length ? (
              <Badge label={String(missing.length)} tone="warning" />
            ) : (
              <Badge label="✓" tone="success" />
            )
          }
          onPress={() => navigation.navigate("Documents")}
        />
        <ListRow
          icon="trending"
          title={t.earningsRow}
          subtitle={t.earningsRowHint}
          onPress={() => navigation.navigate("Earnings")}
          showChevron
        />
        <ListRow
          icon="medal"
          title={t.levelRow}
          subtitle={t.levelRowHint}
          onPress={() => navigation.navigate("Levels")}
          showChevron
        />
      </Card>
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
  hero: { alignItems: "center", gap: spacing.sm },
  tiles: { ...rtlRow, gap: spacing.md },
  rowBetween: {
    ...rtlRow,
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
});
