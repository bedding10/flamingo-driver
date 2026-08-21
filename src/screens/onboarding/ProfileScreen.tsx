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
import { ReadOnlyRow } from "../../components/ReadOnlyRow";
import { SectionCard } from "../../components/SectionCard";
import { ProfilePhotoPicker } from "../../components/ProfilePhotoPicker";
import { PasswordSetupCard } from "../../components/PasswordSetupCard";
import { textAlignStart } from "../../i18n";
import { strings } from "../../i18n/strings";
import {
  radius,
  spacing,
  touchTarget,
  typography,
  usePalette,
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

/**
 * Driver IDENTITY, saved through PATCH /driver/me.
 *
 * Two deliberate constraints, both dictated by the server:
 *
 * 1. Only CHANGED fields are sent. Sending untouched values is not harmless on
 *    this endpoint - it is how an approved record gets pushed back into review.
 * 2. The phone number is read-only. It is the identity Firebase authenticates,
 *    and PATCH would change it without re-verifying, locking the driver out of
 *    the next login. That rule survives the password feature: the password is a
 *    second door to the SAME phone-owned account, never a way to move the
 *    account to another number.
 *
 * City is NOT read-only. Phase 8 added an authenticated, non-STAFF geography
 * surface (GET /geography/public/wilayas + /cities), so the driver picks a
 * wilaya and then a city from server data. Only cityId is sent; the wilaya is
 * derived server-side from the city, so a client cannot claim a cheaper wilaya
 * to influence pricing.
 *
 * PHASE 1C: the profile photo is NOT part of this form and has no Save button
 * of its own here. It travels through the document upload flow
 * (upload-url -> PUT -> POST /driver/documents), which is a different contract
 * with a different failure mode.
 *
 * PHASE 1 (R-11): the largest direction pass in the audit - three
 * "row-reverse" rows and fifteen text styles. No field, endpoint or validation
 * rule was touched.
 *
 * PHASE 2: the vehicle block moved out to VehicleScreen. Sections 13 and 62 put
 * VEHICLE INFORMATION after DOCUMENTS in the onboarding order, which is not
 * expressible while the vehicle fields live in the screen the driver reaches
 * first. Vehicle make, model, colour, plate, year, features, ride class and the
 * review verdict are all there now, with their own delta and their own save.
 * Nothing was deleted: an approved driver still edits the car through the Menu,
 * which points at the new route.
 */
export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const palette = usePalette();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const { data: profile } = useDriverProfile();
  const mutation = useUpdateDriverProfile();

  const [name, setName] = useState(profile?.name ?? "");
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
   * The fields above are initialised from `profile`, which is undefined on the
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
    setCityId(profile.cityId ?? null);
  }, [profile]);

  /** Only what actually differs from the loaded profile. */
  const changes = useMemo<UpdateDriverProfileInput>(() => {
    const next: UpdateDriverProfileInput = {};
    const trimmedName = name.trim();
    if (trimmedName && trimmedName !== (profile?.name ?? "")) {
      next.name = trimmedName;
    }

    // Phase 8: only cityId travels. wilayaId is deliberately NOT sent - the
    // server derives it from the city, which keeps one source of truth and
    // stops a client from claiming a wilaya it does not belong to.
    if (cityId && cityId !== (profile?.cityId ?? null)) {
      next.cityId = cityId;
    }

    return next;
  }, [name, cityId, profile]);

  const dirty = Object.keys(changes).length > 0;

  const onSave = async () => {
    setError(null);
    setSaved(false);

    if (!dirty) {
      setError(strings.profile.nothingChanged);
      return;
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

        {/* PHASE 1: optional password. It has its own submit button on purpose:
            it targets POST /auth/password/change, NOT PATCH /driver/me, and a
            failed profile save must never lose a typed password. */}
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
