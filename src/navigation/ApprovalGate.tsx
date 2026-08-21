import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { PrimaryButton } from "../components/PrimaryButton";
import { strings } from "../i18n/strings";
import { spacing, typography, usePalette, type Palette } from "../theme";
import { BootScreen } from "../screens/BootScreen";
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
 *
 * PHASE 1 (Stitch): this file was one of two still painting `colors.ink`
 * directly, so its failure state stayed dark in light mode. It now reads the
 * palette like every other screen.
 *
 * PHASE 2 (R-11 residual): the PHASE 1 direction audit was scoped to
 * `src/components/` and `src/screens/`. This file renders UI but lives under
 * `src/navigation/`, so it was never checked - and `message` carried a bare
 * `writingDirection: "rtl"` beside `textAlign: "center"`. Centre has no side to
 * mirror, so that override bought nothing in Arabic while fighting the
 * inherited direction in French and English. Removed.
 */
export function ApprovalGate({ children }: { children: React.ReactNode }) {
  const query = useDriverProfile();
  const palette = usePalette();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const cachedProfile = useDriverStore((state) => state.profile);
  const profile = query.data ?? cachedProfile;

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
    // Centre is correct in every direction; it has no side to mirror.
    message: {
      ...typography.body,
      color: palette.textSecondary,
      textAlign: "center",
    },
    action: { marginTop: spacing.xl, alignSelf: "stretch" },
  });
