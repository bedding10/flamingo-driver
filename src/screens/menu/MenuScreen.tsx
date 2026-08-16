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
import { useDriverProfile } from "../../hooks/useDriverProfile";
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
 * PHASE 5 - the driver's menu.
 *
 * Until now the hamburger on the map opened the profile form directly, so the
 * wallet, the earnings and the requests list had no home and the profile screen
 * was carrying a job it was not built for. This screen is a router and nothing
 * else: it reads GET /driver/me (already cached) and navigates. It owns no
 * server state of its own, which is why there is no loading skeleton here.
 */
export function MenuScreen() {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<DriverStackParamList>>();
  const { data: profile } = useDriverProfile();
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
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>
          {profile?.name || strings.profile.title}
        </Text>
        <Text style={styles.phone} numberOfLines={1}>
          {profile?.phone ?? "\u2014"}
        </Text>
        <Text style={styles.vehicle} numberOfLines={1}>
          {vehicleLine}
        </Text>
        {profile?.profileLevel ? (
          <Text style={styles.level}>
            {LEVEL_LABELS[profile.profileLevel] ?? profile.profileLevel}
          </Text>
        ) : null}

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
        </View>
      </View>

      <MenuRow
        label={menuStrings.wallet}
        hint={menuStrings.walletHint}
        onPress={() => navigation.navigate("Wallet")}
      />
      <MenuRow
        label={menuStrings.requests}
        hint={menuStrings.requestsHint}
        onPress={() => navigation.navigate("Requests")}
      />
      <MenuRow
        label={menuStrings.profile}
        hint={menuStrings.profileHint}
        onPress={() => navigation.navigate("Profile")}
      />
      <MenuRow
        label={menuStrings.documents}
        hint={menuStrings.documentsHint}
        onPress={() => navigation.navigate("Documents")}
      />

      <PrimaryButton
        label={menuStrings.signOut}
        variant="outline"
        onPress={confirmSignOut}
        style={styles.signOut}
      />

      <Text style={styles.footer}>{menuStrings.footer}</Text>
    </ScrollView>
  );
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
  onPress,
}: {
  label: string;
  hint: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
    >
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowHint}>{hint}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  content: { padding: spacing.xl, gap: spacing.md },
  header: {
    backgroundColor: colors.surfaceDark,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  name: {
    ...typography.subtitle,
    color: colors.textOnDark,
    textAlign: "right",
    writingDirection: "rtl",
  },
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
  level: { ...typography.caption, color: colors.gold, textAlign: "right" },
  statsRow: {
    flexDirection: "row-reverse",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  stat: {
    flex: 1,
    backgroundColor: withAlpha(colors.offWhite, 0.06),
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  statValue: { ...typography.numeric, color: colors.gold },
  statLabel: {
    ...typography.caption,
    color: colors.textOnDarkSecondary,
    marginTop: spacing.xs,
    writingDirection: "rtl",
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
  rowPressed: { opacity: 0.85 },
  rowLabel: {
    ...typography.subtitle,
    color: colors.textOnDark,
    textAlign: "right",
    writingDirection: "rtl",
  },
  rowHint: {
    ...typography.caption,
    color: colors.textOnDarkSecondary,
    textAlign: "right",
    writingDirection: "rtl",
  },
  signOut: { marginTop: spacing.lg },
  footer: {
    ...typography.caption,
    color: colors.textOnDarkSecondary,
    textAlign: "center",
    marginTop: spacing.md,
  },
});
