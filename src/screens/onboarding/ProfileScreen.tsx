import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
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

import { authApi } from "../../api";
import { toApiError } from "../../api/client";
import { AuthProgress } from "../../components/auth/AuthProgress";
import { InputField } from "../../components/InputField";
import { ProfilePhotoPicker } from "../../components/ProfilePhotoPicker";
import { ReadOnlyRow } from "../../components/ReadOnlyRow";
import {
  useDriverProfile,
  useUpdateDriverProfile,
} from "../../hooks/useDriverProfile";
import { useCities, useWilayas } from "../../hooks/useGeography";
import { textAlignStart } from "../../i18n";
import { strings } from "../../i18n/strings";
import { pw } from "../../i18n/strings.password";
import type { OnboardingStackParamList } from "../../navigation/types";
import { alpha, RADIUS, SPACING, typo } from "../../theme/tokens";
import { useTokens, type Tokens } from "../../theme/useTokens";
import type { UpdateDriverProfileInput } from "../../types/driver";
import { HEADER_HEIGHT, PillButton, StickyHeader } from "../../ui";

/** Tailwind `max-w-md`, which is what Stitch centres the card inside. */
const MAX_CARD_WIDTH = 448;

/** Stitch draws the avatar well at `w-24 h-24`. */
const AVATAR = 112;

const CHIP_MIN_HEIGHT = 56;

/** Mirrors ChangePasswordDto on the server: MinLength(6), MaxLength(72). */
const MIN_PASSWORD = 6;
const MAX_PASSWORD = 72;

/**
 * A 16% pink wash reads on #101415 but nearly disappears on the light #fff8f8
 * card, so the light scheme fills harder.
 */
const CHIP_WASH = { dark: 0.16, light: 0.22 } as const;

/**
 * Local Arabic copy for this step only. Kept here rather than added to
 * src/i18n/strings.ts, which must not be rewritten.
 */
const COPY = {
  title:
    "\u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0627\u0644\u0623\u0633\u0627\u0633\u064a\u0629",
  subtitle:
    "\u064a\u0631\u062c\u0649 \u0625\u062f\u062e\u0627\u0644 \u062a\u0641\u0627\u0635\u064a\u0644 \u062d\u0633\u0627\u0628\u0643 \u0644\u0644\u0645\u062a\u0627\u0628\u0639\u0629.",
  continueToDocuments:
    "\u0645\u062a\u0627\u0628\u0639\u0629 \u0625\u0644\u0649 \u0627\u0644\u0648\u062b\u0627\u0626\u0642",
  photoRequired:
    "\u0623\u0636\u0641 \u0635\u0648\u0631\u0629 \u0634\u062e\u0635\u064a\u0629 \u0623\u0648\u0644\u0627\u064b",
  nameRequired:
    "\u0623\u062f\u062e\u0644 \u0627\u0633\u0645\u0643 \u0627\u0644\u0643\u0627\u0645\u0644",
} as const;

/**
 * STEP 3 OF REGISTRATION - Stitch `basic_info_setup`.
 *
 * phone -> OTP -> THIS SCREEN -> documents -> vehicle -> review.
 *
 * What it collects, in the reference's order: the profile photo, the full name,
 * the ACCOUNT PASSWORD in the field under the name, then the city. There is no
 * email field: the driver record on the server has no email, and a form that
 * asks for one would be asking for something nothing can store.
 *
 * Two server contracts are honoured here:
 *
 * 1. PATCH /driver/me receives only CHANGED fields. Re-sending untouched values
 *    is how an approved record gets pushed back into review.
 * 2. Only cityId travels. The server derives the wilaya from the city, so a
 *    client cannot claim a cheaper wilaya to influence pricing.
 *
 * The phone number is read-only: it is the identity Firebase authenticated, and
 * PATCHing it would change the login without re-verifying it.
 *
 * ONE BUTTON, TWO CALLS, FIXED ORDER: profile first, password second, then
 * navigation. The password targets POST /auth/password/change, a different
 * endpoint with a different failure mode, so if it fails the saved profile is
 * kept and the error names the password rather than losing the whole step.
 *
 * The photo travels through the document pipeline as DocumentType.PROFILE_PHOTO
 * (an existing server value) and is stored PENDING, which is why the picker
 * still says staff review it.
 *
 * NOT BUILT HERE: rating, trip count and level. A driver at step 3 has no
 * reputation; those live on driver_profile_hub.
 */
export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { data: profile } = useDriverProfile();
  const mutation = useUpdateDriverProfile();
  const t = useTokens();
  const styles = useMemo(() => makeStyles(t), [t]);

  const [name, setName] = useState(profile?.name ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [wilayaId, setWilayaId] = useState<string | null>(null);
  const [cityId, setCityId] = useState<string | null>(profile?.cityId ?? null);
  const wilayasQuery = useWilayas();
  const citiesQuery = useCities(wilayaId);

  /**
   * One-shot hydration, once per profile id: a background refetch must not
   * overwrite a name the driver is halfway through typing.
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

  const submit = async () => {
    setError(null);

    if (!profile?.photoUrl) {
      setError(COPY.photoRequired);
      return;
    }
    if (!name.trim()) {
      setError(COPY.nameRequired);
      return;
    }
    if (password.length < MIN_PASSWORD) {
      setError(pw.setup.tooShort);
      return;
    }
    if (password.length > MAX_PASSWORD) {
      setError(pw.setup.tooLong);
      return;
    }
    if (password !== confirm) {
      setError(pw.setup.mismatch);
      return;
    }
    if (!cityId && !profile?.cityId) {
      setError(strings.profile.citySelectPrompt);
      return;
    }

    setBusy(true);
    try {
      // 1. Identity. Skipped entirely when nothing changed, so a driver who
      //    comes back to fix only the password does not re-open their review.
      if (Object.keys(changes).length > 0) {
        await mutation.mutateAsync(changes);
      }

      // 2. Password. A phone-authenticated account has no hash yet, so no
      //    current password is sent - `undefined` is what the server reads as
      //    "first time", while an empty string would read as a wrong secret.
      await authApi.setPassword({ newPassword: password });

      // 3. Next step of the file, never the review screen.
      navigation.navigate("Documents");
    } catch (saveError) {
      const apiError = toApiError(saveError);
      setError(
        apiError.offline
          ? strings.errors.network
          : apiError.message || pw.setup.failed,
      );
    } finally {
      setBusy(false);
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
        <View style={[styles.card, t.shadowCard]}>
          <AuthProgress step={1} variant="bar" />

          <Text style={styles.title}>{COPY.title}</Text>
          <Text style={styles.subtitle}>{COPY.subtitle}</Text>

          {/* Camera or gallery. The upload happens immediately and lands as a
              PENDING PROFILE_PHOTO document. */}
          <View style={styles.avatarBlock}>
            <ProfilePhotoPicker
              avatarUrl={profile?.photoUrl}
              frameUrl={profile?.profileFrameUrl}
              size={AVATAR}
              fallback={profile?.name ?? null}
              loading={!profile}
            />
          </View>

          <InputField
            label={strings.profile.nameLabel}
            placeholder={strings.profile.namePlaceholder}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            editable={!busy}
            maxLength={120}
          />

          {/* The field UNDER the name is the account password - not an email.
              It is what POST /auth/login will accept later, alongside the same
              phone number. */}
          <InputField
            label={pw.setup.newLabel}
            placeholder={pw.setup.placeholder}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="newPassword"
            editable={!busy}
            maxLength={MAX_PASSWORD}
          />
          <InputField
            label={pw.setup.confirmLabel}
            placeholder={pw.setup.placeholder}
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            editable={!busy}
            maxLength={MAX_PASSWORD}
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
                <ActivityIndicator size="small" color={t.colors.primary} />
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
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
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

          {/* City picker, only after a wilaya is chosen. Server data only. */}
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
                <ActivityIndicator size="small" color={t.colors.primary} />
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
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
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

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PillButton
            label={COPY.continueToDocuments}
            trailingIcon="arrow-forward"
            onPress={() => void submit()}
            loading={busy || mutation.isPending}
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

function makeStyles(t: Tokens) {
  const light = t.mode === "light";
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: t.colors.background },
    content: {
      paddingHorizontal: SPACING.gutter,
      alignItems: "center",
    },
    card: {
      width: "100%",
      maxWidth: MAX_CARD_WIDTH,
      borderRadius: RADIUS.card,
      backgroundColor: t.colors.surfaceContainer,
      borderWidth: 1,
      // A 30% surface-variant hairline is invisible against the light card;
      // outlineVariant is the role that actually reads in both schemes.
      borderColor: light
        ? t.colors.outlineVariant
        : alpha(t.colors.surfaceVariant, 0.3),
      padding: SPACING.xl,
      paddingTop: SPACING.xxl,
      gap: SPACING.lg,
      overflow: "hidden",
    },
    title: {
      ...typo("headlineLgMobile"),
      color: t.colors.onSurface,
      textAlign: "center",
    },
    subtitle: {
      ...typo("bodyMd"),
      color: t.colors.onSurfaceVariant,
      textAlign: "center",
    },
    avatarBlock: { alignItems: "center", gap: SPACING.sm },
    pickerBlock: { gap: SPACING.xs },
    pickerLabel: {
      ...typo("labelMd"),
      color: t.colors.onSurface,
      textAlign: textAlignStart(),
    },
    pickerHint: {
      ...typo("labelSm"),
      color: t.colors.onSurfaceVariant,
      textAlign: textAlignStart(),
    },
    pickerStatus: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.xs,
    },
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
      borderColor: t.colors.outlineVariant,
      backgroundColor: t.colors.surface,
    },
    chipSelected: {
      // #ff4d8d as a BORDER fails contrast on the light card, so the light
      // scheme borders with the primary role instead.
      borderColor: light ? t.colors.primary : t.colors.primaryContainer,
      backgroundColor: alpha(
        t.colors.primaryContainer,
        CHIP_WASH[light ? "light" : "dark"],
      ),
    },
    chipText: { ...typo("labelSm"), color: t.colors.onSurfaceVariant },
    chipTextSelected: { color: t.colors.primary },
    error: {
      ...typo("labelMd"),
      color: t.colors.error,
      textAlign: textAlignStart(),
    },
    save: { marginTop: SPACING.sm },
  });
}
