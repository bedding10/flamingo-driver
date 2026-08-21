import { MaterialIcons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { RADIUS, SPACING, TOUCH_TARGET, typo } from "../theme/tokens";
import { useTokens, type Tokens } from "../theme/useTokens";

/**
 * Component 8 - Chat primitives (passenger_chat reference).
 * Incoming bubbles are surface-container-high and start aligned; outgoing are
 * primary-container pink, end aligned, with a read receipt. Quick-reply pills
 * sit above a pill-shaped input bar with a circular pink send button.
 *
 * RTL: the clipped bubble corner uses LOGICAL start/end radii. Physical
 * left/right radii do not mirror, so in Arabic the tail pointed away from the
 * speaker on every bubble.
 */
export type ChatBubbleProps = {
  text: string;
  outgoing?: boolean;
  time?: string;
  /** Outgoing only: renders the double check in primary. */
  read?: boolean;
};

export function ChatBubble({
  text,
  outgoing = false,
  time,
  read,
}: ChatBubbleProps) {
  const t = useTokens();
  const styles = useMemo(() => makeStyles(t), [t]);

  return (
    <View
      style={[styles.bubbleWrap, outgoing ? styles.alignEnd : styles.alignStart]}
    >
      <View
        style={[styles.bubble, outgoing ? styles.outgoing : styles.incoming]}
      >
        <Text
          style={[
            styles.bubbleText,
            {
              color: outgoing
                ? t.colors.onPrimaryContainer
                : t.colors.onSurface,
            },
          ]}
        >
          {text}
        </Text>
      </View>
      {time ? (
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{time}</Text>
          {outgoing ? (
            <MaterialIcons
              name={read ? "done-all" : "done"}
              size={t.iconSize.sm}
              color={read ? t.colors.primary : t.colors.onSurfaceVariant}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export function ChatDayDivider({ label }: { label: string }) {
  const t = useTokens();
  const styles = useMemo(() => makeStyles(t), [t]);
  return (
    <View style={styles.dividerWrap}>
      <Text style={styles.divider}>{label}</Text>
    </View>
  );
}

export function QuickReplies({
  replies,
  onSelect,
}: {
  replies: string[];
  onSelect: (reply: string) => void;
}) {
  const t = useTokens();
  const styles = useMemo(() => makeStyles(t), [t]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.quickRow}
    >
      {replies.map((reply) => (
        <Pressable
          key={reply}
          onPress={() => onSelect(reply)}
          style={({ pressed }) => [styles.quickPill, pressed && styles.pressed]}
          accessibilityRole="button"
        >
          <Text style={styles.quickText}>{reply}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

export type ChatInputBarProps = {
  value: string;
  onChangeText: (next: string) => void;
  onSend: () => void;
  placeholder?: string;
  onAttach?: () => void;
  sending?: boolean;
  /** Screen-reader labels. Arabic defaults. */
  attachLabel?: string;
  sendLabel?: string;
};

export function ChatInputBar({
  value,
  onChangeText,
  onSend,
  placeholder = "اكتب رسالة…",
  onAttach,
  sending = false,
  attachLabel = "إرفاق",
  sendLabel = "إرسال",
}: ChatInputBarProps) {
  const t = useTokens();
  const styles = useMemo(() => makeStyles(t), [t]);
  const canSend = value.trim().length > 0 && !sending;

  return (
    <View style={styles.inputRow}>
      {onAttach ? (
        <Pressable
          onPress={onAttach}
          style={styles.attach}
          accessibilityRole="button"
          accessibilityLabel={attachLabel}
        >
          <MaterialIcons
            name="add-circle-outline"
            size={t.iconSize.lg}
            color={t.colors.onSurfaceVariant}
          />
        </Pressable>
      ) : null}

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={t.colors.onSurfaceVariant}
        style={styles.input}
        multiline
      />

      <Pressable
        onPress={canSend ? onSend : undefined}
        style={({ pressed }) => [
          styles.send,
          !canSend && styles.sendDisabled,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={sendLabel}
        accessibilityState={{ disabled: !canSend }}
      >
        <MaterialIcons
          name="send"
          size={t.iconSize.md}
          color={t.colors.onPrimaryContainer}
        />
      </Pressable>
    </View>
  );
}

function makeStyles(t: Tokens) {
  return StyleSheet.create({
    bubbleWrap: { maxWidth: "85%", marginBottom: SPACING.lg },
    alignStart: { alignSelf: "flex-start", alignItems: "flex-start" },
    alignEnd: { alignSelf: "flex-end", alignItems: "flex-end" },
    bubble: { padding: SPACING.md, borderRadius: RADIUS.card },
    incoming: {
      backgroundColor: t.colors.surfaceContainerHigh,
      borderTopStartRadius: RADIUS.default,
    },
    outgoing: {
      backgroundColor: t.colors.primaryContainer,
      borderTopEndRadius: RADIUS.default,
    },
    bubbleText: { ...typo("bodyMd") },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.xs,
      marginTop: SPACING.xs,
    },
    meta: { ...typo("labelSm"), color: t.colors.onSurfaceVariant },
    dividerWrap: { alignItems: "center", marginVertical: SPACING.lg },
    divider: {
      ...typo("labelSm"),
      color: t.colors.onSurfaceVariant,
      backgroundColor: t.colors.surfaceContainer,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.xs,
      borderRadius: RADIUS.full,
      overflow: "hidden",
    },
    quickRow: {
      gap: SPACING.sm,
      paddingHorizontal: SPACING.gutter,
      paddingVertical: SPACING.md,
    },
    quickPill: {
      minHeight: 40,
      justifyContent: "center",
      paddingHorizontal: SPACING.lg,
      borderRadius: RADIUS.full,
      backgroundColor: t.colors.surfaceContainer,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.colors.outlineVariant,
    },
    quickText: { ...typo("labelMd"), color: t.colors.onSurface },
    inputRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: SPACING.sm,
      paddingHorizontal: SPACING.gutter,
      paddingBottom: SPACING.lg,
      paddingTop: SPACING.xs,
    },
    attach: {
      height: TOUCH_TARGET,
      width: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    input: {
      flex: 1,
      maxHeight: 120,
      minHeight: TOUCH_TARGET,
      borderRadius: RADIUS.full,
      backgroundColor: t.colors.surfaceContainer,
      color: t.colors.onSurface,
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.md,
      ...typo("bodyMd"),
    },
    send: {
      height: 44,
      width: 44,
      borderRadius: RADIUS.full,
      backgroundColor: t.colors.primaryContainer,
      alignItems: "center",
      justifyContent: "center",
    },
    sendDisabled: { opacity: 0.4 },
    pressed: { transform: [{ scale: 0.95 }] },
  });
}
