import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuthStore } from "../../auth/auth.store";
import { useDriverProfile } from "../../hooks/useDriverProfile";
import { strings } from "../../i18n/strings";
import type { OnboardingStackParamList } from "../../navigation/types";
import { useDriverStore } from "../../stores/driver.store";
import { alpha, MOTION, RADIUS, SPACING, typo } from "../../theme/tokens";
import { useTokens, type Tokens } from "../../theme/useTokens";
import {
  missingRequiredDocuments,
  type DriverProfile,
  type DriverStatus,
} from "../../types/driver";
import { HEADER_HEIGHT, PillButton, StickyHeader } from "../../ui";

type Navigation = NativeStackNavigationProp<OnboardingStackParamList>;

/** Stitch draws the illustration plate at `w-64 h-64` and its rows at 40px. */
const PLATE = 240;
const ROW_ICON = 40;
const PLATE_GLYPH = 96;

/**
 * How strong the state-circle washes are.
 *
 * The reference's 20% works on a dark surface. On #fbeaec a 20% emerald is
 * almost invisible, which collapses the difference between a cleared row and a
 * pending one - the single most important distinction on this screen.
 */
const WASH = { dark: 0.2, light: 0.16 } as const;
const PLATE_GLOW = { dark: 0.1, light: 0.08 } as const;

type RowState = "done" | "progress";

type ChecklistRow = {
  key: string;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  state: RowState;
};

/**
 * Stitch `application_under_review`, shown whenever the account is not APPROVED.
 *
 * This is a hard gate on driving, not on the app: the server returns 403 for
 * POST /driver/me/availability unless the status is APPROVED, so an ONLINE
 * button here could only produce a failure the driver cannot fix. What the
 * driver CAN do is finish the file being reviewed, so this screen leads to the
 * profile, the documents and the vehicle, and states exactly what is missing.
 *
 * The profile comes from the shared query, so opening this screen costs no extra
 * request and the status updates as soon as an operator approves the account.
 *
 * REBUILT ON THE REFERENCE, not restyled: the previous version was a stack of
 * five buttons. Stitch specifies a haloed hourglass plate, a rounded-24 status
 * card whose rows carry a 40px state circle (emerald check for cleared, pulsing
 * pink for in-progress), and the actions demoted below it.
 *
 * The reference marks Profile and Vehicle "Verified" and Documents "In
 * Progress" as static copy. Here every row's state is DERIVED from the server
 * profile, so the card cannot claim a document is being reviewed when the
 * driver has not uploaded it yet.
 *
 * NOT REPRODUCED: the illustration image inside the plate, which the reference
 * serves from a Google export URL. The filled hourglass glyph carries the same
 * meaning without a link that will rot.
 */
export function PendingApprovalScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const signOut = useAuthStore((state) => state.signOut);
  const query = useDriverProfile();
  const cachedProfile = useDriverStore((state) => state.profile);
  const tokens = useTokens();
  const styles = useMemo(() => makeStyles(tokens), [tokens]);

  const profile = query.data ?? cachedProfile;
  const status = profile?.status ?? null;
  const copy = messageFor(status);
  const rows = checklistRows(profile);

  // `animate-pulse` on the in-progress row circle.
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: MOTION.pulse,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: MOTION.pulse,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const pulseStyle = {
    opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.45] }),
  };

  return (
    <View style={styles.root}>
      <StickyHeader />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + HEADER_HEIGHT + SPACING.xxl,
            paddingBottom: insets.bottom + SPACING.xxl,
          },
        ]}
      >
        {/* Haloed plate. The glow is a translucent circle, not a blur filter. */}
        <View style={styles.plateWrap}>
          <View style={styles.plateGlow} pointerEvents="none" />
          <View style={[styles.plate, tokens.shadowCard]}>
            <MaterialIcons
              name="hourglass-top"
              size={PLATE_GLYPH}
              color={tokens.colors.primary}
            />
          </View>
        </View>

        {/* Centre never mirrors, so these two are correct in both directions. */}
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.body}>{copy.body}</Text>

        <View style={[styles.card, tokens.shadowCard]}>
          {rows.map((row, index) => (
            <View key={row.key}>
              {index > 0 ? <View style={styles.divider} /> : null}
              <View style={styles.row}>
                <Animated.View
                  style={[
                    styles.rowIcon,
                    row.state === "done" ? styles.rowIconDone : styles.rowIconOn,
                    row.state === "progress" ? pulseStyle : null,
                  ]}
                >
                  <MaterialIcons
                    name={row.state === "done" ? "check-circle" : row.icon}
                    size={tokens.iconSize.lg}
                    color={
                      row.state === "done"
                        ? tokens.semantic.success
                        : tokens.colors.primary
                    }
                  />
                </Animated.View>
                <Text style={styles.rowLabel}>{row.label}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Ordered per the onboarding contract: profile, documents, vehicle. */}
        <View style={styles.actions}>
          <PillButton
            label={strings.approval.openProfile}
            onPress={() => navigation.navigate("Profile")}
          />
          <PillButton
            label={strings.approval.openDocuments}
            variant="secondary"
            onPress={() => navigation.navigate("Documents")}
          />
          <PillButton
            label={strings.profile.vehicleSection}
            variant="secondary"
            onPress={() => navigation.navigate("Vehicle")}
          />
          <PillButton
            label={strings.approval.checkAgain}
            variant="secondary"
            leadingIcon="refresh"
            loading={query.isFetching}
            onPress={() => void query.refetch()}
          />
          <PillButton
            label={strings.common.signOut}
            variant="secondary"
            onPress={() => void signOut()}
          />
        </View>
      </ScrollView>
    </View>
  );
}

/**
 * The three rows Stitch draws, each state DERIVED from server data.
 *
 * A document counts as outstanding when it was never sent, was rejected, or has
 * expired. A PENDING one is not outstanding: it is waiting for an operator, and
 * asking for it again would only create duplicates.
 */
function checklistRows(
  profile: DriverProfile | null | undefined,
): ChecklistRow[] {
  const vehicle = profile?.vehicle;
  const vehicleReady = Boolean(vehicle && vehicle.model && vehicle.plate);
  const documentsReady =
    Boolean(profile) &&
    missingRequiredDocuments(profile?.documents).length === 0;

  return [
    {
      key: "profile",
      label: strings.approval.openProfile,
      icon: "person",
      // The profile row clears as soon as the server has a driver record.
      state: profile ? "done" : "progress",
    },
    {
      key: "vehicle",
      label: strings.profile.vehicleSection,
      icon: "directions-car",
      state: vehicleReady ? "done" : "progress",
    },
    {
      key: "documents",
      label: strings.approval.checklistDocuments,
      icon: "description",
      state: documentsReady ? "done" : "progress",
    },
  ];
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

function makeStyles(t: Tokens) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: t.colors.background },
    content: {
      flexGrow: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: SPACING.container,
    },
    plateWrap: {
      width: PLATE,
      height: PLATE,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: SPACING.xl,
    },
    plateGlow: {
      position: "absolute",
      width: PLATE,
      height: PLATE,
      borderRadius: RADIUS.full,
      backgroundColor: alpha(t.colors.primary, PLATE_GLOW[t.mode]),
    },
    plate: {
      width: PLATE * 0.75,
      height: PLATE * 0.75,
      borderRadius: RADIUS.full,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: t.colors.surfaceContainer,
      borderWidth: 1,
      // surface-bright equals the background on light: no visible edge.
      borderColor: t.colors.outlineVariant,
    },
    title: {
      ...typo("headlineLgMobile"),
      color: t.colors.onSurface,
      textAlign: "center",
    },
    body: {
      ...typo("bodyMd"),
      color: t.colors.onSurfaceVariant,
      textAlign: "center",
      marginTop: SPACING.md,
      marginBottom: SPACING.xxl,
    },
    /** Stitch `bg-surface-container rounded-2xl p-6 border-surface-variant/30`. */
    card: {
      alignSelf: "stretch",
      borderRadius: RADIUS.card,
      backgroundColor: t.colors.surfaceContainer,
      borderWidth: 1,
      borderColor: alpha(t.colors.surfaceVariant, 0.3),
      padding: SPACING.xl,
    },
    // Plain "row": React Native mirrors it, so the state circle leads in Arabic.
    row: { flexDirection: "row", alignItems: "center", gap: SPACING.lg },
    rowIcon: {
      width: ROW_ICON,
      height: ROW_ICON,
      borderRadius: RADIUS.full,
      alignItems: "center",
      justifyContent: "center",
    },
    rowIconDone: {
      backgroundColor: alpha(t.semantic.success, WASH[t.mode]),
    },
    rowIconOn: { backgroundColor: alpha(t.colors.primary, WASH[t.mode]) },
    rowLabel: { ...typo("titleMd"), color: t.colors.onSurface, flexShrink: 1 },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: alpha(t.colors.surfaceVariant, 0.5),
      marginVertical: SPACING.lg,
    },
    actions: { alignSelf: "stretch", gap: SPACING.md, marginTop: SPACING.xxl },
  });
}
