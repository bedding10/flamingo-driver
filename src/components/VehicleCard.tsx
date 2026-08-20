import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  radius,
  spacing,
  typography,
  usePalette,
  type Palette,
} from "../theme";
import { textAlignStart } from "../i18n";
import { strings } from "../i18n/strings";
import type { DriverVehicle } from "../types/driver";

/**
 * Read-only summary of the ACTIVE vehicle as the server returns it.
 *
 * A driver has exactly one active vehicle in this system (the server includes
 * `vehicles: { where: { isActive: true }, take: 1 }`), so there is no list here.
 *
 * PHASE 1 (R-11): the two rows were `"row-reverse"` and two text styles were
 * `textAlign: "right"` with `writingDirection: "rtl"`. Both rows are now plain
 * `"row"` so React Native mirrors them, and the text resolves its alignment.
 *
 * Deliberately NOT changed: `plate` keeps `writingDirection: "ltr"` because a
 * licence plate is latin and numeric and must never reflow, and the
 * `alignSelf`/`alignItems: "flex-end"` values are already logical in Yoga - they
 * follow the layout direction on their own, so "fixing" them would break them.
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
    // Plain "row": mirrored by React Native under RTL.
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
    },
    title: {
      ...typography.subtitle,
      color: palette.textPrimary,
      flexShrink: 1,
      textAlign: textAlignStart(),
    },
    rideClass: {
      ...typography.caption,
      color: palette.primaryText,
      letterSpacing: 1,
    },
    plateWrapper: {
      // Logical: follows the layout direction already.
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
      // A plate is latin and numeric: it must read the same in every language.
      writingDirection: "ltr",
    },
    metaRow: {
      flexDirection: "row",
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
      textAlign: textAlignStart(),
    },
  });
