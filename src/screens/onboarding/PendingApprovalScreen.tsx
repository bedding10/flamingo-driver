import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { PrimaryButton } from "../../components/PrimaryButton";
import { StatusPill } from "../../components/StatusPill";
import { strings } from "../../i18n/strings";
import {
  radius,
  spacing,
  typography,
  usePalette,
  withAlpha,
  type Palette,
} from "../../theme";
import { useAuthStore } from "../../auth/auth.store";
import { useDriverProfile } from "../../hooks/useDriverProfile";
import { useDriverStore } from "../../stores/driver.store";
import {
  missingRequiredDocuments,
  type DriverProfile,
  type DriverStatus,
} from "../../types/driver";
import type { OnboardingStackParamList } from "../../navigation/types";

type Navigation = NativeStackNavigationProp<OnboardingStackParamList>;

/**
 * Shown whenever the account is not APPROVED.
 *
 * This is a hard gate on driving, not on the app: the server returns 403 for
 * POST /driver/me/availability unless the status is APPROVED, so an ONLINE button
 * here could only produce a failure the driver cannot fix. What the driver CAN do
 * is finish the file that is being reviewed, so this screen leads to the profile,
 * the documents and the vehicle, and states exactly what is still missing.
 *
 * The profile comes from the shared query, so opening this screen costs no extra
 * request and the status updates as soon as an operator approves the account.
 *
 * PHASE 1 (R-11): this screen had no `"row-reverse"` anywhere - it is a single
 * centred column - but four text styles carried a bare `writingDirection: "rtl"`
 * with no alignment beside it, which under real RTL only fought the inherited
 * direction. Removed. `title` and `body` keep `textAlign: "center"`, which is
 * correct in both directions because centre has no side to mirror.
 *
 * PHASE 2: migrated off the legacy flat `colors` bag onto the palette. The
 * status badge keeps its warning wash, but the wash is now derived from
 * `palette.warning`, which is the light or dark counterpart of Stitch's #F59E0B
 * rather than one fixed dark-mode value.
 *
 * PHASE 2: the destinations are ordered Profile -> Documents -> Vehicle, which
 * is the order sections 13 and 62 mandate. Vehicle is a separate button because
 * it is now a separate screen; before the split it was the second half of the
 * profile form, and a driver whose car was missing was sent to "complete your
 * profile".
 *
 * STILL OUTSTANDING (PHASE 2, visual rebuild): Stitch renders this as
 * application_under_review (screenshot 16) with a review timeline and a
 * document checklist card, and driver_approved_success (screenshot 21) as the
 * cleared state. This screen is still the PHASE 1 stacked-button layout.
 */
export function PendingApprovalScreen() {
  const insets = useSafeAreaInsets();
  const palette = usePalette();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const navigation = useNavigation<Navigation>();
  const signOut = useAuthStore((state) => state.signOut);
  const query = useDriverProfile();
  const cachedProfile = useDriverStore((state) => state.profile);

  const profile = query.data ?? cachedProfile;
  const status = profile?.status ?? null;
  const copy = messageFor(status);
  const checklist = missingItems(profile);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing["3xl"] },
        { paddingBottom: insets.bottom + spacing.xl },
      ]}
    >
      <Text style={styles.brand}>flaminGO</Text>

      <View style={styles.badge}>
        <Text style={styles.badgeLabel}>{strings.approval.statusLabel}</Text>
        <Text style={styles.badgeValue}>{status ?? "\u2014"}</Text>
      </View>

      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.body}>{copy.body}</Text>

      <View style={styles.checklist}>
        <Text style={styles.checklistTitle}>
          {checklist.length ? strings.approval.checklistTitle : ""}
        </Text>
        {checklist.length ? (
          checklist.map((item) => (
            <View key={item.key} style={styles.checklistRow}>
              <StatusPill label={item.label} tone="pending" />
            </View>
          ))
        ) : (
          <Text style={styles.body}>{strings.approval.checklistDone}</Text>
        )}
      </View>

      {/* Ordered per sections 13 and 62: profile, then documents, then the
          vehicle. */}
      <PrimaryButton
        label={strings.approval.openProfile}
        onPress={() => navigation.navigate("Profile")}
        style={styles.action}
      />
      <PrimaryButton
        label={strings.approval.openDocuments}
        onPress={() => navigation.navigate("Documents")}
        style={styles.secondaryAction}
      />
      <PrimaryButton
        label={strings.profile.vehicleSection}
        onPress={() => navigation.navigate("Vehicle")}
        style={styles.secondaryAction}
      />
      <PrimaryButton
        label={strings.approval.checkAgain}
        onPress={() => void query.refetch()}
        loading={query.isFetching}
        variant="outline"
        style={styles.secondaryAction}
      />
      <PrimaryButton
        label={strings.common.signOut}
        onPress={() => void signOut()}
        variant="outline"
        style={styles.secondaryAction}
      />
    </ScrollView>
  );
}

/**
 * What the driver still owes the review, derived only from server data.
 *
 * PHASE 1 narrowed this from "every document type exists" to the four the
 * server actually requires (REQUIRED_DRIVER_DOC_TYPES). The old check counted
 * optional slots too, so a complete file could still be reported as incomplete
 * and the driver had no way to clear the warning.
 *
 * A document counts as missing when it was never sent, was rejected, or has
 * expired. A PENDING one is not missing: it is waiting for an operator, and
 * asking for it again would only create duplicates.
 *
 * PHASE 2: a missing car is labelled with the vehicle section, not with
 * "complete your profile". The vehicle has its own screen now, so the old label
 * would have pointed the driver at the wrong one.
 */
function missingItems(profile: DriverProfile | null | undefined) {
  if (!profile) return [];
  const items: Array<{ key: string; label: string }> = [];

  const vehicle = profile.vehicle;
  if (!vehicle || !vehicle.model || !vehicle.plate) {
    items.push({ key: "vehicle", label: strings.profile.vehicleSection });
  }

  if (missingRequiredDocuments(profile.documents).length) {
    items.push({ key: "documents", label: strings.approval.checklistDocuments });
  }

  return items;
}

function messageFor(status: DriverStatus | null) {
  switch (status) {
    case "REJECTED":
      return {
        title: strings.approval.rejectedTitle,
        body: strings.approval.rejectedBody,
      };
    case "SUSPENDED":
      return {
        title: strings.approval.suspendedTitle,
        body: strings.approval.suspendedBody,
      };
    case "BANNED":
      return {
        title: strings.approval.bannedTitle,
        body: strings.approval.bannedBody,
      };
    default:
      // PENDING, and the null case while the profile is still unknown.
      return {
        title: strings.approval.pendingTitle,
        body: strings.approval.pendingBody,
      };
  }
}

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: palette.background },
    content: {
      flexGrow: 1,
      paddingHorizontal: spacing.xl,
      justifyContent: "center",
      alignItems: "center",
    },
    brand: {
      ...typography.display,
      color: palette.primaryText,
      marginBottom: spacing.xl,
    },
    badge: {
      alignItems: "center",
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      borderRadius: radius.pill,
      backgroundColor: withAlpha(palette.warning, 0.14),
      borderWidth: 1,
      borderColor: withAlpha(palette.warning, 0.5),
      marginBottom: spacing.xl,
    },
    badgeLabel: {
      ...typography.caption,
      color: palette.textSecondary,
    },
    badgeValue: {
      ...typography.label,
      color: palette.warning,
      letterSpacing: 1,
      marginTop: 2,
    },
    // Centre does not mirror, so these two are correct in both directions.
    title: {
      ...typography.title,
      color: palette.textPrimary,
      textAlign: "center",
    },
    body: {
      ...typography.body,
      color: palette.textSecondary,
      textAlign: "center",
      marginTop: spacing.md,
    },
    checklist: {
      alignSelf: "stretch",
      alignItems: "center",
      marginTop: spacing.lg,
    },
    checklistTitle: {
      ...typography.caption,
      color: palette.textSecondary,
    },
    checklistRow: { marginTop: spacing.sm },
    action: { marginTop: spacing["3xl"], alignSelf: "stretch" },
    secondaryAction: { marginTop: spacing.md, alignSelf: "stretch" },
  });
