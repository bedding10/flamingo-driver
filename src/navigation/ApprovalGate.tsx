import React, { useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { PrimaryButton } from "../components/PrimaryButton";
import { strings } from "../i18n/strings";
import { spacing, typography, usePalette, type Palette } from "../theme";
import { BootScreen } from "../screens/BootScreen";
import { ApprovedScreen } from "../screens/onboarding/ApprovedScreen";
import { OnboardingNavigator } from "./OnboardingNavigator";
import { useDriverProfile } from "../hooks/useDriverProfile";
import { useDriverStore } from "../stores/driver.store";

/**
 * Stands between a valid session and the working app.
 *
 * A signed-in driver is not necessarily an active driver: the driver record is
 * created on first login, so the very first session always lands on PENDING.
 * Everything behind this gate assumes APPROVED.
 *
 * A load failure falls back to the cached profile when there is one, because a
 * driver already approved yesterday should not be locked out by a dropped
 * request.
 */
export function ApprovalGate({ children }: { children: React.ReactNode }) {
  const query = useDriverProfile();
  const palette = usePalette();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const cachedProfile = useDriverStore((state) => state.profile);
  const profile = query.data ?? cachedProfile;

  /**
   * The status this device last persisted, captured once on mount.
   *
   * `driver.store` seeds itself from the on-disk cache, so before the query
   * resolves this is what the driver was the last time the app ran. That is
   * what makes "was pending, is now approved" detectable across a cold start -
   * the common case, since approval happens while the app is closed - without
   * adding a storage key that would then need clearing on sign-out.
   */
  const statusAtMount = useRef(cachedProfile?.status ?? null).current;
  const [celebrationSeen, setCelebrationSeen] = useState(false);

  if (!profile) {
    if (query.isLoading) return <BootScreen />;
    return (
      <View style={styles.root}>
        <Text style={styles.message}>{strings.approval.loadFailed}</Text>
        <PrimaryButton
          label={strings.common.retry}
          onPress={() => void query.refetch()}
          loading={query.isFetching}
          style={styles.action}
        />
      </View>
    );
  }

  if (profile.status !== "APPROVED") {
    // Not a dead end: the onboarding stack lets the driver complete the profile
    // and the documents while the account is under review.
    return <OnboardingNavigator />;
  }

  // A fresh install that is already APPROVED has no cached status, so it gets
  // no celebration. Deliberate: with nothing to compare against, the app cannot
  // tell a new approval from a reinstall, and congratulating a driver on
  // something that happened last month reads as broken.
  if (
    statusAtMount !== null &&
    statusAtMount !== "APPROVED" &&
    !celebrationSeen
  ) {
    return <ApprovedScreen onContinue={() => setCelebrationSeen(true)} />;
  }

  return <>{children}</>;
}

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: palette.background,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.xl,
    },
    message: {
      ...typography.body,
      color: palette.textSecondary,
      textAlign: "center",
      writingDirection: "rtl",
    },
    action: { marginTop: spacing.xl, alignSelf: "stretch" },
  });
