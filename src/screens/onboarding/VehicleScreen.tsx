import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { InputField } from "../../components/InputField";
import { PrimaryButton } from "../../components/PrimaryButton";
import { ReadOnlyRow } from "../../components/ReadOnlyRow";
import { SectionCard } from "../../components/SectionCard";
import { VehicleCard } from "../../components/VehicleCard";
import { textAlignStart } from "../../i18n";
import { strings } from "../../i18n/strings";
import {
  VEHICLE_FEATURE_KEYS,
  VEHICLE_FEATURE_LABELS,
  VEHICLE_STATUS_LABELS,
  p1,
} from "../../i18n/strings.phase1";
import {
  radius,
  spacing,
  touchTarget,
  typography,
  usePalette,
  withAlpha,
  type Palette,
} from "../../theme";
import {
  useDriverProfile,
  useUpdateDriverProfile,
} from "../../hooks/useDriverProfile";
import { toApiError } from "../../api/client";
import type { UpdateDriverProfileInput } from "../../types/driver";

/** Order-insensitive comparison, since the server deduplicates and may reorder. */
function sameFeatures(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const left = [...a].sort();
  const right = [...b].sort();
  return left.every((value, index) => value === right[index]);
}

/**
 * The active vehicle, saved through PATCH /driver/me.
 *
 * PHASE 2: this block used to be the second half of ProfileScreen. Sections 13
 * and 62 put VEHICLE INFORMATION after DOCUMENTS in the onboarding order, and
 * that order is impossible to express while the vehicle fields sit inside the
 * screen the driver reaches first. So it is its own screen, its own delta and
 * its own save.
 *
 * The server constraints that shaped the old form still apply here, unchanged:
 *
 * 1. Only CHANGED fields are sent. The server resets vehicle verification to
 *    PENDING whenever an identity field (make / model / plate / year) differs
 *    from what is stored, so re-sending untouched values would invalidate an
 *    already approved vehicle. carFeatures is deliberately NOT one of those
 *    identity fields, so a driver can correct the comfort list of an approved
 *    car without losing the approval.
 * 2. Vehicle TYPE is read-only: its catalogue is behind a STAFF-only endpoint,
 *    so this app cannot list it and will not invent a picker over data it
 *    cannot read.
 * 3. Service class (rideClass) is read-only for a different reason - staff
 *    assign it during vehicle review, on purpose, so a driver cannot quietly
 *    relabel an approved van as "economy" to pick up more offers.
 *
 * There is no /vehicles write path for drivers: that route is staff-only, so
 * everything here travels as car* fields on the driver PATCH. No endpoint was
 * invented to make this screen look self-contained.
 *
 * STILL OUTSTANDING (PHASE 2, visual rebuild): Stitch draws this as my_vehicle
 * (screenshot 14) and vehicle_details_specs - a vehicle hero card with the
 * plate as a badge, spec rows and an inspection status block. This is still the
 * PHASE 1 stacked-input form.
 */
export function VehicleScreen() {
  const insets = useSafeAreaInsets();
  const palette = usePalette();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const { data: profile } = useDriverProfile();
  const mutation = useUpdateDriverProfile();

  const vehicle = profile?.vehicle ?? null;

  const [make, setMake] = useState(vehicle?.make ?? "");
  const [model, setModel] = useState(vehicle?.model ?? "");
  const [color, setColor] = useState(vehicle?.color ?? "");
  const [plate, setPlate] = useState(vehicle?.plate ?? "");
  const [year, setYear] = useState(vehicle?.year ? String(vehicle.year) : "");
  // Vehicle.features is String[] and free-form on the server, so the keys in
  // VEHICLE_FEATURE_KEYS are this app's vocabulary and travel as-is.
  const [features, setFeatures] = useState<string[]>(vehicle?.features ?? []);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  /**
   * One-shot hydration.
   *
   * Every field is initialised from `profile`, which is undefined on the first
   * render whenever the query has no cached data. This runs once per profile id
   * and never again, so a background refetch cannot overwrite a plate the
   * driver is halfway through typing.
   */
  const hydratedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!profile || hydratedFor.current === profile.id) return;
    hydratedFor.current = profile.id;
    setMake(profile.vehicle?.make ?? "");
    setModel(profile.vehicle?.model ?? "");
    setColor(profile.vehicle?.color ?? "");
    setPlate(profile.vehicle?.plate ?? "");
    setYear(profile.vehicle?.year ? String(profile.vehicle.year) : "");
    setFeatures(profile.vehicle?.features ?? []);
  }, [profile]);

  /** Only what actually differs from the loaded vehicle. */
  const changes = useMemo<UpdateDriverProfileInput>(() => {
    const next: UpdateDriverProfileInput = {};

    const pairs: Array<[keyof UpdateDriverProfileInput, string, string]> = [
      ["carMake", make.trim(), vehicle?.make ?? ""],
      ["carModel", model.trim(), vehicle?.model ?? ""],
      ["carColor", color.trim(), vehicle?.color ?? ""],
      ["carPlate", plate.trim().toUpperCase(), vehicle?.plate ?? ""],
    ];
    for (const [key, value, original] of pairs) {
      if (value !== original) {
        (next as Record<string, unknown>)[key] = value;
      }
    }

    const parsedYear = year.trim() ? Number(year.trim()) : null;
    if (parsedYear !== (vehicle?.year ?? null) && parsedYear !== null) {
      next.carYear = parsedYear;
    }

    // The whole list is sent, because the server REPLACES the array rather than
    // merging it. Sending only the delta would delete the rest.
    if (!sameFeatures(features, vehicle?.features ?? [])) {
      next.carFeatures = features;
    }

    return next;
  }, [make, model, color, plate, year, features, vehicle]);

  const dirty = Object.keys(changes).length > 0;

  const toggleFeature = (key: string) => {
    setFeatures((current) =>
      current.includes(key)
        ? current.filter((value) => value !== key)
        : [...current, key],
    );
  };

  const onSave = async () => {
    setError(null);
    setSaved(false);

    if (!dirty) {
      setError(strings.profile.nothingChanged);
      return;
    }

    // Mirror of the server rule: it throws when the resulting vehicle would
    // have no model or no plate. Checking here saves the driver a round trip.
    if (!model.trim() || !plate.trim()) {
      setError(strings.profile.modelAndPlateRequired);
      return;
    }

    if (changes.carYear !== undefined) {
      const currentYear = new Date().getFullYear();
      if (
        !Number.isInteger(changes.carYear) ||
        changes.carYear < 1970 ||
        changes.carYear > currentYear + 1
      ) {
        setError(strings.profile.yearInvalid);
        return;
      }
    }

    try {
      await mutation.mutateAsync(changes);
      setSaved(true);
    } catch (saveError) {
      const apiError = toApiError(saveError);
      setError(
        apiError.offline
          ? strings.errors.network
          : apiError.message || strings.profile.saveFailed,
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.xl },
          { paddingBottom: insets.bottom + spacing["3xl"] },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>{strings.profile.vehicleSection}</Text>

        <SectionCard
          title={strings.profile.vehicleSection}
          hint={strings.profile.vehicleHint}
        >
          <VehicleCard vehicle={vehicle} />

          <InputField
            label={strings.profile.makeLabel}
            placeholder={strings.profile.makePlaceholder}
            value={make}
            onChangeText={setMake}
            maxLength={60}
          />
          <InputField
            label={strings.profile.modelLabel}
            placeholder={strings.profile.modelPlaceholder}
            value={model}
            onChangeText={setModel}
            maxLength={60}
          />
          <InputField
            label={strings.profile.colorLabel}
            placeholder={strings.profile.colorPlaceholder}
            value={color}
            onChangeText={setColor}
            maxLength={30}
          />
          <InputField
            label={strings.profile.plateLabel}
            placeholder={strings.profile.platePlaceholder}
            value={plate}
            onChangeText={setPlate}
            autoCapitalize="characters"
            maxLength={20}
          />
          <InputField
            label={strings.profile.yearLabel}
            placeholder={strings.profile.yearPlaceholder}
            value={year}
            onChangeText={(text) => setYear(text.replace(/[^0-9]/g, ""))}
            keyboardType="number-pad"
            maxLength={4}
          />

          {/* Vehicle features. The keys travel, the labels never do. */}
          <View style={styles.pickerBlock}>
            <Text style={styles.pickerLabel}>{p1.profile.featuresLabel}</Text>
            <Text style={styles.pickerHint}>{p1.profile.featuresHint}</Text>
            <View style={styles.chipWrap}>
              {VEHICLE_FEATURE_KEYS.map((key) => {
                const selected = features.includes(key);
                return (
                  <Pressable
                    key={key}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                    onPress={() => toggleFeature(key)}
                    style={[styles.chip, selected && styles.chipSelected]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selected && styles.chipTextSelected,
                      ]}
                    >
                      {VEHICLE_FEATURE_LABELS[key] ?? key}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <ReadOnlyRow
            label={strings.profile.rideClassLabel}
            value={vehicle?.rideClass ?? strings.profile.rideClassPending}
            hint={strings.profile.rideClassLocked}
          />

          {/* The review verdict, so a rejected vehicle stops being a silent
              dead end. Both values are read-only server output. */}
          {vehicle?.verificationStatus ? (
            <ReadOnlyRow
              label={p1.profile.vehicleStatusLabel}
              value={
                VEHICLE_STATUS_LABELS[vehicle.verificationStatus] ??
                vehicle.verificationStatus
              }
              hint={strings.profile.vehicleHint}
            />
          ) : null}
          {vehicle?.verificationNote ? (
            <View style={styles.noteBox}>
              <Text style={styles.noteTitle}>{p1.profile.vehicleNoteLabel}</Text>
              <Text style={styles.noteText}>{vehicle.verificationNote}</Text>
            </View>
          ) : null}
        </SectionCard>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {saved && !error ? (
          <Text style={styles.success}>{strings.common.saved}</Text>
        ) : null}

        <PrimaryButton
          label={strings.profile.saveChanges}
          onPress={() => void onSave()}
          loading={mutation.isPending}
          disabled={!dirty}
          style={styles.save}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: palette.background },
    content: { paddingHorizontal: spacing.xl, gap: spacing.lg },
    heading: {
      ...typography.title,
      color: palette.textPrimary,
      textAlign: textAlignStart(),
    },
    pickerBlock: { gap: spacing.xs },
    pickerLabel: {
      ...typography.caption,
      color: palette.textSecondary,
      textAlign: textAlignStart(),
    },
    pickerHint: {
      ...typography.caption,
      color: palette.textSecondary,
      textAlign: textAlignStart(),
    },
    // Plain "row": mirrored by React Native under RTL.
    chipWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs,
      marginTop: spacing.xs,
    },
    chip: {
      // Driver touch floor (56pt), not a normal chip size: this is filled in
      // the car, and a mis-tap means the wrong claim about the vehicle.
      minHeight: touchTarget.normal,
      justifyContent: "center",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.surfaceSunken,
    },
    chipSelected: {
      borderColor: palette.primary,
      backgroundColor: palette.primaryWash,
    },
    chipText: {
      ...typography.caption,
      color: palette.textSecondary,
    },
    chipTextSelected: { color: palette.primaryText },
    noteBox: {
      padding: spacing.md,
      borderRadius: radius.sm,
      backgroundColor: withAlpha(palette.danger, 0.12),
      borderWidth: 1,
      borderColor: withAlpha(palette.danger, 0.4),
    },
    noteTitle: {
      ...typography.caption,
      color: palette.danger,
      fontWeight: "600",
      textAlign: textAlignStart(),
    },
    noteText: {
      ...typography.body,
      color: palette.textPrimary,
      textAlign: textAlignStart(),
      marginTop: 2,
    },
    error: {
      ...typography.body,
      color: palette.danger,
      textAlign: textAlignStart(),
    },
    success: {
      ...typography.body,
      color: palette.online,
      textAlign: textAlignStart(),
    },
    save: { marginTop: spacing.sm },
  });
