import React from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors, radius, spacing, touchTarget, typography } from "../theme";
import { strings } from "../i18n/strings";
import { StatusPill, type PillTone } from "./StatusPill";
import type { DocumentStatus, DriverDocument } from "../types/driver";

type Props = {
  title: string;
  document: DriverDocument | null;
  uploading: boolean;
  onPress: () => void;
};

/**
 * One document row: what it is, whether it was reviewed, and one large tap
 * target to submit or replace it.
 *
 * A REJECTED document is actionable, so the row invites a replacement instead of
 * looking like a dead end. There is no EXPIRED state anywhere: the server enum
 * has PENDING / APPROVED / REJECTED only.
 */
export function DocumentRow({ title, document, uploading, onPress }: Props) {
  const status = document?.status ?? null;
  return (
    <Pressable
      accessibilityRole="button"
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
        </Text>
        <Text style={styles.action}>
          {document ? strings.documents.replace : strings.documents.upload}
        </Text>
      </View>

      <StatusPill
        label={statusLabel(status)}
        tone={statusTone(status)}
      />
    </Pressable>
  );
}

function statusLabel(status: DocumentStatus | null): string {
  switch (status) {
    case "APPROVED":
      return strings.documents.statusApproved;
    case "REJECTED":
      return strings.documents.statusRejected;
    case "PENDING":
      return strings.documents.statusPending;
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
  action: {
    ...typography.caption,
    color: colors.gold,
    marginTop: 2,
    writingDirection: "rtl",
  },
});
