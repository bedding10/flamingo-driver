import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { PrimaryButton } from "./PrimaryButton";
import { Icon } from "./Icon";
import {
  radius,
  spacing,
  typography,
  usePalette,
  withAlpha,
  type Palette,
} from "../theme";

type IconName = React.ComponentProps<typeof Icon>["name"];

/**
 * PHASE 7 - one empty state and one error state for the whole app.
 *
 * Every list screen had its own centred grey sentence, so "nothing here yet"
 * and "the request failed" looked identical - and a driver could not tell a
 * quiet day from a broken connection. These two components make that
 * distinction visible, and the error variant always offers the retry.
 *
 * PHASE 7.5 CLOSURE: drawn with the SVG icon set instead of a Unicode glyph,
 * and both themes come from the palette. `glyph` is still accepted for callers
 * written in PHASE 7 and is rendered only when no icon is given.
 *
 * PHASE 1 (R-11): the titles and bodies are centred, and `textAlign: "center"`
 * is already direction-neutral. The `writingDirection: "rtl"` that sat next to
 * it was forcing Arabic bidi resolution onto French and English copy, so it is
 * gone. These are the two components behind `StitchEmptyState` and
 * `StitchErrorState` in the design-system barrel.
 */
export function EmptyState({
  glyph,
  icon = "clock",
  title,
  body,
  actionLabel,
  onAction,
}: {
  glyph?: string;
  icon?: IconName;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const palette = usePalette();
  const styles = useMemo(() => makeStyles(palette), [palette]);

  return (
    <View style={styles.root}>
      <View style={styles.badge}>
        {glyph ? (
          <Text style={styles.glyph}>{glyph}</Text>
        ) : (
          <Icon name={icon} size={26} color={palette.primaryText} />
        )}
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
  const palette = usePalette();
  const styles = useMemo(() => makeStyles(palette), [palette]);

  return (
    <View style={styles.root}>
      <View style={[styles.badge, styles.badgeDanger]}>
        <Icon name="shield" size={26} color={palette.danger} />
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

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
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
      backgroundColor: palette.primaryWash,
      borderWidth: 1,
      borderColor: withAlpha(palette.primary, 0.35),
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.sm,
    },
    badgeDanger: {
      backgroundColor: withAlpha(palette.danger, 0.12),
      borderColor: withAlpha(palette.danger, 0.4),
    },
    glyph: { ...typography.headline, color: palette.primaryText },
    title: {
      ...typography.subtitle,
      color: palette.textPrimary,
      textAlign: "center",
    },
    body: {
      ...typography.caption,
      color: palette.textSecondary,
      textAlign: "center",
    },
    action: { alignSelf: "stretch", marginTop: spacing.md },
  });
