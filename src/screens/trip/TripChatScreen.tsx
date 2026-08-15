import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { RouteProp } from "@react-navigation/native";
import { useRoute } from "@react-navigation/native";
import {
  fetchTripCommunication,
  fetchTripMessages,
  markTripMessagesRead,
  sendTripMessage,
  type TripChatMessage,
  type TripCommunicationContext,
} from "../../api/trip-communication.api";
import { joinTripRoom, onSocketEvent } from "../../socket/socket.service";
import type { DriverStackParamList } from "../../navigation/types";
import { strings } from "../../i18n/strings";
import {
  colors,
  radius,
  spacing,
  touchTarget,
  typography,
  withAlpha,
} from "../../theme";

/** Mirrors the server's @MaxLength on SendTripMessageDto. */
const MAX_BODY = 1000;

type ChatRoute = RouteProp<DriverStackParamList, "TripChat">;

/**
 * Trip chat, driver side.
 *
 * This screen is new, but the SYSTEM is not: it speaks to the same
 * /trip-communication controller and the same `trip:message` socket event the
 * passenger app has been using. The driver half simply had never been built -
 * `trip:message` was declared in src/types/socket.ts and listened to by nobody,
 * so every message a passenger sent reached the server, was stored, was
 * broadcast, and then fell on the floor.
 *
 * Ownership of a message is decided by comparing the sender to the passenger id
 * the server returns in `participant`, not by a locally stored user id: the
 * driver app keeps a driver profile, and driver.id is NOT the user id used as
 * TripMessage.senderId. Using participant.id avoids that mismatch entirely.
 */
export function TripChatScreen() {
  const insets = useSafeAreaInsets();
  const { tripId } = useRoute<ChatRoute>().params;

  const [context, setContext] = useState<TripCommunicationContext | null>(null);
  const [messages, setMessages] = useState<TripChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listRef = useRef<FlatList<TripChatMessage>>(null);

  /** Appends without duplicating: the sender also receives its own broadcast. */
  const upsert = useCallback((incoming: TripChatMessage) => {
    setMessages((current) =>
      current.some((item) => item.id === incoming.id)
        ? current.map((item) => (item.id === incoming.id ? incoming : item))
        : current.concat(incoming),
    );
  }, []);

  // Initial load. The room join is required for `trip:message` to arrive at
  // all: the gateway broadcasts to `trip:{tripId}`, and a driver who opened the
  // thread from a push notification may not be in that room yet.
  useEffect(() => {
    let cancelled = false;
    joinTripRoom(tripId);

    void (async () => {
      try {
        const [ctx, page] = await Promise.all([
          fetchTripCommunication(tripId),
          fetchTripMessages(tripId, 1, 50),
        ]);
        if (cancelled) return;
        setContext(ctx);
        setMessages(page.items);
      } catch {
        if (!cancelled) setError(strings.chat.loadFailed);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tripId]);

  // Opening the thread IS the read receipt. Fire-and-forget: a failed receipt
  // must never block reading, it only leaves the badge up until next time.
  useEffect(() => {
    if (loading) return;
    void markTripMessagesRead(tripId).catch(() => undefined);
  }, [loading, tripId]);

  useEffect(() => {
    return onSocketEvent("trip:message", (payload) => {
      if (payload?.tripId !== tripId) return;
      upsert(payload as TripChatMessage);
      // A message that lands while the thread is open is already read.
      void markTripMessagesRead(tripId).catch(() => undefined);
    });
  }, [tripId, upsert]);

  // The passenger opened the thread: turn our own ticks read.
  useEffect(() => {
    return onSocketEvent("trip:messages_read", (payload) => {
      if (payload?.tripId !== tripId) return;
      setMessages((current) =>
        current.map((item) =>
          item.senderId === payload.readerId || item.readAt
            ? item
            : { ...item, readAt: payload.readAt },
        ),
      );
    });
  }, [tripId]);

  const submit = useCallback(async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    try {
      const created = await sendTripMessage(tripId, body.slice(0, MAX_BODY));
      upsert(created);
      setDraft("");
    } catch (err) {
      // 403 MESSAGE_RATE_LIMITED is the one the driver can act on; everything
      // else is reported generically rather than guessed at.
      const status = (err as { response?: { status?: number } })?.response
        ?.status;
      setError(status === 403 ? strings.chat.rateLimited : strings.chat.sendFailed);
    } finally {
      setSending(false);
    }
  }, [draft, sending, tripId, upsert]);

  const passengerId = context?.participant?.id ?? null;
  const closed = context ? !context.canChat : false;
  const title = context?.participant?.name || strings.chat.passengerFallback;

  /**
   * رقم الراكب للاتصال المباشر، كما حسمه الخادم وحده.
   *
   * لا نقرّر هنا شيئًا: `canCall` و`phoneNumber` يأتيان من
   * GET /trip-communication/:tripId بعد أن يتحقق الخادم من ملكية الرحلة
   * وحالتها وسياسة passenger.tripCommunication. إن كان phoneMode غير
   * DIRECT يعود phoneNumber ـ null فلا يظهر الزر أصلاً.
   *
   * هذا هو النصف الذي كان ناقصًا: تطبيق الراكب يتصل منذ البداية،
   * بينما لم يكن لدى السائق أي وسيلة للاتصال بالراكب إطلاقًا.
   */
  const callablePhone =
    context?.canCall === true && context.phoneNumber
      ? context.phoneNumber
      : null;

  const call = useCallback(async () => {
    if (!callablePhone) return;
    try {
      await Linking.openURL(`tel:${callablePhone}`);
    } catch {
      setError(strings.chat.callFailed);
    }
  }, [callablePhone]);

  if (loading) {
    return (
      <View style={[styles.root, styles.center]}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={insets.top + 56}
    >
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.headerHint} numberOfLines={1}>
              {closed ? strings.chat.closed : strings.chat.active}
            </Text>
          </View>

          {callablePhone ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={strings.chat.call}
              onPress={() => void call()}
              style={({ pressed }) => [
                styles.callButton,
                pressed ? styles.pressed : null,
              ]}
            >
              <Text style={styles.callIcon}>{"\u2706"}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        onContentSizeChange={() =>
          listRef.current?.scrollToEnd({ animated: false })
        }
        ListEmptyComponent={
          <Text style={styles.empty}>{strings.chat.empty}</Text>
        }
        renderItem={({ item }) => {
          const mine = passengerId != null && item.senderId !== passengerId;
          return (
            <View style={[styles.row, mine ? styles.rowMine : styles.rowTheirs]}>
              <View
                style={[
                  styles.bubble,
                  mine ? styles.bubbleMine : styles.bubbleTheirs,
                ]}
              >
                <Text
                  style={[
                    styles.bubbleText,
                    mine ? styles.bubbleTextMine : styles.bubbleTextTheirs,
                  ]}
                >
                  {item.body}
                </Text>
                {mine ? (
                  <Text style={styles.receipt}>
                    {item.readAt ? strings.chat.read : strings.chat.sent}
                  </Text>
                ) : null}
              </View>
            </View>
          );
        }}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/* Quick replies: a driver types at a red light, not on the move. */}
      {!closed ? (
        <View style={styles.quickRow}>
          {[
            strings.chat.quickOnMyWay,
            strings.chat.quickArrived,
            strings.chat.quickWaiting,
          ].map((text) => (
            <Pressable
              key={text}
              accessibilityRole="button"
              accessibilityLabel={text}
              onPress={() => setDraft(text)}
              style={styles.quickChip}
            >
              <Text style={styles.quickText}>{text}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View
        style={[styles.composer, { paddingBottom: insets.bottom + spacing.md }]}
      >
        <TextInput
          value={draft}
          onChangeText={setDraft}
          editable={!closed}
          multiline
          maxLength={MAX_BODY}
          placeholder={
            closed ? strings.chat.closedPlaceholder : strings.chat.placeholder
          }
          placeholderTextColor={colors.textOnDarkSecondary}
          style={styles.input}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={strings.chat.send}
          disabled={closed || sending || draft.trim().length === 0}
          onPress={() => void submit()}
          style={({ pressed }) => [
            styles.sendButton,
            pressed ? styles.pressed : null,
            closed || sending || draft.trim().length === 0
              ? styles.disabled
              : null,
          ]}
        >
          <Text style={styles.sendLabel}>{strings.chat.send}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  center: { alignItems: "center", justifyContent: "center" },

  header: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderColor: colors.divider,
    gap: 2,
  },
  // RTL: الاسم على اليمين وزر الاتصال على اليسار، مثل بقية شاشات التطبيق.
  headerRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: spacing.md,
  },
  headerText: { flex: 1, gap: 2 },
  callButton: {
    width: touchTarget.normal,
    height: touchTarget.normal,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: withAlpha(colors.gold, 0.16),
    borderWidth: 1,
    borderColor: withAlpha(colors.gold, 0.5),
  },
  callIcon: { fontSize: 22, color: colors.gold },
  headerTitle: {
    ...typography.subtitle,
    color: colors.textOnDark,
    textAlign: "right",
    writingDirection: "rtl",
  },
  headerHint: {
    ...typography.caption,
    color: colors.textOnDarkSecondary,
    textAlign: "right",
    writingDirection: "rtl",
  },

  list: { padding: spacing.lg, gap: spacing.sm },
  empty: {
    ...typography.caption,
    color: colors.textOnDarkSecondary,
    textAlign: "center",
    marginTop: spacing["3xl"],
    writingDirection: "rtl",
  },

  row: { flexDirection: "row" },
  // RTL: the driver's own messages sit on the left, the passenger's on the
  // right, matching how the passenger app renders the same thread mirrored.
  rowMine: { justifyContent: "flex-start" },
  rowTheirs: { justifyContent: "flex-end" },

  bubble: {
    maxWidth: "80%",
    borderRadius: radius.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 2,
  },
  bubbleMine: { backgroundColor: colors.gold },
  bubbleTheirs: {
    backgroundColor: colors.surfaceDarkRaised,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  bubbleText: { ...typography.body, textAlign: "right", writingDirection: "rtl" },
  bubbleTextMine: { color: colors.ink },
  bubbleTextTheirs: { color: colors.textOnDark },
  receipt: {
    ...typography.caption,
    color: withAlpha(colors.ink, 0.6),
    textAlign: "left",
  },

  error: {
    ...typography.caption,
    color: colors.danger,
    paddingHorizontal: spacing.xl,
    textAlign: "right",
    writingDirection: "rtl",
  },

  quickRow: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  quickChip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.surfaceDark,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  quickText: {
    ...typography.caption,
    color: colors.textOnDark,
    writingDirection: "rtl",
  },

  composer: {
    flexDirection: "row-reverse",
    alignItems: "flex-end",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.surfaceDark,
  },
  input: {
    flex: 1,
    minHeight: touchTarget.normal,
    maxHeight: 120,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.surfaceDarkRaised,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    ...typography.body,
    color: colors.textOnDark,
    textAlign: "right",
    writingDirection: "rtl",
  },
  sendButton: {
    height: touchTarget.normal,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  sendLabel: { ...typography.label, color: colors.ink },

  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
});
