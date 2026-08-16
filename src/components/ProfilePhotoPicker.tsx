import React, { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { ProfileAvatar } from "./ProfileAvatar";
import { useDocumentUpload } from "../hooks/useDocumentUpload";
import { photoStrings } from "../i18n/strings.photo";
import {
  colors,
  radius,
  spacing,
  touchTarget,
  typography,
  withAlpha,
} from "../theme";

export type ProfilePhotoPickerProps = {
  avatarUrl?: string | null;
  frameUrl?: string | null;
  fallback?: string | null;
  loading?: boolean;
  size?: number;
};

/**
 * PHASE 1C — the driver's own photo, captured or picked, then uploaded to R2.
 *
 * Deliberate choices, all forced by what the server actually does:
 *
 * 1. It reuses `useDocumentUpload`, which already performs the exact three-step
 *    flow the backend expects: POST /driver/upload-url → PUT to the signed URL
 *    → POST /driver/documents. Writing a second upload path here would be a
 *    duplicate that drifts the first time the object key format changes.
 * 2. The type is PROFILE_PHOTO, a value that already exists in DOC_TYPES on the
 *    server. No new document type, no new endpoint.
 * 3. No dates are sent. `documentNeedsDates` says a photo has none, and this
 *    component must never invent an expiry, because an expired document blocks
 *    the driver.
 * 4. The uploaded photo appears immediately: GET /driver/me falls back to the
 *    latest PROFILE_PHOTO document when `user.avatarUrl` is still null. It is
 *    nevertheless created as PENDING, so the caption says plainly that staff
 *    still review it — the app never presents an upload as an approval.
 * 5. The frame is still whatever the server sent. This component decides no
 *    level and knows no threshold.
 */
export function ProfilePhotoPicker({
  avatarUrl,
  frameUrl,
  fallback,
  loading = false,
  size = 112,
}: ProfilePhotoPickerProps) {
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
          <ActivityIndicator size="small" color={colors.gold} />
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

const styles = StyleSheet.create({
  root: { alignItems: "center", gap: spacing.sm },
  row: { flexDirection: "row-reverse", gap: spacing.sm },
  button: {
    minHeight: touchTarget.normal,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: withAlpha(colors.offWhite, 0.06),
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: {
    ...typography.caption,
    color: colors.gold,
    writingDirection: "rtl",
  },
  status: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: spacing.xs,
  },
  statusText: {
    ...typography.caption,
    color: colors.textOnDarkSecondary,
    writingDirection: "rtl",
  },
  hint: {
    ...typography.caption,
    color: colors.textOnDarkSecondary,
    textAlign: "center",
    writingDirection: "rtl",
  },
  review: {
    ...typography.caption,
    color: colors.textOnDarkSecondary,
    textAlign: "center",
    writingDirection: "rtl",
  },
  error: {
    ...typography.caption,
    color: colors.danger,
    textAlign: "center",
    writingDirection: "rtl",
  },
  success: {
    ...typography.caption,
    color: colors.online,
    textAlign: "center",
    writingDirection: "rtl",
  },
});
