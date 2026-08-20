import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import { textAlignEnd, textAlignStart } from "../../i18n";
import { strings } from "../../i18n/strings";
import { Icon } from "../../components/Icon";
import {
  radius,
  spacing,
  touchTarget,
  typography,
  usePalette,
  withAlpha,
  type Palette,
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
 *
 * PHASE 7.5 CLOSURE: colours only.
 *
 * PHASE 1 (R-11): this screen held the worst direction defect in the audit -
 * the bubbles were on the wrong sides. See the note on `rowMine`. Beyond that,
 * three rows were `"row-reverse"` and seven text styles were pinned.
 */
export function TripChatScreen() {
  const insets = useSafeAreaInsets();
  const palette = usePalette();
  const styles = useMemo(() => makeStyles(palette), [palette]);
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
   * \u0631\u0642\u0645 \u0627\u0644\u0631\u0627\u0643\u0628 \u0644\u0644\u0627\u062a\u0635\u0627\u0644 \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u060c \u0643\u0645\u0627 \u062d\u0633\u0645\u0647 \u0627\u0644\u062e\u0627\u062f\u0645 \u0648\u062d\u062f\u0647.
   *
   * canCall and phoneNumber both come from GET /trip-communication/:tripId
   * after the server has checked trip ownership, trip state and the
   * passenger.tripCommunication policy. When phoneMode is not DIRECT the
   * server returns phoneNumber null and this button is not rendered at all.
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
        <ActivityIndicator color={palette.primary} />
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
              <Icon name="support" size={22} color={palette.primaryText} />
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
          placeholderTextColor={withAlpha(palette.textSecondary, 0.6)}
          selectionColor={palette.primary}
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

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: palette.background },
    center: { alignItems: "center", justifyContent: "center" },

    header: {
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.surface,
      gap: 2,
    },
    // Plain "row": mirrored by React Native under RTL.
    headerRow: {
      flexDirection: "row",
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
      backgroundColor: palette.primaryWash,
      borderWidth: 1,
      borderColor: withAlpha(palette.primary, 0.5),
    },
    headerTitle: {
      ...typography.subtitle,
      color: palette.textPrimary,
      textAlign: textAlignStart(),
    },
    headerHint: {
      ...typography.caption,
      color: palette.textSecondary,
      textAlign: textAlignStart(),
    },

    list: { padding: spacing.lg, gap: spacing.sm },
    empty: {
      ...typography.caption,
      color: palette.textSecondary,
      textAlign: "center",
      marginTop: spacing["3xl"],
    },

    row: { flexDirection: "row" },
    /**
     * THE R-11 DEFECT THAT MATTERED MOST.
     *
     * These were inverted: rowMine was "flex-start" and rowTheirs was
     * "flex-end". justifyContent runs along the main axis, and React Native
     * mirrors the main axis of a "row" under RTL, so "flex-start" resolves to
     * the RIGHT in Arabic - the driver's own messages were rendering where the
     * passenger's belong, and the passenger's where the driver's belong.
     *
     * The logical form below is correct in every language: own messages trail
     * (left in Arabic, right in French and English), incoming messages lead.
     */
    rowMine: { justifyContent: "flex-end" },
    rowTheirs: { justifyContent: "flex-start" },

    bubble: {
      maxWidth: "80%",
      borderRadius: radius.card,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      gap: 2,
    },
    bubbleMine: { backgroundColor: palette.primary },
    bubbleTheirs: {
      backgroundColor: palette.surfaceRaised,
      borderWidth: 1,
      borderColor: palette.border,
    },
    bubbleText: {
      ...typography.body,
      textAlign: textAlignStart(),
    },
    bubbleTextMine: { color: palette.onPrimary },
    bubbleTextTheirs: { color: palette.textPrimary },
    // Trailing edge of the driver's own bubble, mirrored rather than physical.
    receipt: {
      ...typography.caption,
      color: withAlpha(palette.onPrimary, 0.75),
      textAlign: textAlignEnd(),
    },

    error: {
      ...typography.caption,
      color: palette.danger,
      paddingHorizontal: spacing.xl,
      textAlign: textAlignStart(),
    },

    quickRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
    },
    quickChip: {
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.surface,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    quickText: {
      ...typography.caption,
      color: palette.textPrimary,
    },

    composer: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.surface,
    },
    input: {
      flex: 1,
      minHeight: touchTarget.normal,
      maxHeight: 120,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.surfaceSunken,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      ...typography.body,
      color: palette.textPrimary,
      textAlign: textAlignStart(),
    },
    sendButton: {
      height: touchTarget.normal,
      paddingHorizontal: spacing.xl,
      borderRadius: radius.pill,
      backgroundColor: palette.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    sendLabel: { ...typography.label, color: palette.onPrimary },

    pressed: { opacity: 0.85 },
    disabled: { opacity: 0.5 },
  });
