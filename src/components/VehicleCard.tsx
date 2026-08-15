import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "../theme";
import { strings } from "../i18n/strings";
import type { DriverVehicle } from "../types/driver";

/**
 * Read-only summary of the ACTIVE vehicle as the server returns it.
 *
 * A driver has exactly one active vehicle in this system (the server includes
 * `vehicles: { where: { isActive: true }, take: 1 }`), so there is no list here.
 */
export function VehicleCard({ vehicle }: { vehicle: DriverVehicle | null }) {
  if (!vehicle) {
    return (
      <View style={styles.card}>
        <Text style={styles.empty}>{strings.vehicle.empty}</Text>
      </View>
    );
  }

  const title = [vehicle.make, vehicle.model].filter(Boolean).join(" ");

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {title || strings.vehicle.unknownModel}
        </Text>
        {vehicle.rideClass ? (
          <Text style={styles.rideClass}>{vehicle.rideClass}</Text>
        ) : null}
      </View>

      <View style={styles.plateWrapper}>
        <Text style={styles.plate}>{vehicle.plate ?? "—"}</Text>
      </View>

      <View style={styles.metaRow}>
        <Meta label={strings.vehicle.color} value={vehicle.color} />
        <Meta
          label={strings.vehicle.year}
          value={vehicle.year ? String(vehicle.year) : null}
        />
      </View>
    </View>
  );
}

function Meta({ label, value }: { label: string; value: string | null }) {
  return (
    <View style={styles.meta}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value ?? "—"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceDarkRaised,
    borderRadius: radius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  header: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  title: {
    ...typography.subtitle,
    color: colors.textOnDark,
    flexShrink: 1,
    textAlign: "right",
    writingDirection: "rtl",
  },
  rideClass: { ...typography.caption, color: colors.gold, letterSpacing: 1 },
  plateWrapper: {
    alignSelf: "flex-end",
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.offWhite,
  },
  plate: {
    ...typography.subtitle,
    color: colors.textPrimary,
    letterSpacing: 2,
    writingDirection: "ltr",
  },
  metaRow: {
    flexDirection: "row-reverse",
    gap: spacing["3xl"],
    marginTop: spacing.lg,
  },
  meta: { alignItems: "flex-end" },
  metaLabel: { ...typography.caption, color: colors.textOnDarkSecondary },
  metaValue: { ...typography.label, color: colors.textOnDark, marginTop: 2 },
  empty: {
    ...typography.body,
    color: colors.textOnDarkSecondary,
    textAlign: "right",
    writingDirection: "rtl",
  },
});
