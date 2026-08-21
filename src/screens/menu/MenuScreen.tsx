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
import { ProfileAvatar } from "../../components/ProfileAvatar";
import { BrandMark } from "../../components/BrandMark";
import { Icon, type IconName } from "../../components/Icon";
import { useDriverProfile } from "../../hooks/useDriverProfile";
import { useUnreadNotificationCount } from "../../hooks/useNotifications";
import { useAuthStore } from "../../auth/auth.store";
import { textAlignStart } from "../../i18n";
import { menuStrings } from "../../i18n/strings.menu";
import { menu75Strings } from "../../i18n/strings.phase75";
import { strings } from "../../i18n/strings";
import type { DriverStackParamList } from "../../navigation/types";
import {
  radius,
  shadows,
  spacing,
  typography,
  useTheme,
  usePalette,
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
 * PHASE 7.5 - the menu, rebuilt from scratch.
 *
 * What it was: every destination rendered as a full-width card with a title and
 * a two-line description, one after another, each the same weight as the one
 * above it. Twelve equal boxes is not a hierarchy - it reads like an admin
 * dashboard, and that is exactly what this replaces.
 *
 * What it is now: one profile hero at the top, then quiet section titles over
 * compact 56pt list rows grouped in rounded cards - the consumer-app pattern.
 * Each row is an icon, a title, a one-line subtitle and a forward chevron.
 * Sign-out is a row too, in red, not a button bolted to the bottom.
 *
 * Honest omissions, unchanged because they are backend facts, not design
 * choices:
 *  - rating COUNT: GET /driver/me returns `rating` and `totalTrips` with no
 *    number of ratings. Printing totalTrips next to the stars would claim every
 *    trip was rated, which is false. The stat is simply absent until the
 *    backend sends it (registered as a PHASE 8 backend requirement).
 *  - VEHICLE: /vehicles is STAFF-only on the server, so the car is edited
 *    through the car* fields on PATCH /driver/me rather than through a vehicle
 *    endpoint this app is allowed to call. That constraint has not changed.
 *    PHASE 2: what HAS changed is where the row leads. It used to point at
 *    Profile, because the vehicle fields were the second half of the profile
 *    form. They are their own screen now, so it points at Vehicle - and if this
 *    row had been left pointing at Profile, tapping "my vehicle" would have
 *    landed on a screen with no vehicle fields on it.
 *
 * PHASE 1 (R-11): `heroStats`, `heroStat` and the list `row` were all
 * `"row-reverse"`, and six text styles were pinned right. Every destination in
 * the app renders through that one `row`, so it was the single highest-leverage
 * fix on this screen.
 */
export function MenuScreen() {
  const insets = useSafeAreaInsets();
  const palette = usePalette();
  const { mode, toggleMode } = useTheme();
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
    : menu75Strings.vehicleMissing;

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
      style={{ flex: 1, backgroundColor: palette.background }}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + spacing.lg,
          paddingBottom: insets.bottom + spacing["3xl"],
        },
      ]}
    >
      {/* ---- profile hero -------------------------------------------------- */}
      <View
        style={[
          styles.hero,
          { backgroundColor: palette.surface, borderColor: palette.border },
        ]}
      >
        <ProfileAvatar
          avatarUrl={profile?.photoUrl}
          frameUrl={profile?.profileFrameUrl}
          size={92}
          fallback={profile?.name}
          accessibilityLabel={profile?.name ?? strings.profile.title}
        />

        <Text
          style={[styles.name, { color: palette.textPrimary }]}
          numberOfLines={1}
        >
          {profile?.name || strings.profile.title}
        </Text>

        {profile?.profileLevel ? (
          <View
            style={[
              styles.levelPill,
              {
                backgroundColor: palette.primaryWash,
                borderColor: palette.primary,
              },
            ]}
          >
            <Text style={[styles.levelText, { color: palette.primaryText }]}>
              {LEVEL_LABELS[profile.profileLevel] ?? profile.profileLevel}
            </Text>
          </View>
        ) : null}

        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Icon name="star" size={15} color={palette.primaryText} />
            <Text style={[styles.heroStatValue, { color: palette.textPrimary }]}>
              {profile ? profile.rating.toFixed(1) : "\u2014"}
            </Text>
          </View>
          <View
            style={[styles.heroDivider, { backgroundColor: palette.border }]}
          />
          <Text style={[styles.heroStatText, { color: palette.textSecondary }]}>
            {(profile
              ? String(profile.completedTripsCount ?? profile.totalTrips)
              : "\u2014") +
              " " +
              menu75Strings.completedLabel}
          </Text>
          <View
            style={[styles.heroDivider, { backgroundColor: palette.border }]}
          />
          <Text style={[styles.heroStatText, { color: palette.textSecondary }]}>
            {(profile ? String(profile.totalTrips) : "\u2014") +
              " " +
              menu75Strings.totalLabel}
          </Text>
        </View>

        <Text
          style={[styles.heroVehicle, { color: palette.textSecondary }]}
          numberOfLines={1}
        >
          {vehicleLine}
        </Text>
      </View>

      {/* ---- account ------------------------------------------------------- */}
      <Section title={menu75Strings.sectionAccount}>
        <Row
          icon="user"
          label={menu75Strings.profile}
          hint={menu75Strings.profileHint}
          onPress={() => navigation.navigate("Profile")}
        />
        <Row
          icon="document"
          label={menu75Strings.documents}
          hint={menu75Strings.documentsHint}
          last
          onPress={() => navigation.navigate("Documents")}
        />
      </Section>

      {/* ---- money --------------------------------------------------------- */}
      <Section title={menu75Strings.sectionMoney}>
        <Row
          icon="wallet"
          label={menu75Strings.wallet}
          hint={menu75Strings.walletHint}
          last
          onPress={() => navigation.navigate("Wallet")}
        />
      </Section>

      {/* ---- work ---------------------------------------------------------- */}
      <Section title={menu75Strings.sectionWork}>
        <Row
          icon="requests"
          label={menu75Strings.requests}
          hint={menu75Strings.requestsHint}
          last
          onPress={() => navigation.navigate("Requests")}
        />
      </Section>

      {/* ---- vehicle ------------------------------------------------------- */}
      <Section title={menu75Strings.sectionVehicle}>
        <Row
          icon="car"
          label={menu75Strings.vehicle}
          hint={menu75Strings.vehicleHint}
          last
          onPress={() => navigation.navigate("Vehicle")}
        />
      </Section>

      {/* ---- support and safety -------------------------------------------- */}
      <Section title={menu75Strings.sectionSupport}>
        <Row
          icon="bell"
          label={menu75Strings.notifications}
          hint={menu75Strings.notificationsHint}
          badge={unread}
          onPress={() => navigation.navigate("Notifications")}
        />
        <Row
          icon="support"
          label={menu75Strings.support}
          hint={menu75Strings.supportHint}
          onPress={() => navigation.navigate("Support")}
        />
        <Row
          icon="shield"
          label={menu75Strings.safety}
          hint={menu75Strings.safetyHint}
          last
          onPress={() => navigation.navigate("Safety")}
        />
      </Section>

      {/* ---- other --------------------------------------------------------- */}
      <Section title={menu75Strings.sectionOther}>
        <Row
          icon="legal"
          label={menu75Strings.legal}
          hint={menu75Strings.legalHint}
          onPress={() => navigation.navigate("Legal")}
        />
        <Row
          icon={mode === "dark" ? "moon" : "sun"}
          label={menu75Strings.appearance}
          hint={
            mode === "dark"
              ? menu75Strings.appearanceDark
              : menu75Strings.appearanceLight
          }
          last
          onPress={toggleMode}
        />
      </Section>

      <Section>
        <Row
          icon="logout"
          label={menu75Strings.signOut}
          hint={menu75Strings.signOutHint}
          tone="danger"
          last
          onPress={confirmSignOut}
        />
      </Section>

      <BrandMark compact style={styles.brand} />
    </ScrollView>
  );
}

/**
 * A titled group of rows inside one rounded card. Grouping is what creates the
 * hierarchy: the card is the object, the rows are its contents.
 */
function Section({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  const palette = usePalette();
  return (
    <View style={styles.section}>
      {title ? (
        <Text style={[styles.sectionTitle, { color: palette.textSecondary }]}>
          {title}
        </Text>
      ) : null}
      <View
        style={[
          styles.group,
          { backgroundColor: palette.surface, borderColor: palette.border },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

function Row({
  icon,
  label,
  hint,
  badge = 0,
  tone = "default",
  last = false,
  onPress,
}: {
  icon: IconName;
  label: string;
  hint: string;
  badge?: number;
  tone?: "default" | "danger";
  /** Suppresses the hairline under the last row of a group. */
  last?: boolean;
  onPress: () => void;
}) {
  const palette = usePalette();
  const danger = tone === "danger";
  const iconColor = danger ? palette.danger : palette.primaryText;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !last ? { borderBottomWidth: StyleSheet.hairlineWidth } : null,
        { borderBottomColor: palette.border },
        pressed ? { backgroundColor: palette.pressed } : null,
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: danger
              ? palette.surfaceSunken
              : palette.primaryWash,
          },
        ]}
      >
        <Icon name={icon} size={20} color={iconColor} />
      </View>

      <View style={styles.rowText}>
        <Text
          style={[
            styles.rowLabel,
            { color: danger ? palette.danger : palette.textPrimary },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
        <Text
          style={[styles.rowHint, { color: palette.textSecondary }]}
          numberOfLines={1}
        >
          {hint}
        </Text>
      </View>

      {badge > 0 ? (
        <View style={[styles.badge, { backgroundColor: palette.primary }]}>
          <Text style={[styles.badgeText, { color: palette.onPrimary }]}>
            {badge > 99 ? "99+" : String(badge)}
          </Text>
        </View>
      ) : null}

      {/*
        Forward affordance. `chevron` is one of the three mirrored names in
        Icon.tsx, so the glyph is LTR-canonical and React Native flips it: it
        points left in Arabic and right in French and English. The comment that
        used to sit here asserted a fixed leftward direction, which stopped
        being true once the icon started mirroring.
      */}
      <Icon name="chevron" size={18} color={palette.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, gap: spacing.lg },

  hero: {
    borderRadius: radius.card,
    borderWidth: 1,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    gap: spacing.sm,
    ...shadows.soft,
  },
  // Centred hero text: centre has no side to mirror.
  name: { ...typography.title, textAlign: "center" },
  levelPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  levelText: { ...typography.caption, fontWeight: "700" },
  // Plain "row": mirrored by React Native under RTL.
  heroStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  heroStat: { flexDirection: "row", alignItems: "center", gap: 4 },
  heroStatValue: { ...typography.label, fontWeight: "700" },
  heroStatText: { ...typography.caption },
  heroDivider: { width: 1, height: 12 },
  heroVehicle: {
    ...typography.caption,
    textAlign: "center",
  },

  section: { gap: spacing.sm },
  sectionTitle: {
    ...typography.caption,
    fontWeight: "700",
    textAlign: textAlignStart(),
    paddingHorizontal: spacing.xs,
  },
  group: {
    borderRadius: radius.card,
    borderWidth: 1,
    overflow: "hidden",
  },

  /**
   * Every destination in the app renders through this one row, so this single
   * flexDirection decided whether the whole menu read correctly. Plain "row".
   */
  row: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: { flex: 1, gap: 1 },
  rowLabel: {
    ...typography.subtitle,
    textAlign: textAlignStart(),
  },
  rowHint: { ...typography.caption, textAlign: textAlignStart() },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { ...typography.caption, fontWeight: "700" },

  brand: { alignSelf: "center", marginTop: spacing.md },
});
