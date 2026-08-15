import React, { useEffect, useMemo, useState } from "react";
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
import { ProfileAvatar } from "../../components/ProfileAvatar";
import { strings } from "../../i18n/strings";
import {
  colors,
  radius,
  spacing,
  touchTarget,
  typography,
  withAlpha,
} from "../../theme";
import {
  useDriverProfile,
  useUpdateDriverProfile,
} from "../../hooks/useDriverProfile";
import { useCities, useWilayas } from "../../hooks/useGeography";
import { toApiError } from "../../api/client";
import type { UpdateDriverProfileInput } from "../../types/driver";

/**
 * Driver identity + active vehicle, saved in a single PATCH /driver/me.
 *
 * Four deliberate constraints, all dictated by the server:
 *
 * 1. Only CHANGED fields are sent. The server resets the vehicle verification to
 *    PENDING whenever an identity field (make / model / plate / year) differs, so
 *    re-sending untouched values would invalidate an approved vehicle.
 * 2. The phone number is read-only. It is the identity Firebase authenticates,
 *    and PATCH would change it without re-verifying, locking the driver out of
 *    the next login.
 * 3. Vehicle type is read-only. Its catalogue still lives behind a STAFF-only
 *    endpoint, so this app cannot list it and will not invent a picker over
 *    data it cannot read.
 *    City is no longer read-only. Phase 8 added an authenticated, non-STAFF
 *    geography surface (GET /geography/public/wilayas + /cities), so the driver
 *    now picks a wilaya and then a city from server data. The list is never
 *    hardcoded here: the official division went 48 → 58 → 69, and a copy baked
 *    into a shipped binary cannot be fixed without a store release.
 *    Only cityId is sent; the wilaya is derived server-side from the city, so a
 *    client cannot claim a cheaper wilaya to influence pricing.
 * 4. Service class (rideClass) is read-only too, for a different reason: staff
 *    assign it during vehicle review, on purpose, so a driver cannot quietly
 *    relabel an approved van as "economy" to pick up more offers. The server
 *    no longer accepts rideClass on this endpoint at all.
 */
export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { data: profile } = useDriverProfile();
  const mutation = useUpdateDriverProfile();

  const vehicle = profile?.vehicle ?? null;

  const [name, setName] = useState(profile?.name ?? "");
  const [make, setMake] = useState(vehicle?.make ?? "");
  const [model, setModel] = useState(vehicle?.model ?? "");
  const [color, setColor] = useState(vehicle?.color ?? "");
  const [plate, setPlate] = useState(vehicle?.plate ?? "");
  const [year, setYear] = useState(vehicle?.year ? String(vehicle.year) : "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // — Phase 8: wilaya → city selection, both from the backend —
  const [wilayaId, setWilayaId] = useState<string | null>(null);
  const [cityId, setCityId] = useState<string | null>(profile?.cityId ?? null);
  const wilayasQuery = useWilayas();
  const citiesQuery = useCities(wilayaId);

  /**
   * The profile carries cityId but not wilayaId, so on first load we locate the
   * driver's existing city inside the fetched wilayas to preselect the parent.
   * Doing it here rather than server-side keeps the profile payload unchanged.
   */
  useEffect(() => {
    if (profile?.cityId && cityId === null) setCityId(profile.cityId);
  }, [profile?.cityId, cityId]);

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

    // Phase 8: only cityId travels. wilayaId is deliberately NOT sent — the
    // server derives it from the city, which keeps one source of truth and
    // stops a client from claiming a wilaya it does not belong to.
    if (cityId && cityId !== (profile?.cityId ?? null)) {
      next.cityId = cityId;
    }

    return next;
  }, [name, make, model, color, plate, year, cityId, profile, vehicle]);

  const dirty = Object.keys(changes).length > 0;

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
      changes.carYear !== undefined;
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

        {/* المرحلة 11: الصورة داخل إطار المستوى. الإطار والمستوى وعدد
            الرحلات تأتي كلها من GET /driver/me. */}
        <View style={styles.levelHero}>
          <ProfileAvatar
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
            label={strings.profile.ratingLabel}
            value={profile ? profile.rating.toFixed(1) : "—"}
          />
          <Stat
            label={strings.profile.tripsLabel}
            value={
              profile
                ? String(profile.completedTripsCount ?? profile.totalTrips)
                : "—"
            }
          />
        </View>

        {/* التقدم نحو المستوى التالي: القيم محسوبة في الخادم، ويختفي السطر
            عند أعلى مستوى حتى لا يزدحم التصميم. */}
        {profile?.nextLevel && profile?.nextLevelAt ? (
          <View style={styles.statsRow}>
            <Stat
              label={strings.level.progress}
              value={`${profile.completedTripsCount ?? 0} / ${profile.nextLevelAt}`}
            />
            <Stat
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
            label={strings.profile.phoneLabel}
            value={profile?.phone ?? "—"}
            hint={strings.profile.phoneLocked}
            ltr
          />
          {/* Phase 8: wilaya picker, fed by GET /geography/public/wilayas */}
          <View style={styles.pickerBlock}>
            <Text style={styles.pickerLabel}>
              {strings.profile.wilayaLabel}
            </Text>
            <Text style={styles.pickerHint}>
              {strings.profile.wilayaHint}
            </Text>
            {wilayasQuery.isLoading && (
              <View style={styles.pickerStatus}>
                <ActivityIndicator size="small" color={colors.primary} />
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
                      {w.number} — {w.nameAr}
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
                  ? `${profile.city} — ${strings.profile.citySelectPrompt}`
                  : strings.profile.citySelectPrompt}
              </Text>
            )}
            {wilayaId && citiesQuery.isLoading && (
              <View style={styles.pickerStatus}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.pickerStatusText}>
                  {strings.profile.cityLoading}
                </Text>
              </View>
            )}
            {wilayaId && citiesQuery.data?.length === 0 && (
              <Text style={styles.pickerHint}>
                {strings.profile.cityEmpty}
              </Text>
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

          <ReadOnlyRow
            label={strings.profile.rideClassLabel}
            value={vehicle?.rideClass ?? strings.profile.rideClassPending}
            hint={strings.profile.rideClassLocked}
          />
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ReadOnlyRow({
  label,
  value,
  hint,
  ltr = false,
}: {
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  content: { paddingHorizontal: spacing.xl, gap: spacing.lg },
  heading: {
    ...typography.title,
    color: colors.textOnDark,
    textAlign: "right",
    writingDirection: "rtl",
  },
  statsRow: { flexDirection: "row-reverse", gap: spacing.md },
  // المرحلة 11: منطقة الصورة والمستوى.
  levelHero: { alignItems: "center", gap: spacing.sm },
  levelText: {
    ...typography.caption,
    color: colors.gold,
    textAlign: "center",
  },
  stat: {
    flex: 1,
    backgroundColor: colors.surfaceDark,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  statValue: { ...typography.numeric, color: colors.gold },
  statLabel: {
    ...typography.caption,
    color: colors.textOnDarkSecondary,
    marginTop: spacing.xs,
    writingDirection: "rtl",
  },
  section: { marginTop: spacing.xs },
  // — Phase 8: wilaya / city pickers —
  pickerBlock: { gap: spacing.xs },
  pickerLabel: {
    ...typography.caption,
    color: colors.textOnDarkSecondary,
    textAlign: "right",
    writingDirection: "rtl",
  },
  pickerHint: {
    ...typography.caption,
    color: colors.textOnDarkSecondary,
    textAlign: "right",
    writingDirection: "rtl",
  },
  pickerError: {
    ...typography.caption,
    color: colors.danger,
    textAlign: "right",
    writingDirection: "rtl",
  },
  pickerStatus: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: spacing.xs,
  },
  pickerStatusText: {
    ...typography.caption,
    color: colors.textOnDarkSecondary,
    writingDirection: "rtl",
  },
  chipWrap: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  chip: {
    // أرضية لمس السائق (56pt) وليس حجم رقاقة عادية: اختيار الولاية يحدث
    // غالبًا في السيارة، وخطأ في اللمس يعني مدينة خاطئة في الملف الشخصي.
    minHeight: touchTarget.normal,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: withAlpha(colors.offWhite, 0.06),
  },
  chipSelected: {
    borderColor: colors.gold,
    backgroundColor: withAlpha(colors.gold, 0.16),
  },
  chipText: {
    ...typography.caption,
    color: colors.textOnDarkSecondary,
    writingDirection: "rtl",
  },
  chipTextSelected: { color: colors.gold },
  fieldLabel: {
    ...typography.caption,
    color: colors.textOnDarkSecondary,
    marginBottom: spacing.xs,
    textAlign: "right",
    writingDirection: "rtl",
  },
  readOnly: {
    minHeight: touchTarget.normal,
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: withAlpha(colors.offWhite, 0.06),
    borderWidth: 1,
    borderColor: colors.divider,
    paddingHorizontal: spacing.lg,
  },
  readOnlyValue: {
    ...typography.body,
    color: colors.textOnDarkSecondary,
    textAlign: "right",
    writingDirection: "rtl",
  },
  ltr: { textAlign: "left", writingDirection: "ltr" },
  hint: {
    ...typography.caption,
    color: colors.textOnDarkSecondary,
    marginTop: spacing.xs,
    textAlign: "right",
    writingDirection: "rtl",
  },
  error: {
    ...typography.body,
    color: colors.danger,
    textAlign: "right",
    writingDirection: "rtl",
  },
  success: {
    ...typography.body,
    color: colors.online,
    textAlign: "right",
    writingDirection: "rtl",
  },
  save: { marginTop: spacing.sm },
});
