import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { PrimaryButton } from "../components/PrimaryButton";
import { strings } from "../i18n/strings";
import { colors, spacing, typography } from "../theme";
import { BootScreen } from "../screens/BootScreen";
import { OnboardingNavigator } from "./OnboardingNavigator";
import { useDriverProfile } from "../hooks/useDriverProfile";
import { useDriverStore } from "../stores/driver.store";

/**
 * Stands between a valid session and the working app.
 *
 * A signed-in driver is not necessarily an active driver: POST /auth/firebase
 * creates the driver record on first login, so the very first session always
 * lands on PENDING. Everything behind this gate assumes APPROVED.
 *
 * A load failure falls back to the cached profile when there is one, because a
 * driver already approved yesterday should not be locked out by a dropped
 * request.
 */
export function ApprovalGate({ children }: { children: React.ReactNode }) {
  const query = useDriverProfile();
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  message: {
    ...typography.body,
    color: colors.textOnDarkSecondary,
    textAlign: "center",
    writingDirection: "rtl",
  },
  action: { marginTop: spacing.xl, alignSelf: "stretch" },
});
