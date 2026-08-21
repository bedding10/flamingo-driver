import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  COLORS,
  ICON_SIZE,
  RADIUS,
  SPACING,
  TOUCH_TARGET,
  typo,
} from "../theme/tokens";

/**
 * Component 8 - Chat primitives (passenger_chat reference).
 * Incoming bubbles are surface-container-high and left aligned; outgoing are
 * primary-container pink, right aligned, with a read receipt. Quick-reply pills
 * sit above a pill-shaped input bar with a circular pink send button.
 */
export type ChatBubbleProps = {
  text: string;
  outgoing?: boolean;
  time?: string;
  /** Outgoing only: renders the double check in primary. */
  read?: boolean;
};

export function ChatBubble({ text, outgoing = false, time, read }: ChatBubbleProps) {
  return (
    <View style={[styles.bubbleWrap, outgoing ? styles.alignEnd : styles.alignStart]}>
      <View style={[styles.bubble, outgoing ? styles.outgoing : styles.incoming]}>
        <Text
          style={[
            styles.bubbleText,
            { color: outgoing ? COLORS.onPrimaryContainer : COLORS.onSurface },
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
              size={ICON_SIZE.sm}
              color={read ? COLORS.primary : COLORS.onSurfaceVariant}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export function ChatDayDivider({ label }: { label: string }) {
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
};

export function ChatInputBar({
  value,
  onChangeText,
  onSend,
  placeholder = "Type a message...",
  onAttach,
  sending = false,
}: ChatInputBarProps) {
  const canSend = value.trim().length > 0 && !sending;
  return (
    <View style={styles.inputRow}>
      {onAttach ? (
        <Pressable
          onPress={onAttach}
          style={styles.attach}
          accessibilityRole="button"
          accessibilityLabel="Attach"
        >
          <MaterialIcons
            name="add-circle-outline"
            size={ICON_SIZE.lg}
            color={COLORS.onSurfaceVariant}
          />
        </Pressable>
      ) : null}

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.onSurfaceVariant}
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
        accessibilityLabel="Send message"
      >
        <MaterialIcons
          name="send"
          size={ICON_SIZE.md}
          color={COLORS.onPrimaryContainer}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bubbleWrap: { maxWidth: "85%", marginBottom: SPACING.lg },
  alignStart: { alignSelf: "flex-start", alignItems: "flex-start" },
  alignEnd: { alignSelf: "flex-end", alignItems: "flex-end" },
  bubble: { padding: SPACING.md, borderRadius: RADIUS.card },
  incoming: {
    backgroundColor: COLORS.surfaceContainerHigh,
    borderTopLeftRadius: RADIUS.default,
  },
  outgoing: {
    backgroundColor: COLORS.primaryContainer,
    borderTopRightRadius: RADIUS.default,
  },
  bubbleText: { ...typo("bodyMd") },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  meta: { ...typo("labelSm"), color: COLORS.onSurfaceVariant },
  dividerWrap: { alignItems: "center", marginVertical: SPACING.lg },
  divider: {
    ...typo("labelSm"),
    color: COLORS.onSurfaceVariant,
    backgroundColor: COLORS.surfaceContainer,
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
    backgroundColor: COLORS.surfaceContainer,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.outlineVariant,
  },
  quickText: { ...typo("labelMd"), color: COLORS.onSurface },
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
    backgroundColor: COLORS.surfaceContainer,
    color: COLORS.onSurface,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    ...typo("bodyMd"),
  },
  send: {
    height: 44,
    width: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  sendDisabled: { opacity: 0.4 },
  pressed: { transform: [{ scale: 0.95 }] },
});
