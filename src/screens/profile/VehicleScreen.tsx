import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useDriverProfile } from "../../hooks/useDriverProfile";
import {
  VEHICLE_FEATURE_LABELS,
  VEHICLE_STATUS_LABELS,
  p1,
} from "../../i18n/strings.phase1";
import { RIDE_CLASS_LABELS, hubStrings as t } from "../../i18n/strings.profile.hub";
import type { DriverStackParamList } from "../../navigation/types";
import type { VehicleVerificationStatus } from "../../types/driver";
import {
  AppText,
  Badge,
  Button,
  Card,
  ListRow,
  Screen,
  rtlRow,
  type BadgeTone,
} from "../../ui";
import { spacing } from "../../theme";

/**
 * Reference: `my_vehicle.html`.
 *
 * Everything shown here comes from `DriverProfile.vehicle`, which the server
 * already returns in full: make, model, colour, plate, year, service class,
 * comfort features, verification status and the operator's note.
 *
 * The screen is READ-ONLY on purpose. The only write path the API exposes for a
 * car is PATCH /driver/me with flat carMake / carModel / ... fields, and that is
 * the profile form. A second editor here would duplicate the same request with
 * a different validation, and touching an identity field silently sends an
 * approved vehicle back to review - so the warning is printed and the edit is
 * delegated to the one form that already handles it.
 */
const statusTone = (
  status: VehicleVerificationStatus | null | undefined,
): BadgeTone => {
  if (status === "APPROVED") return "success";
  if (status === "REJECTED") return "danger";
  return "warning";
};

export function VehicleScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<DriverStackParamList>>();
  const { data: profile, isLoading } = useDriverProfile();

  if (isLoading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      </Screen>
    );
  }

  const vehicle = profile?.vehicle ?? null;

  if (!vehicle) {
    return (
      <Screen>
        <Card>
          <AppText tone="secondary">{t.noVehicle}</AppText>
          <Button
            label={t.addVehicle}
            onPress={() => navigation.navigate("Profile")}
          />
        </Card>
      </Screen>
    );
  }

  const features = vehicle.features ?? [];
  const status = vehicle.verificationStatus ?? null;

  return (
    <Screen scroll bottomInset>
      <Card>
        <View style={styles.rowBetween}>
          <AppText variant="caption" tone="secondary">
            {t.plateLabel}
          </AppText>
          {status ? (
            <Badge
              label={VEHICLE_STATUS_LABELS[status] ?? status}
              tone={statusTone(status)}
              icon={status === "APPROVED" ? "verified" : "timer"}
            />
          ) : null}
        </View>
        <AppText variant="display">{vehicle.plate ?? "\u2014"}</AppText>
        <AppText tone="secondary">
          {[vehicle.make, vehicle.model].filter(Boolean).join(" ") || "\u2014"}
        </AppText>
      </Card>

      {/* The operator's rejection note is the only way a driver knows what to fix. */}
      {vehicle.verificationNote ? (
        <Card tone="sunken">
          <AppText variant="caption" tone="secondary">
            {p1.profile.vehicleNoteLabel}
          </AppText>
          <AppText>{vehicle.verificationNote}</AppText>
        </Card>
      ) : null}

      <Card padded={false}>
        <ListRow
          icon="car"
          title={t.makeModelLabel}
          value={[vehicle.make, vehicle.model].filter(Boolean).join(" ") || "\u2014"}
        />
        <ListRow
          icon="image"
          title={t.colorLabel}
          value={vehicle.color ?? "\u2014"}
        />
        <ListRow
          icon="calendar"
          title={t.yearLabel}
          value={vehicle.year ? String(vehicle.year) : "\u2014"}
        />
        <ListRow
          icon="star"
          title={t.classLabel}
          subtitle={t.classHint}
          value={
            vehicle.rideClass
              ? (RIDE_CLASS_LABELS[vehicle.rideClass] ?? vehicle.rideClass)
              : "\u2014"
          }
        />
      </Card>

      <Card>
        <AppText variant="subtitle">{p1.profile.featuresLabel}</AppText>
        {features.length ? (
          <View style={styles.chips}>
            {features.map((feature) => (
              <Badge
                key={feature}
                label={VEHICLE_FEATURE_LABELS[feature] ?? feature}
                tone="neutral"
              />
            ))}
          </View>
        ) : (
          <AppText tone="muted" variant="caption">
            {t.featuresEmpty}
          </AppText>
        )}
      </Card>

      <Card tone="sunken">
        <AppText variant="caption" tone="secondary">
          {t.identityWarning}
        </AppText>
      </Card>

      <Button
        label={t.editVehicle}
        variant="secondary"
        onPress={() => navigation.navigate("Profile")}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
  },
  rowBetween: {
    ...rtlRow,
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  chips: { ...rtlRow, flexWrap: "wrap", gap: spacing.sm },
});
