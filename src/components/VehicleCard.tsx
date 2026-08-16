import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  radius,
  spacing,
  typography,
  usePalette,
  type Palette,
} from "../theme";
import { strings } from "../i18n/strings";
import type { DriverVehicle } from "../types/driver";

/**
 * Read-only summary of the ACTIVE vehicle as the server returns it.
 *
 * A driver has exactly one active vehicle in this system (the server includes
 * `vehicles: { where: { isActive: true }, take: 1 }`), so there is no list here.
 */
export function VehicleCard({ vehicle }: { vehicle: DriverVehicle | null }) {
  const palette = usePalette();
  const styles = useMemo(() => makeStyles(palette), [palette]);

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
        <Text style={styles.plate}>{vehicle.plate ?? "\u2014"}</Text>
      </View>

      <View style={styles.metaRow}>
        <Meta
          styles={styles}
          label={strings.vehicle.color}
          value={vehicle.color}
        />
        <Meta
          styles={styles}
          label={strings.vehicle.year}
          value={vehicle.year ? String(vehicle.year) : null}
        />
      </View>
    </View>
  );
}

function Meta({
  styles,
  label,
  value,
}: {
  styles: ReturnType<typeof makeStyles>;
  label: string;
  value: string | null;
}) {
  return (
    <View style={styles.meta}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value ?? "\u2014"}</Text>
    </View>
  );
}

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    card: {
      backgroundColor: palette.surfaceRaised,
      borderRadius: radius.card,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: palette.border,
    },
    header: {
      flexDirection: "row-reverse",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
    },
    title: {
      ...typography.subtitle,
      color: palette.textPrimary,
      flexShrink: 1,
      textAlign: "right",
      writingDirection: "rtl",
    },
    rideClass: {
      ...typography.caption,
      color: palette.primaryText,
      letterSpacing: 1,
    },
    plateWrapper: {
      alignSelf: "flex-end",
      marginTop: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: palette.borderStrong,
      backgroundColor: palette.surfaceSunken,
    },
    plate: {
      ...typography.subtitle,
      color: palette.textPrimary,
      letterSpacing: 2,
      writingDirection: "ltr",
    },
    metaRow: {
      flexDirection: "row-reverse",
      gap: spacing["3xl"],
      marginTop: spacing.lg,
    },
    meta: { alignItems: "flex-end" },
    metaLabel: { ...typography.caption, color: palette.textSecondary },
    metaValue: {
      ...typography.label,
      color: palette.textPrimary,
      marginTop: 2,
    },
    empty: {
      ...typography.body,
      color: palette.textSecondary,
      textAlign: "right",
      writingDirection: "rtl",
    },
  });
