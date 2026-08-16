import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { PrimaryButton } from "./PrimaryButton";
import { colors, radius, spacing, typography, withAlpha } from "../theme";

/**
 * PHASE 7 - one empty state and one error state for the whole app.
 *
 * Every list screen had its own centred grey sentence, so "nothing here yet"
 * and "the request failed" looked identical - and a driver could not tell a
 * quiet day from a broken connection. These two components make that
 * distinction visible, and the error variant always offers the retry.
 */
export function EmptyState({
  glyph = "\u25CE",
  title,
  body,
  actionLabel,
  onAction,
}: {
  glyph?: string;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.root}>
      <View style={styles.badge}>
        <Text style={styles.glyph}>{glyph}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
      {actionLabel && onAction ? (
        <PrimaryButton
          label={actionLabel}
          variant="outline"
          onPress={onAction}
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

/** The failure twin of EmptyState: danger tone, retry required. */
export function ErrorState({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body?: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <View style={styles.root}>
      <View style={[styles.badge, styles.badgeDanger]}>
        <Text style={[styles.glyph, styles.glyphDanger]}>{"\u26A0"}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
      <PrimaryButton
        label={actionLabel}
        variant="outline"
        onPress={onAction}
        style={styles.action}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing["3xl"],
    gap: spacing.sm,
  },
  badge: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: withAlpha(colors.gold, 0.12),
    borderWidth: 1,
    borderColor: withAlpha(colors.gold, 0.35),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  badgeDanger: {
    backgroundColor: withAlpha(colors.danger, 0.12),
    borderColor: withAlpha(colors.danger, 0.4),
  },
  glyph: { ...typography.headline, color: colors.gold },
  glyphDanger: { color: colors.danger },
  title: {
    ...typography.subtitle,
    color: colors.textOnDark,
    textAlign: "center",
    writingDirection: "rtl",
  },
  body: {
    ...typography.caption,
    color: colors.textOnDarkSecondary,
    textAlign: "center",
    writingDirection: "rtl",
  },
  action: { alignSelf: "stretch", marginTop: spacing.md },
});
