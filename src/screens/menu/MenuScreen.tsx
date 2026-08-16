import React, { useCallback } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { PrimaryButton } from "../../components/PrimaryButton";
import { ProfileAvatar } from "../../components/ProfileAvatar";
import { BrandMark } from "../../components/BrandMark";
import { useDriverProfile } from "../../hooks/useDriverProfile";
import { useUnreadNotificationCount } from "../../hooks/useNotifications";
import { useAuthStore } from "../../auth/auth.store";
import { menuStrings } from "../../i18n/strings.menu";
import { strings } from "../../i18n/strings";
import type { DriverStackParamList } from "../../navigation/types";
import {
  colors,
  radius,
  spacing,
  touchTarget,
  typography,
  withAlpha,
} from "../../theme";

/** Display labels only. Levels themselves are decided by the backend. */
const LEVEL_LABELS: Record<string, string> = {
  BRONZE: strings.level.bronze,
  SILVER: strings.level.silver,
  GOLD: strings.level.gold,
  DIAMOND: strings.level.diamond,
  LEGENDARY: strings.level.legendary,
};

/**
 * PHASE 5 - the driver's menu. PHASE 7 - rebuilt around a profile card.
 *
 * It is still a router and owns no server state of its own; what changed is
 * that the driver now sees WHO they are before the list of destinations: the
 * avatar with the level frame the backend awarded, the level, the rating and
 * the completed-trip count that produced it.
 *
 * Two honest omissions:
 *  - rating COUNT: GET /driver/me returns `rating` and `totalTrips` but no
 *    number of ratings. Printing totalTrips next to the stars would imply every
 *    trip was rated, which is false, so the count is not shown and the note
 *    says why. Adding it is a backend change, not a UI one.
 *  - VEHICLE is not a separate screen: /vehicles is staff-only on the server
 *    and the driver edits their car inside the profile form, so this row leads
 *    there rather than to a screen that could not save anything.
 */
export function MenuScreen() {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<DriverStackParamList>>();
  const { data: profile } = useDriverProfile();
  const unread = useUnreadNotificationCount();
  const signOut = useAuthStore((state) => state.signOut);

  const vehicle = profile?.vehicle;
  const vehicleLine = vehicle?.plate
    ? [vehicle.make, vehicle.model].filter(Boolean).join(" ") +
      " \u00b7 " +
      vehicle.plate
    : menuStrings.vehicleMissing;

  const confirmSignOut = useCallback(() => {
    Alert.alert(menuStrings.signOutTitle, menuStrings.signOutBody, [
      { text: menuStrings.cancel, style: "cancel" },
      {
        text: menuStrings.confirm,
        style: "destructive",
        onPress: () => void signOut(),
      },
    ]);
  }, [signOut]);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + spacing["3xl"] },
      ]}
    >
      {/* Profile card. */}
      <View style={styles.header}>
        <View style={styles.identity}>
          <ProfileAvatar
            avatarUrl={profile?.photoUrl}
            frameUrl={profile?.profileFrameUrl}
            size={88}
            fallback={profile?.name}
            accessibilityLabel={profile?.name ?? strings.profile.title}
          />
          <View style={styles.identityText}>
            <Text style={styles.name} numberOfLines={1}>
              {profile?.name || strings.profile.title}
            </Text>
            {profile?.profileLevel ? (
              <View style={styles.levelPill}>
                <Text style={styles.levelText}>
                  {LEVEL_LABELS[profile.profileLevel] ?? profile.profileLevel}
                </Text>
              </View>
            ) : null}
            <Text style={styles.phone} numberOfLines={1}>
              {profile?.phone ?? "\u2014"}
            </Text>
            <Text style={styles.vehicle} numberOfLines={1}>
              {vehicleLine}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <Stat
            label={menuStrings.ratingLabel}
            value={profile ? profile.rating.toFixed(1) : "\u2014"}
          />
          <Stat
            label={menuStrings.tripsLabel}
            value={
              profile
                ? String(profile.completedTripsCount ?? profile.totalTrips)
                : "\u2014"
            }
          />
          <Stat
            label={menuStrings.totalTripsLabel}
            value={profile ? String(profile.totalTrips) : "\u2014"}
          />
        </View>
        <Text style={styles.note}>{menuStrings.ratingCountNote}</Text>
      </View>

      <SectionLabel text={menuStrings.sectionAccount} />
      <MenuRow
        label={menuStrings.account}
        hint={menuStrings.accountHint}
        onPress={() => navigation.navigate("Profile")}
      />
      <MenuRow
        label={menuStrings.documents}
        hint={menuStrings.documentsHint}
        onPress={() => navigation.navigate("Documents")}
      />

      <SectionLabel text={menuStrings.sectionMoney} />
      <MenuRow
        label={menuStrings.wallet}
        hint={menuStrings.walletHint}
        onPress={() => navigation.navigate("Wallet")}
      />

      <SectionLabel text={menuStrings.sectionWork} />
      <MenuRow
        label={menuStrings.requests}
        hint={menuStrings.requestsHint}
        onPress={() => navigation.navigate("Requests")}
      />

      <SectionLabel text={menuStrings.sectionVehicle} />
      <MenuRow
        label={menuStrings.vehicle}
        hint={menuStrings.vehicleHint}
        onPress={() => navigation.navigate("Profile")}
      />

      <SectionLabel text={menuStrings.sectionSupport} />
      <MenuRow
        label={menuStrings.notifications}
        hint={menuStrings.notificationsHint}
        badge={unread}
        onPress={() => navigation.navigate("Notifications")}
      />
      <MenuRow
        label={menuStrings.support}
        hint={menuStrings.supportHint}
        onPress={() => navigation.navigate("Support")}
      />
      <MenuRow
        label={menuStrings.safety}
        hint={menuStrings.safetyHint}
        onPress={() => navigation.navigate("Safety")}
      />

      <SectionLabel text={menuStrings.sectionLegal} />
      <MenuRow
        label={menuStrings.legal}
        hint={menuStrings.legalHint}
        onPress={() => navigation.navigate("Legal")}
      />

      <PrimaryButton
        label={menuStrings.signOut}
        variant="outline"
        onPress={confirmSignOut}
        style={styles.signOut}
      />

      <BrandMark compact style={styles.brand} />
    </ScrollView>
  );
}

function SectionLabel({ text }: { text: string }) {
  return <Text style={styles.section}>{text}</Text>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MenuRow({
  label,
  hint,
  badge = 0,
  onPress,
}: {
  label: string;
  hint: string;
  badge?: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
    >
      <View style={styles.rowHead}>
        <Text style={styles.rowLabel}>{label}</Text>
        {badge > 0 ? (
          <View style={styles.rowBadge}>
            <Text style={styles.rowBadgeText}>
              {badge > 99 ? "99+" : String(badge)}
            </Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.rowHint}>{hint}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  content: { padding: spacing.xl, gap: spacing.sm },
  header: {
    backgroundColor: colors.surfaceDark,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: spacing.lg,
    gap: spacing.md,
  },
  identity: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: spacing.lg,
  },
  identityText: { flex: 1, gap: 2 },
  name: {
    ...typography.title,
    color: colors.textOnDark,
    textAlign: "right",
    writingDirection: "rtl",
  },
  levelPill: {
    alignSelf: "flex-end",
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: withAlpha(colors.gold, 0.14),
    borderWidth: 1,
    borderColor: withAlpha(colors.gold, 0.4),
  },
  levelText: { ...typography.caption, color: colors.gold },
  phone: {
    ...typography.caption,
    color: colors.textOnDarkSecondary,
    textAlign: "left",
    writingDirection: "ltr",
  },
  vehicle: {
    ...typography.caption,
    color: colors.textOnDarkSecondary,
    textAlign: "right",
    writingDirection: "rtl",
  },
  statsRow: { flexDirection: "row-reverse", gap: spacing.sm },
  stat: {
    flex: 1,
    backgroundColor: withAlpha(colors.offWhite, 0.06),
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  statValue: { ...typography.numeric, fontSize: 22, color: colors.gold },
  statLabel: {
    ...typography.caption,
    color: colors.textOnDarkSecondary,
    marginTop: spacing.xs,
    textAlign: "center",
    writingDirection: "rtl",
  },
  note: {
    ...typography.caption,
    color: colors.textOnDarkSecondary,
    textAlign: "right",
    writingDirection: "rtl",
  },
  section: {
    ...typography.label,
    color: colors.gold,
    textAlign: "right",
    writingDirection: "rtl",
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  row: {
    minHeight: touchTarget.normal,
    justifyContent: "center",
    backgroundColor: colors.surfaceDark,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: 2,
  },
  rowPressed: { backgroundColor: colors.pressed },
  rowHead: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  rowLabel: {
    ...typography.subtitle,
    color: colors.textOnDark,
    flex: 1,
    textAlign: "right",
    writingDirection: "rtl",
  },
  rowBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  rowBadgeText: { ...typography.caption, color: colors.ink },
  rowHint: {
    ...typography.caption,
    color: colors.textOnDarkSecondary,
    textAlign: "right",
    writingDirection: "rtl",
  },
  signOut: { marginTop: spacing.xl },
  brand: { alignSelf: "center", marginTop: spacing.lg },
});
