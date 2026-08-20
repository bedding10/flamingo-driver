import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
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
import { SectionCard } from "../../components/SectionCard";
import { VehicleCard } from "../../components/VehicleCard";
import { ProfilePhotoPicker } from "../../components/ProfilePhotoPicker";
import { PasswordSetupCard } from "../../components/PasswordSetupCard";
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
import { useCities, useWilayas } from "../../hooks/useGeography";
import { toApiError } from "../../api/client";
import type { UpdateDriverProfileInput } from "../../types/driver";

type Styles = ReturnType<typeof makeStyles>;

// Phase 11 - display labels only, mirroring ActiveTripCard.
//
// It is a lookup table and nothing more: the level itself is decided by the
// backend from COMPLETED trips, and no threshold (10 / 50 / 100 / 500) is
// introduced here. An unknown level falls back to the raw server value.
const LEVEL_LABELS: Record<string, string> = {
  BRONZE: strings.level.bronze,
  SILVER: strings.level.silver,
  GOLD: strings.level.gold,
  DIAMOND: strings.level.diamond,
  LEGENDARY: strings.level.legendary,
};

/** Order-insensitive comparison, since the server deduplicates and may reorder. */
function sameFeatures(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const left = [...a].sort();
  const right = [...b].sort();
  return left.every((value, index) => value === right[index]);
}

/**
 * Driver identity + active vehicle, saved in a single PATCH /driver/me.
 *
 * Four deliberate constraints, all dictated by the server:
 *
 * 1. Only CHANGED fields are sent. The server resets the vehicle verification to
 *    PENDING whenever an identity field (make / model / plate / year) differs, so
 *    re-sending untouched values would invalidate an approved vehicle.
 *    PHASE 1 note: carFeatures is NOT an identity field on the server, on
 *    purpose, so a driver can correct the comfort list of an approved vehicle
 *    without losing the approval.
 * 2. The phone number is read-only. It is the identity Firebase authenticates,
 *    and PATCH would change it without re-verifying, locking the driver out of
 *    the next login. PHASE 1 keeps this rule even though a password now exists:
 *    the password is a second door to the SAME phone-owned account, never a way
 *    to move the account to another number.
 * 3. Vehicle type is read-only. Its catalogue still lives behind a STAFF-only
 *    endpoint, so this app cannot list it and will not invent a picker over
 *    data it cannot read.
 *    City is no longer read-only. Phase 8 added an authenticated, non-STAFF
 *    geography surface (GET /geography/public/wilayas + /cities), so the driver
 *    now picks a wilaya and then a city from server data.
 *    Only cityId is sent; the wilaya is derived server-side from the city, so a
 *    client cannot claim a cheaper wilaya to influence pricing.
 * 4. Service class (rideClass) is read-only too, for a different reason: staff
 *    assign it during vehicle review, on purpose, so a driver cannot quietly
 *    relabel an approved van as "economy" to pick up more offers.
 *
 * PHASE 1C: the profile photo is NOT part of this form and has no Save button
 * of its own here. It travels through the document upload flow
 * (upload-url -> PUT -> POST /driver/documents), which is a different contract
 * with a different failure mode.
 *
 * PHASE 7.5 CLOSURE: colours only - plus the removal of two `colors.primary`
 * references, a token that does not exist on the colors object and would have
 * failed `tsc --noEmit`.
 *
 * PHASE 1 (R-11): the largest direction pass in the audit - three
 * "row-reverse" rows (statsRow, pickerStatus, chipWrap) and fifteen text
 * styles. No field, endpoint or validation rule was touched.
 */
export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const palette = usePalette();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const { data: profile } = useDriverProfile();
  const mutation = useUpdateDriverProfile();

  const vehicle = profile?.vehicle ?? null;

  const [name, setName] = useState(profile?.name ?? "");
  const [make, setMake] = useState(vehicle?.make ?? "");
  const [model, setModel] = useState(vehicle?.model ?? "");
  const [color, setColor] = useState(vehicle?.color ?? "");
  const [plate, setPlate] = useState(vehicle?.plate ?? "");
  const [year, setYear] = useState(vehicle?.year ? String(vehicle.year) : "");
  // PHASE 1: Vehicle.features String[]. Free-form on the server, so the keys in
  // VEHICLE_FEATURE_KEYS are this app's vocabulary and travel as-is.
  const [features, setFeatures] = useState<string[]>(vehicle?.features ?? []);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // - Phase 8: wilaya -> city selection, both from the backend -
  const [wilayaId, setWilayaId] = useState<string | null>(null);
  const [cityId, setCityId] = useState<string | null>(profile?.cityId ?? null);
  const wilayasQuery = useWilayas();
  const citiesQuery = useCities(wilayaId);

  /**
   * One-shot hydration.
   *
   * Every field above is initialised from `profile`, which is undefined on the
   * first render whenever the query has no cached data - a cold start, or a
   * driver who opens this screen before GET /driver/me returns.
   *
   * It runs once per profile id and never again, so it cannot overwrite text
   * the driver is typing while a background refetch resolves.
   */
  const hydratedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!profile || hydratedFor.current === profile.id) return;
    hydratedFor.current = profile.id;
    setName(profile.name ?? "");
    setMake(profile.vehicle?.make ?? "");
    setModel(profile.vehicle?.model ?? "");
    setColor(profile.vehicle?.color ?? "");
    setPlate(profile.vehicle?.plate ?? "");
    setYear(profile.vehicle?.year ? String(profile.vehicle.year) : "");
    setFeatures(profile.vehicle?.features ?? []);
    setCityId(profile.cityId ?? null);
  }, [profile]);

  /** Only what actually differs from the loaded profile. */
  const changes = useMemo<UpdateDriverProfileInput>(() => {
    const next: UpdateDriverProfileInput = {};
    const trimmedName = name.trim();
    if (trimmedName && trimmedName !== (profile?.name ?? "")) {
      next.name = trimmedName;
    }

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

    // PHASE 1: the whole list is sent, because the server replaces the array
    // rather than merging it. Sending only the delta would delete the rest.
    if (!sameFeatures(features, vehicle?.features ?? [])) {
      next.carFeatures = features;
    }

    // Phase 8: only cityId travels. wilayaId is deliberately NOT sent - the
    // server derives it from the city, which keeps one source of truth and
    // stops a client from claiming a wilaya it does not belong to.
    if (cityId && cityId !== (profile?.cityId ?? null)) {
      next.cityId = cityId;
    }

    return next;
  }, [name, make, model, color, plate, year, features, cityId, profile, vehicle]);

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

    // Mirror of the server rule: it throws when the resulting vehicle would have
    // no model or no plate. Checking here keeps the driver out of a round trip.
    const touchesVehicle =
      changes.carMake !== undefined ||
      changes.carModel !== undefined ||
      changes.carColor !== undefined ||
      changes.carPlate !== undefined ||
      changes.carYear !== undefined ||
      changes.carFeatures !== undefined;
    if (touchesVehicle && (!model.trim() || !plate.trim())) {
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
        <Text style={styles.heading}>{strings.profile.title}</Text>

        {/* Phase 11 - the photo inside the level frame. Frame, level and trip
            counts all come from GET /driver/me.
            PHASE 1C: same display, now also capturable. */}
        <View style={styles.levelHero}>
          <ProfilePhotoPicker
            avatarUrl={profile?.photoUrl}
            frameUrl={profile?.profileFrameUrl}
            size={112}
            fallback={profile?.name ?? null}
            loading={!profile}
          />
          {profile?.profileLevel ? (
            <Text style={styles.levelText}>
              {LEVEL_LABELS[profile.profileLevel] ?? profile.profileLevel}
            </Text>
          ) : null}
        </View>

        <View style={styles.statsRow}>
          <Stat
            styles={styles}
            label={strings.profile.ratingLabel}
            value={profile ? profile.rating.toFixed(1) : "\u2014"}
          />
          <Stat
            styles={styles}
            label={strings.profile.tripsLabel}
            value={
              profile
                ? String(profile.completedTripsCount ?? profile.totalTrips)
                : "\u2014"
            }
          />
        </View>

        {/* Progress to the next level: both numbers are computed server-side,
            and the row disappears at the top level. */}
        {profile?.nextLevel && profile?.nextLevelAt ? (
          <View style={styles.statsRow}>
            <Stat
              styles={styles}
              label={strings.level.progress}
              value={`${profile.completedTripsCount ?? 0} / ${profile.nextLevelAt}`}
            />
            <Stat
              styles={styles}
              label={strings.level.nextLevel}
              value={LEVEL_LABELS[profile.nextLevel] ?? profile.nextLevel}
            />
          </View>
        ) : null}

        <SectionCard title={strings.profile.identitySection}>
          <InputField
            label={strings.profile.nameLabel}
            placeholder={strings.profile.namePlaceholder}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            maxLength={120}
          />
          <ReadOnlyRow
            styles={styles}
            label={strings.profile.phoneLabel}
            value={profile?.phone ?? "\u2014"}
            hint={strings.profile.phoneLocked}
            ltr
          />
          {/* Phase 8: wilaya picker, fed by GET /geography/public/wilayas */}
          <View style={styles.pickerBlock}>
            <Text style={styles.pickerLabel}>
              {strings.profile.wilayaLabel}
            </Text>
            <Text style={styles.pickerHint}>{strings.profile.wilayaHint}</Text>
            {wilayasQuery.isLoading && (
              <View style={styles.pickerStatus}>
                <ActivityIndicator size="small" color={palette.primary} />
                <Text style={styles.pickerStatusText}>
                  {strings.profile.wilayaLoading}
                </Text>
              </View>
            )}
            {wilayasQuery.isError && (
              <Text style={styles.pickerError}>
                {strings.profile.wilayaFailed}
              </Text>
            )}
            {wilayasQuery.data?.length === 0 && (
              <Text style={styles.pickerHint}>
                {strings.profile.wilayaEmpty}
              </Text>
            )}
            <View style={styles.chipWrap}>
              {(wilayasQuery.data ?? []).map((w) => {
                const selected = w.id === wilayaId;
                return (
                  <Pressable
                    key={w.id}
                    onPress={() => {
                      setWilayaId(w.id);
                      // Changing wilaya invalidates the chosen city.
                      setCityId(null);
                    }}
                    style={[styles.chip, selected && styles.chipSelected]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selected && styles.chipTextSelected,
                      ]}
                    >
                      {w.number + " \u2014 " + w.nameAr}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Phase 8: city picker, only after a wilaya is chosen */}
          <View style={styles.pickerBlock}>
            <Text style={styles.pickerLabel}>{strings.profile.cityLabel}</Text>
            {!wilayaId && (
              <Text style={styles.pickerHint}>
                {profile?.city
                  ? `${profile.city} \u2014 ${strings.profile.citySelectPrompt}`
                  : strings.profile.citySelectPrompt}
              </Text>
            )}
            {wilayaId && citiesQuery.isLoading && (
              <View style={styles.pickerStatus}>
                <ActivityIndicator size="small" color={palette.primary} />
                <Text style={styles.pickerStatusText}>
                  {strings.profile.cityLoading}
                </Text>
              </View>
            )}
            {wilayaId && citiesQuery.data?.length === 0 && (
              <Text style={styles.pickerHint}>{strings.profile.cityEmpty}</Text>
            )}
            <View style={styles.chipWrap}>
              {(citiesQuery.data ?? []).map((c) => {
                const selected = c.id === cityId;
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => setCityId(c.id)}
                    style={[styles.chip, selected && styles.chipSelected]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selected && styles.chipTextSelected,
                      ]}
                    >
                      {c.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </SectionCard>

        <SectionCard
          title={strings.profile.vehicleSection}
          hint={strings.profile.vehicleHint}
          style={styles.section}
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

          {/* PHASE 1: vehicle features. The keys travel, the labels never do. */}
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
            styles={styles}
            label={strings.profile.rideClassLabel}
            value={vehicle?.rideClass ?? strings.profile.rideClassPending}
            hint={strings.profile.rideClassLocked}
          />

          {/* PHASE 1: the review verdict, so a rejected vehicle stops being a
              silent dead end. Both values are read-only server output. */}
          {vehicle?.verificationStatus ? (
            <ReadOnlyRow
              styles={styles}
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

        {/* PHASE 1: optional password. It has its own submit button on purpose:
            it targets POST /auth/password/change, NOT PATCH /driver/me, and a
            failed vehicle save must never lose a typed password. */}
        <PasswordSetupCard />

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

function Stat({
  styles,
  label,
  value,
}: {
  styles: Styles;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ReadOnlyRow({
  styles,
  label,
  value,
  hint,
  ltr = false,
}: {
  styles: Styles;
  label: string;
  value: string;
  hint: string;
  ltr?: boolean;
}) {
  return (
    <View>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.readOnly}>
        <Text style={[styles.readOnlyValue, ltr ? styles.ltr : null]}>
          {value}
        </Text>
      </View>
      <Text style={styles.hint}>{hint}</Text>
    </View>
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
    // Plain "row": mirrored by React Native under RTL.
    statsRow: { flexDirection: "row", gap: spacing.md },
    levelHero: { alignItems: "center", gap: spacing.sm },
    levelText: {
      ...typography.caption,
      color: palette.primaryText,
      textAlign: "center",
    },
    stat: {
      flex: 1,
      backgroundColor: palette.surface,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: palette.border,
      paddingVertical: spacing.lg,
      alignItems: "center",
    },
    statValue: { ...typography.numeric, color: palette.primaryText },
    // Centred inside its own stat tile, so it needs no alignment of its own.
    statLabel: {
      ...typography.caption,
      color: palette.textSecondary,
      marginTop: spacing.xs,
    },
    section: { marginTop: spacing.xs },
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
    pickerError: {
      ...typography.caption,
      color: palette.danger,
      textAlign: textAlignStart(),
    },
    pickerStatus: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    pickerStatusText: {
      ...typography.caption,
      color: palette.textSecondary,
    },
    chipWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs,
      marginTop: spacing.xs,
    },
    chip: {
      // Driver touch floor (56pt), not a normal chip size: picking a wilaya
      // usually happens in the car, and a mis-tap means the wrong city.
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
    fieldLabel: {
      ...typography.caption,
      color: palette.textSecondary,
      marginBottom: spacing.xs,
      textAlign: textAlignStart(),
    },
    readOnly: {
      minHeight: touchTarget.normal,
      justifyContent: "center",
      borderRadius: radius.md,
      backgroundColor: palette.surfaceSunken,
      borderWidth: 1,
      borderColor: palette.border,
      paddingHorizontal: spacing.lg,
    },
    readOnlyValue: {
      ...typography.body,
      color: palette.textSecondary,
      textAlign: textAlignStart(),
    },
    /**
     * Applied by ReadOnlyRow to the phone number - the identity Firebase
     * authenticates, which this form deliberately cannot edit.
     *
     * writingDirection stays "ltr" so the E.164 digits and the leading "+" are
     * not reordered. The alignment is START rather than the old physical
     * "left", because the value has to stay under its own fieldLabel in every
     * language - the same call as SafetyScreen's rowPhone.
     */
    ltr: { textAlign: textAlignStart(), writingDirection: "ltr" },
    hint: {
      ...typography.caption,
      color: palette.textSecondary,
      marginTop: spacing.xs,
      textAlign: textAlignStart(),
    },
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
