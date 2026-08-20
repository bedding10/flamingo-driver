import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PrimaryButton } from "./PrimaryButton";
import { showToast } from "./Toast";
import { tripShareApi } from "../api";
import {
  SHARE_TTL_CHOICES,
  type ActiveTripShare,
  type ShareTtlMinutes,
} from "../api/tripShare.api";
import { textAlignStart } from "../i18n";
import { shareStrings } from "../i18n/strings.phase7";
import { formatDateTime } from "../utils/datetime";
import {
  radius,
  shadows,
  spacing,
  touchTarget,
  typography,
  usePalette,
  withAlpha,
  type Palette,
} from "../theme";

/**
 * PHASE 7 - the trip sharing sheet.
 *
 * It is a Modal rather than a screen because sharing is something a driver does
 * DURING a trip, from the map, without leaving it: pushing a route would hide
 * the road and the trip card behind a full page.
 *
 * The link is created only when the driver presses the button, never on open:
 * every creation writes a row and mints a token, so opening the sheet to read
 * what it does must not leave links behind.
 *
 * NOTE (carried, unchanged this round): the public follow page itself is a
 * Dashboard + PUBLIC_SHARE_BASE_URL task and is still open. Nothing here works
 * around that on the client.
 *
 * PHASE 1 (R-11): the chip row and the active-link row were `"row-reverse"` and
 * seven text styles were pinned to `textAlign: "right"` with
 * `writingDirection: "rtl"`. Both rows are now plain `"row"` so React Native
 * mirrors them, and the text resolves its own alignment. The chip labels are
 * centred inside their pills, so they only lose the writing direction.
 */
export function TripShareSheet({
  visible,
  tripId,
  onClose,
}: {
  visible: boolean;
  /** Null when there is no running trip; the sheet then only explains why. */
  tripId: string | null;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const palette = usePalette();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const [ttl, setTtl] = useState<ShareTtlMinutes>(60);
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState<ActiveTripShare[] | null>(null);

  const loadActive = useCallback(async () => {
    if (!tripId) return;
    try {
      setActive(await tripShareApi.listTripShares(tripId));
    } catch {
      // A failed listing must not block the driver from creating a new link.
      setActive([]);
    }
  }, [tripId]);

  useEffect(() => {
    if (visible) void loadActive();
  }, [visible, loadActive]);

  const create = useCallback(async () => {
    if (!tripId || busy) return;
    setBusy(true);
    try {
      const created = await tripShareApi.createTripShare(tripId, ttl);
      // The raw token exists only in this response, so it goes straight out.
      await Share.share({
        message: shareStrings.shareMessage + " " + created.url,
      });
      showToast(shareStrings.created, "success");
      await loadActive();
    } catch {
      showToast(shareStrings.failed, "error");
    } finally {
      setBusy(false);
    }
  }, [busy, loadActive, tripId, ttl]);

  const revoke = useCallback(
    async (id: string) => {
      try {
        await tripShareApi.revokeTripShare(id);
        showToast(shareStrings.revoked, "success");
        await loadActive();
      } catch {
        showToast(shareStrings.revokeFailed, "error");
      }
    },
    [loadActive],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.scrim} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.xl }]}>
        <View style={styles.handle} />
        <Text style={styles.title}>{shareStrings.title}</Text>

        <ScrollView contentContainerStyle={styles.body}>
          <Text style={styles.text}>{shareStrings.body}</Text>
          <Text style={styles.privacy}>{shareStrings.privacy}</Text>

          {tripId ? (
            <>
              <Text style={styles.sectionLabel}>
                {shareStrings.durationLabel}
              </Text>
              <View style={styles.chips}>
                {SHARE_TTL_CHOICES.map((choice) => {
                  const selected = choice === ttl;
                  return (
                    <Pressable
                      key={choice}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      onPress={() => setTtl(choice)}
                      style={[styles.chip, selected ? styles.chipOn : null]}
                    >
                      <Text
                        style={[
                          styles.chipLabel,
                          selected ? styles.chipLabelOn : null,
                        ]}
                      >
                        {choice >= 60
                          ? String(choice / 60) + " " + shareStrings.hours
                          : String(choice) + " " + shareStrings.minutes}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <PrimaryButton
                label={shareStrings.submit}
                loading={busy}
                onPress={() => void create()}
                style={styles.submit}
              />

              <Text style={styles.sectionLabel}>{shareStrings.activeTitle}</Text>
              {active === null ? (
                <ActivityIndicator color={palette.primary} />
              ) : active.length === 0 ? (
                <Text style={styles.muted}>{shareStrings.activeEmpty}</Text>
              ) : (
                active.map((item) => (
                  <View key={item.id} style={styles.linkRow}>
                    <View style={styles.linkInfo}>
                      <Text style={styles.linkWhen}>
                        {shareStrings.expiresAt +
                          " " +
                          formatDateTime(item.expiresAt)}
                      </Text>
                      <Text style={styles.muted}>
                        {item.viewCount + " " + shareStrings.views}
                      </Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={shareStrings.revoke}
                      onPress={() => void revoke(item.id)}
                      style={styles.revoke}
                    >
                      <Text style={styles.revokeLabel}>
                        {shareStrings.revoke}
                      </Text>
                    </Pressable>
                  </View>
                ))
              )}
            </>
          ) : (
            <Text style={styles.muted}>{shareStrings.noTrip}</Text>
          )}
        </ScrollView>

        <PrimaryButton
          label={shareStrings.close}
          variant="outline"
          onPress={onClose}
        />
      </View>
    </Modal>
  );
}

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    scrim: { flex: 1, backgroundColor: palette.scrim },
    sheet: {
      backgroundColor: palette.background,
      borderTopLeftRadius: radius.sheet,
      borderTopRightRadius: radius.sheet,
      borderTopWidth: 1,
      borderColor: palette.border,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.md,
      maxHeight: "82%",
      gap: spacing.md,
      ...shadows.sheet,
    },
    handle: {
      alignSelf: "center",
      width: 44,
      height: 4,
      borderRadius: radius.pill,
      backgroundColor: palette.borderStrong,
    },
    title: {
      ...typography.title,
      color: palette.textPrimary,
      textAlign: textAlignStart(),
    },
    body: { gap: spacing.md, paddingBottom: spacing.md },
    text: {
      ...typography.body,
      color: palette.textPrimary,
      textAlign: textAlignStart(),
    },
    privacy: {
      ...typography.caption,
      color: palette.textSecondary,
      textAlign: textAlignStart(),
    },
    sectionLabel: {
      ...typography.label,
      color: palette.primaryText,
      textAlign: textAlignStart(),
      marginTop: spacing.sm,
    },
    // Plain "row": mirrored by React Native under RTL.
    chips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    chip: {
      minHeight: 44,
      justifyContent: "center",
      paddingHorizontal: spacing.lg,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.surface,
    },
    chipOn: {
      borderColor: withAlpha(palette.primary, 0.6),
      backgroundColor: palette.primaryWash,
    },
    // Centred inside the pill: nothing to resolve.
    chipLabel: {
      ...typography.subtitle,
      color: palette.textSecondary,
    },
    chipLabelOn: { color: palette.primaryText },
    submit: { marginTop: spacing.sm },
    muted: {
      ...typography.caption,
      color: palette.textSecondary,
      textAlign: textAlignStart(),
    },
    linkRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      backgroundColor: palette.surface,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: palette.border,
      padding: spacing.md,
    },
    linkInfo: { flex: 1, gap: 2 },
    linkWhen: {
      ...typography.subtitle,
      color: palette.textPrimary,
      textAlign: textAlignStart(),
    },
    revoke: {
      minHeight: touchTarget.normal - 12,
      justifyContent: "center",
      paddingHorizontal: spacing.lg,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: withAlpha(palette.danger, 0.5),
    },
    revokeLabel: { ...typography.label, color: palette.danger },
  });
