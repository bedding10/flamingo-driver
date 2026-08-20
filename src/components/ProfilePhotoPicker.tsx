import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ProfileAvatar } from "./ProfileAvatar";
import { useDocumentUpload } from "../hooks/useDocumentUpload";
import { photoStrings } from "../i18n/strings.photo";
import {
  radius,
  spacing,
  touchTarget,
  typography,
  usePalette,
  type Palette,
} from "../theme";

export type ProfilePhotoPickerProps = {
  avatarUrl?: string | null;
  frameUrl?: string | null;
  fallback?: string | null;
  loading?: boolean;
  size?: number;
};

/**
 * PHASE 1C - the driver's own photo, captured or picked, then uploaded to R2.
 *
 * Deliberate choices, all forced by what the server actually does:
 *
 * 1. It reuses `useDocumentUpload`, which already performs the exact three-step
 *    flow the backend expects: POST /driver/upload-url -> PUT to the signed URL
 *    -> POST /driver/documents.
 * 2. The type is PROFILE_PHOTO, a value that already exists in DOC_TYPES on the
 *    server. No new document type, no new endpoint.
 * 3. No dates are sent. `documentNeedsDates` says a photo has none, and this
 *    component must never invent an expiry, because an expired document blocks
 *    the driver.
 * 4. The uploaded photo appears immediately, but it is created as PENDING, so
 *    the caption says plainly that staff still review it.
 * 5. The frame is still whatever the server sent. This component decides no
 *    level and knows no threshold.
 *
 * PHASE 1 (R-11): two `"row-reverse"` rows and six text styles carrying
 * `writingDirection: "rtl"`. The rows are now plain `"row"`. The four centred
 * captions keep `textAlign: "center"` and simply lose the writing direction -
 * centred text has no side to resolve, so there is nothing to mirror.
 */
export function ProfilePhotoPicker({
  avatarUrl,
  frameUrl,
  fallback,
  loading = false,
  size = 112,
}: ProfilePhotoPickerProps) {
  const palette = usePalette();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const { submit, pending, error, clearError } = useDocumentUpload();
  const [done, setDone] = useState(false);
  const busy = pending === "PROFILE_PHOTO";

  const pick = async (source: "camera" | "library") => {
    clearError();
    setDone(false);
    const ok = await submit("PROFILE_PHOTO", source);
    if (ok) setDone(true);
  };

  return (
    <View style={styles.root}>
      <ProfileAvatar
        avatarUrl={avatarUrl}
        frameUrl={frameUrl}
        size={size}
        fallback={fallback}
        loading={loading || busy}
        accessibilityLabel={photoStrings.title}
      />

      <Text style={styles.hint}>{photoStrings.hint}</Text>

      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={() => void pick("camera")}
          style={[styles.button, busy && styles.buttonDisabled]}
        >
          <Text style={styles.buttonText}>{photoStrings.camera}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={() => void pick("library")}
          style={[styles.button, busy && styles.buttonDisabled]}
        >
          <Text style={styles.buttonText}>
            {avatarUrl ? photoStrings.replace : photoStrings.library}
          </Text>
        </Pressable>
      </View>

      {busy ? (
        <View style={styles.status}>
          <ActivityIndicator size="small" color={palette.primary} />
          <Text style={styles.statusText}>{photoStrings.uploading}</Text>
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {done && !error ? (
        <Text style={styles.success}>{photoStrings.uploaded}</Text>
      ) : null}

      <Text style={styles.review}>{photoStrings.review}</Text>
    </View>
  );
}

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    root: { alignItems: "center", gap: spacing.sm },
    // Plain "row": mirrored by React Native under RTL.
    row: { flexDirection: "row", gap: spacing.sm },
    button: {
      minHeight: touchTarget.normal,
      justifyContent: "center",
      paddingHorizontal: spacing.lg,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.surfaceSunken,
    },
    buttonDisabled: { opacity: 0.5 },
    buttonText: {
      ...typography.caption,
      color: palette.primaryText,
    },
    status: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    statusText: {
      ...typography.caption,
      color: palette.textSecondary,
    },
    // Centred captions: nothing to mirror, so they keep "center".
    hint: {
      ...typography.caption,
      color: palette.textSecondary,
      textAlign: "center",
    },
    review: {
      ...typography.caption,
      color: palette.textSecondary,
      textAlign: "center",
    },
    error: {
      ...typography.caption,
      color: palette.danger,
      textAlign: "center",
    },
    success: {
      ...typography.caption,
      color: palette.online,
      textAlign: "center",
    },
  });
