import React from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors, radius, spacing, touchTarget, typography, withAlpha } from "../theme";
import { strings } from "../i18n/strings";
import { p1 } from "../i18n/strings.phase1";
import { StatusPill, type PillTone } from "./StatusPill";
import { daysUntil, formatStoredDate } from "../utils/documentDates";
import type { DocumentStatus, DriverDocument } from "../types/driver";

type Props = {
  title: string;
  document: DriverDocument | null;
  /**
   * Status to display. The screen passes displayDocumentStatus(document), which
   * can differ from document.status: an APPROVED document whose expiry has
   * passed reads EXPIRED.
   */
  status: DocumentStatus | null;
  required: boolean;
  uploading: boolean;
  onPress: () => void;
};

/**
 * One document row: what it is, whether it was reviewed, when it expires, and
 * one large tap target to submit or replace it.
 *
 * PHASE 1 added the three things a driver actually needs to act:
 *   - the rejection reason, so "مرفوضة" stops being a dead end
 *   - the expiry date with a countdown, so renewal happens before the block
 *   - the EXPIRED state itself
 */
export function DocumentRow({
  title,
  document,
  status,
  required,
  uploading,
  onPress,
}: Props) {
  const issued = formatStoredDate(document?.issuedAt);
  const expires = formatStoredDate(document?.expiresAt);
  const remaining = daysUntil(document?.expiresAt);
  const showNote = status === "REJECTED" && !!document?.note;

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ busy: uploading }}
        onPress={onPress}
        disabled={uploading}
        style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
      >
        <View style={styles.thumb}>
          {uploading ? (
            <ActivityIndicator color={colors.gold} />
          ) : document?.url ? (
            <Image source={{ uri: document.url }} style={styles.image} />
          ) : (
            <Text style={styles.thumbPlaceholder}>+</Text>
          )}
        </View>

        <View style={styles.texts}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
            {required ? <Text style={styles.requiredMark}> *</Text> : null}
          </Text>
          <Text style={styles.action}>
            {document ? strings.documents.replace : strings.documents.upload}
          </Text>
        </View>

        <StatusPill label={statusLabel(status)} tone={statusTone(status)} />
      </Pressable>

      {issued || expires ? (
        <View style={styles.dates}>
          {issued ? (
            <Text style={styles.dateLine}>
              {p1.documents.issuedOn}: <Text style={styles.dateValue}>{issued}</Text>
            </Text>
          ) : null}
          {expires ? (
            <Text style={styles.dateLine}>
              {p1.documents.expiresOn}: <Text style={styles.dateValue}>{expires}</Text>
            </Text>
          ) : null}
          {remaining !== null ? (
            <Text style={[styles.countdown, countdownStyle(remaining)]}>
              {countdownLabel(remaining)}
            </Text>
          ) : null}
        </View>
      ) : null}

      {showNote ? (
        <View style={styles.noteBox}>
          <Text style={styles.noteTitle}>{p1.documents.rejectionReason}</Text>
          <Text style={styles.noteText}>{document?.note}</Text>
        </View>
      ) : null}

      {status === "EXPIRED" ? (
        <Text style={styles.expiredHint}>{p1.documents.expiredHint}</Text>
      ) : null}
    </View>
  );
}

function countdownLabel(days: number): string {
  if (days < 0) return p1.documents.expiredBadge;
  if (days === 0) return p1.documents.expiresToday;
  return (
    p1.documents.expiresInPrefix + " " + days + " " + p1.documents.daysSuffix
  );
}

function countdownStyle(days: number) {
  if (days < 0) return styles.countdownDanger;
  // 30 days is the same warning window the dashboard uses, so an operator and a
  // driver never disagree about what "soon" means.
  if (days <= 30) return styles.countdownWarning;
  return styles.countdownCalm;
}

function statusLabel(status: DocumentStatus | null): string {
  switch (status) {
    case "APPROVED":
      return strings.documents.statusApproved;
    case "REJECTED":
      return strings.documents.statusRejected;
    case "PENDING":
      return strings.documents.statusPending;
    case "EXPIRED":
      return p1.documents.statusExpired;
    default:
      return strings.documents.statusMissing;
  }
}

function statusTone(status: DocumentStatus | null): PillTone {
  switch (status) {
    case "APPROVED":
      return "approved";
    case "REJECTED":
      return "rejected";
    case "PENDING":
      return "pending";
    case "EXPIRED":
      return "expired";
    default:
      return "neutral";
  }
}

const styles = StyleSheet.create({
  row: {
    minHeight: touchTarget.critical,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: spacing.lg,
    paddingVertical: spacing.md,
  },
  pressed: { opacity: 0.75 },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceDarkRaised,
    borderWidth: 1,
    borderColor: colors.divider,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%" },
  thumbPlaceholder: { ...typography.title, color: colors.textOnDarkSecondary },
  texts: { flex: 1, alignItems: "flex-end" },
  title: {
    ...typography.label,
    color: colors.textOnDark,
    textAlign: "right",
    writingDirection: "rtl",
  },
  requiredMark: { color: colors.gold },
  action: {
    ...typography.caption,
    color: colors.gold,
    marginTop: 2,
    writingDirection: "rtl",
  },
  dates: {
    alignItems: "flex-end",
    paddingBottom: spacing.sm,
    gap: 2,
  },
  dateLine: {
    ...typography.caption,
    color: colors.textOnDarkSecondary,
    textAlign: "right",
    writingDirection: "rtl",
  },
  dateValue: { color: colors.textOnDark },
  countdown: { ...typography.caption, writingDirection: "rtl" },
  countdownCalm: { color: colors.textOnDarkSecondary },
  countdownWarning: { color: colors.warning },
  countdownDanger: { color: colors.danger },
  noteBox: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: withAlpha(colors.danger, 0.12),
    borderWidth: 1,
    borderColor: withAlpha(colors.danger, 0.4),
  },
  noteTitle: {
    ...typography.caption,
    color: colors.danger,
    fontWeight: "600",
    textAlign: "right",
    writingDirection: "rtl",
  },
  noteText: {
    ...typography.body,
    color: colors.textOnDark,
    textAlign: "right",
    writingDirection: "rtl",
    marginTop: 2,
  },
  expiredHint: {
    ...typography.caption,
    color: colors.danger,
    textAlign: "right",
    writingDirection: "rtl",
    marginBottom: spacing.md,
  },
});
