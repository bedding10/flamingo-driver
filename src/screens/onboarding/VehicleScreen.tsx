import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
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

import { toApiError } from "../../api/client";
import { InputField } from "../../components/InputField";
import { ReadOnlyRow } from "../../components/ReadOnlyRow";
import {
  useDriverProfile,
  useUpdateDriverProfile,
} from "../../hooks/useDriverProfile";
import { textAlignStart } from "../../i18n";
import { strings } from "../../i18n/strings";
import {
  VEHICLE_FEATURE_KEYS,
  VEHICLE_FEATURE_LABELS,
  VEHICLE_STATUS_LABELS,
  p1,
} from "../../i18n/strings.phase1";
import {
  alpha,
  COLORS,
  ICON_SIZE,
  RADIUS,
  SEMANTIC,
  SHADOW_CARD,
  SPACING,
  typo,
} from "../../theme/tokens";
import type { UpdateDriverProfileInput } from "../../types/driver";
import { HEADER_HEIGHT, PillButton, StickyHeader } from "../../ui";

const CHIP_MIN_HEIGHT = 56;

/** Order-insensitive comparison, since the server deduplicates and may reorder. */
function sameFeatures(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const left = [...a].sort();
  const right = [...b].sort();
  return left.every((value, index) => value === right[index]);
}

/**
 * Stitch `my_vehicle` - the active vehicle, saved through PATCH /driver/me.
 *
 * The server constraints that shaped this form are unchanged:
 *
 * 1. Only CHANGED fields are sent. The server resets vehicle verification to
 *    PENDING whenever an identity field (make / model / plate / year) differs
 *    from what is stored, so re-sending untouched values would invalidate an
 *    already approved vehicle. carFeatures is deliberately NOT one of those
 *    identity fields, so a driver can correct the comfort list of an approved
 *    car without losing the approval.
 * 2. Vehicle TYPE is read-only: its catalogue sits behind a STAFF-only
 *    endpoint, so this app will not invent a picker over data it cannot read.
 * 3. Service class (rideClass) is read-only for a different reason - staff
 *    assign it during review, so a driver cannot quietly relabel an approved
 *    van as "economy" to pick up more offers.
 *
 * There is no /vehicles write path for drivers, so everything travels as car*
 * fields on the driver PATCH. No endpoint was invented to make this screen look
 * self-contained.
 *
 * REBUILT ON THE REFERENCE: the hero card with the pink-wash gradient, the
 * state pill, the make/model headline and the plate badge, then the editable
 * specs below it. The reference's vehicle photograph, maintenance reminders and
 * document expiry dates are NOT built: there is no vehicle-photo field, no
 * maintenance endpoint and no per-document expiry surface on the driver API,
 * and inventing them would put fiction on a screen an operator reviews.
 */
export function VehicleScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
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
   * One-shot hydration: runs once per profile id, so a background refetch
   * cannot overwrite a plate the driver is halfway through typing.
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

  const approved = vehicle?.verificationStatus === "APPROVED";
  const headline = [vehicle?.make, vehicle?.model].filter(Boolean).join(" ");
  const subline = [vehicle?.color, vehicle?.year]
    .filter(Boolean)
    .join(" \u2022 ");

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + HEADER_HEIGHT + SPACING.lg,
            paddingBottom: insets.bottom + SPACING.xxl,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>{strings.profile.vehicleSection}</Text>

        {/* Hero card. The state pill reports the SERVER verdict, so it cannot
            claim a vehicle is active while review is still pending. */}
        <View style={[styles.hero, SHADOW_CARD]}>
          <View
            style={[styles.statePill, approved ? styles.stateOk : styles.statePending]}
          >
            <Text
              style={[
                styles.stateText,
                { color: approved ? SEMANTIC.success : COLORS.onSurfaceVariant },
              ]}
            >
              {vehicle?.verificationStatus
                ? VEHICLE_STATUS_LABELS[vehicle.verificationStatus] ??
                  vehicle.verificationStatus
                : strings.profile.rideClassPending}
            </Text>
          </View>

          <Text style={styles.heroTitle}>
            {headline || strings.profile.vehicleHint}
          </Text>
          {subline ? <Text style={styles.heroSub}>{subline}</Text> : null}

          {/* Plate badge. Pinned LTR and wide-tracked, like the reference's
              mono badge: an Algerian plate is a Latin/digit run. */}
          <View style={styles.plateBadge}>
            <MaterialIcons
              name="directions-car"
              size={ICON_SIZE.lg}
              color={COLORS.primary}
            />
            <Text style={styles.plateText}>
              {vehicle?.plate ?? "\u2014"}
            </Text>
          </View>
        </View>

        {/* Editable specs. */}
        <View style={[styles.card, SHADOW_CARD]}>
          <Text style={styles.cardTitle}>{strings.profile.vehicleSection}</Text>
          <Text style={styles.cardHint}>{strings.profile.vehicleHint}</Text>

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
          {vehicle?.verificationNote ? (
            <View style={styles.noteBox}>
              <Text style={styles.noteTitle}>{p1.profile.vehicleNoteLabel}</Text>
              <Text style={styles.noteText}>{vehicle.verificationNote}</Text>
            </View>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {saved && !error ? (
            <Text style={styles.success}>{strings.common.saved}</Text>
          ) : null}

          <PillButton
            label={strings.profile.saveChanges}
            onPress={() => void onSave()}
            loading={mutation.isPending}
            disabled={!dirty}
            style={styles.save}
          />
        </View>
      </ScrollView>

      <StickyHeader
        onBackPress={navigation.canGoBack() ? navigation.goBack : undefined}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: SPACING.container, gap: SPACING.lg },
  heading: {
    ...typo("headlineLgMobile"),
    color: COLORS.onSurface,
    textAlign: textAlignStart(),
  },
  /** Stitch `bg-surface-container rounded-[24px] p-6` with a pink wash. */
  hero: {
    borderRadius: RADIUS.card,
    backgroundColor: COLORS.surfaceContainer,
    borderWidth: 1,
    borderColor: alpha(COLORS.primary, 0.1),
    padding: SPACING.xl,
    gap: SPACING.sm,
  },
  statePill: {
    alignSelf: "flex-start",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  stateOk: {
    backgroundColor: alpha(SEMANTIC.success, 0.2),
    borderColor: alpha(SEMANTIC.success, 0.3),
  },
  statePending: {
    backgroundColor: alpha(COLORS.surfaceVariant, 0.6),
    borderColor: COLORS.surfaceVariant,
  },
  stateText: { ...typo("labelSm") },
  heroTitle: {
    ...typo("headlineLgMobile"),
    color: COLORS.onSurface,
    textAlign: textAlignStart(),
  },
  heroSub: {
    ...typo("bodyMd"),
    color: COLORS.onSurfaceVariant,
    textAlign: textAlignStart(),
  },
  plateBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: COLORS.surfaceVariant,
  },
  plateText: {
    ...typo("titleMd"),
    color: COLORS.onSurface,
    letterSpacing: 2,
    writingDirection: "ltr",
  },
  card: {
    borderRadius: RADIUS.card,
    backgroundColor: COLORS.surfaceContainer,
    borderWidth: 1,
    borderColor: alpha(COLORS.surfaceVariant, 0.3),
    padding: SPACING.xl,
    gap: SPACING.lg,
  },
  cardTitle: {
    ...typo("titleMd"),
    color: COLORS.onSurface,
    textAlign: textAlignStart(),
  },
  cardHint: {
    ...typo("labelSm"),
    color: COLORS.onSurfaceVariant,
    textAlign: textAlignStart(),
  },
  pickerBlock: { gap: SPACING.xs },
  pickerLabel: {
    ...typo("labelMd"),
    color: COLORS.onSurface,
    textAlign: textAlignStart(),
  },
  pickerHint: {
    ...typo("labelSm"),
    color: COLORS.onSurfaceVariant,
    textAlign: textAlignStart(),
  },
  // Plain "row": mirrored by React Native under RTL.
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  chip: {
    // Driver touch floor, not a normal chip size: this is filled in the car,
    // and a mis-tap means the wrong claim about the vehicle.
    minHeight: CHIP_MIN_HEIGHT,
    justifyContent: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surface,
  },
  chipSelected: {
    borderColor: COLORS.primaryContainer,
    backgroundColor: alpha(COLORS.primaryContainer, 0.16),
  },
  chipText: { ...typo("labelSm"), color: COLORS.onSurfaceVariant },
  chipTextSelected: { color: COLORS.primary },
  noteBox: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: alpha(COLORS.error, 0.12),
    borderWidth: 1,
    borderColor: alpha(COLORS.error, 0.4),
  },
  noteTitle: {
    ...typo("labelSm"),
    color: COLORS.error,
    textAlign: textAlignStart(),
  },
  noteText: {
    ...typo("bodyMd"),
    color: COLORS.onSurface,
    textAlign: textAlignStart(),
    marginTop: 2,
  },
  error: {
    ...typo("bodyMd"),
    color: COLORS.error,
    textAlign: textAlignStart(),
  },
  success: {
    ...typo("bodyMd"),
    color: SEMANTIC.success,
    textAlign: textAlignStart(),
  },
  save: { marginTop: SPACING.sm },
});
