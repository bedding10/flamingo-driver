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
import { useNavigation } from "@react-navigation/native";

import { toApiError } from "../../api/client";
import { AuthProgress } from "../../components/auth/AuthProgress";
import { InputField } from "../../components/InputField";
import { PasswordSetupCard } from "../../components/PasswordSetupCard";
import { ProfilePhotoPicker } from "../../components/ProfilePhotoPicker";
import { ReadOnlyRow } from "../../components/ReadOnlyRow";
import {
  useDriverProfile,
  useUpdateDriverProfile,
} from "../../hooks/useDriverProfile";
import { useCities, useWilayas } from "../../hooks/useGeography";
import { textAlignStart } from "../../i18n";
import { strings } from "../../i18n/strings";
import {
  alpha,
  COLORS,
  RADIUS,
  SEMANTIC,
  SHADOW_CARD,
  SPACING,
  typo,
} from "../../theme/tokens";
import type { UpdateDriverProfileInput } from "../../types/driver";
import { HEADER_HEIGHT, PillButton, StatCard, StickyHeader } from "../../ui";

/** Tailwind `max-w-md`, which is what Stitch centres the card inside. */
const MAX_CARD_WIDTH = 448;

/** Stitch draws the avatar well at `w-24 h-24`; the level frame needs a little
 *  more room, so the picker keeps its 112px hero size. */
const AVATAR = 112;

const CHIP_MIN_HEIGHT = 56;

// Display labels only: the level itself is decided by the backend from
// COMPLETED trips, and no threshold is introduced here.
const LEVEL_LABELS: Record<string, string> = {
  BRONZE: strings.level.bronze,
  SILVER: strings.level.silver,
  GOLD: strings.level.gold,
  DIAMOND: strings.level.diamond,
  LEGENDARY: strings.level.legendary,
};

/**
 * Stitch `basic_info_setup` - driver IDENTITY, saved through PATCH /driver/me.
 *
 * Two deliberate constraints, both dictated by the server:
 *
 * 1. Only CHANGED fields are sent. Sending untouched values is not harmless on
 *    this endpoint - it is how an approved record gets pushed back into review.
 * 2. The phone number is read-only. It is the identity Firebase authenticates,
 *    and PATCH would change it without re-verifying, locking the driver out of
 *    the next login.
 *
 * City is NOT read-only: the driver picks a wilaya and then a city from server
 * data. Only cityId is sent, because the server derives the wilaya from the
 * city, so a client cannot claim a cheaper wilaya to influence pricing.
 *
 * The profile photo is NOT part of this form and has no Save button of its own
 * here: it travels through the document upload flow, a different contract with a
 * different failure mode.
 *
 * REBUILT ON THE REFERENCE: one rounded-24 card carrying the 1-of-3 progress
 * bar, the avatar well, the fields and the pill action - not the previous stack
 * of section cards. The reference's plain city <select> is a chip grid here,
 * because the option list comes from the geography endpoints at runtime and a
 * native picker cannot show a wilaya number beside its Arabic name.
 *
 * STILL ON THE OLD PALETTE, TRACKED: InputField, ReadOnlyRow,
 * ProfilePhotoPicker and PasswordSetupCard. They are shared with the vehicle,
 * documents and wallet screens, so they migrate with those screens rather than
 * being forked here.
 */
export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { data: profile } = useDriverProfile();
  const mutation = useUpdateDriverProfile();

  const [name, setName] = useState(profile?.name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [wilayaId, setWilayaId] = useState<string | null>(null);
  const [cityId, setCityId] = useState<string | null>(profile?.cityId ?? null);
  const wilayasQuery = useWilayas();
  const citiesQuery = useCities(wilayaId);

  /**
   * One-shot hydration. The fields above are initialised from `profile`, which
   * is undefined on the first render whenever the query has no cached data. It
   * runs once per profile id and never again, so it cannot overwrite text the
   * driver is typing while a background refetch resolves.
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
    // Only cityId travels. wilayaId is deliberately NOT sent.
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
          {
            paddingTop: insets.top + HEADER_HEIGHT + SPACING.lg,
            paddingBottom: insets.bottom + SPACING.xxl,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* `overflow: hidden` is required: the progress bar is absolutely
            positioned at top 0 and its square ends would cross this radius. */}
        <View style={[styles.card, SHADOW_CARD]}>
          <AuthProgress step={1} variant="bar" />

          <Text style={styles.title}>{strings.profile.title}</Text>

          {/* The photo inside the level frame. Frame, level and trip counts all
              come from GET /driver/me. */}
          <View style={styles.avatarBlock}>
            <ProfilePhotoPicker
              avatarUrl={profile?.photoUrl}
              frameUrl={profile?.profileFrameUrl}
              size={AVATAR}
              fallback={profile?.name ?? null}
              loading={!profile}
            />
            {profile?.profileLevel ? (
              <Text style={styles.levelText}>
                {LEVEL_LABELS[profile.profileLevel] ?? profile.profileLevel}
              </Text>
            ) : null}
          </View>

          {/* Plain "row": React Native mirrors it under RTL. */}
          <View style={styles.statsRow}>
            <StatCard
              label={strings.profile.ratingLabel}
              value={profile ? profile.rating.toFixed(1) : "\u2014"}
              icon="star"
              flex={1}
            />
            <StatCard
              label={strings.profile.tripsLabel}
              value={
                profile
                  ? String(profile.completedTripsCount ?? profile.totalTrips)
                  : "\u2014"
              }
              flex={1}
            />
          </View>

          {/* Progress to the next level: both numbers are computed server-side,
              and the row disappears at the top level. */}
          {profile?.nextLevel && profile?.nextLevelAt ? (
            <View style={styles.statsRow}>
              <StatCard
                label={strings.level.progress}
                value={`${profile.completedTripsCount ?? 0} / ${profile.nextLevelAt}`}
                flex={1}
              />
              <StatCard
                label={strings.level.nextLevel}
                value={LEVEL_LABELS[profile.nextLevel] ?? profile.nextLevel}
                flex={1}
              />
            </View>
          ) : null}

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

          {/* Wilaya picker, fed by GET /geography/public/wilayas */}
          <View style={styles.pickerBlock}>
            <Text style={styles.pickerLabel}>
              {strings.profile.wilayaLabel}
            </Text>
            <Text style={styles.pickerHint}>{strings.profile.wilayaHint}</Text>
            {wilayasQuery.isLoading && (
              <View style={styles.pickerStatus}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.pickerHint}>
                  {strings.profile.wilayaLoading}
                </Text>
              </View>
            )}
            {wilayasQuery.isError && (
              <Text style={styles.error}>{strings.profile.wilayaFailed}</Text>
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

          {/* City picker, only after a wilaya is chosen */}
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
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.pickerHint}>
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

          {/* Optional password. It has its own submit button on purpose: it
              targets POST /auth/password/change, NOT PATCH /driver/me, and a
              failed profile save must never lose a typed password. */}
          <PasswordSetupCard />

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

      {/* Rendered LAST so it paints over the scrolling content. */}
      <StickyHeader
        onBackPress={navigation.canGoBack() ? navigation.goBack : undefined}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  content: {
    paddingHorizontal: SPACING.gutter,
    alignItems: "center",
  },
  card: {
    width: "100%",
    maxWidth: MAX_CARD_WIDTH,
    borderRadius: RADIUS.card,
    backgroundColor: COLORS.surfaceContainer,
    borderWidth: 1,
    borderColor: alpha(COLORS.surfaceVariant, 0.3),
    padding: SPACING.xl,
    paddingTop: SPACING.xxl,
    gap: SPACING.lg,
    overflow: "hidden",
  },
  title: {
    ...typo("headlineLgMobile"),
    color: COLORS.onSurface,
    textAlign: "center",
  },
  avatarBlock: { alignItems: "center", gap: SPACING.sm },
  levelText: { ...typo("labelMd"), color: COLORS.primary, textAlign: "center" },
  statsRow: { flexDirection: "row", gap: SPACING.md },
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
  pickerStatus: { flexDirection: "row", alignItems: "center", gap: SPACING.xs },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  chip: {
    // Driver touch floor, not a normal chip size: picking a wilaya usually
    // happens in the car, and a mis-tap means the wrong city.
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
  error: {
    ...typo("labelMd"),
    color: COLORS.error,
    textAlign: textAlignStart(),
  },
  success: {
    ...typo("labelMd"),
    color: SEMANTIC.success,
    textAlign: textAlignStart(),
  },
  save: { marginTop: SPACING.sm },
});
