import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { RouteProp } from "@react-navigation/native";
import { useRoute } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { InputField } from "../../components/InputField";
import { PrimaryButton } from "../../components/PrimaryButton";
import { supportApi } from "../../api";
import { supportStrings } from "../../i18n/strings.support";
import { formatDateTime } from "../../utils/datetime";
import { SUPPORT_TICKETS_KEY } from "./SupportScreen";
import type { DriverStackParamList } from "../../navigation/types";
import {
  colors,
  radius,
  spacing,
  touchTarget,
  typography,
  withAlpha,
} from "../../theme";

/**
 * PHASE 6 - one support thread.
 *
 * The side a message is drawn on comes from `sender.type` returned by the
 * server, not from a locally stored user id: only the ticket owner and STAFF
 * can post, so STAFF vs not is the whole decision and no extra identity call
 * is needed.
 *
 * A CLOSED ticket hides the reply box because the server refuses the POST with
 * 400 - showing a box that always fails would be a lie.
 */
export function TicketScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteProp<DriverStackParamList, "Ticket">>();
  const ticketId = route.params.ticketId;
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");

  const ticketKey = ["support", "ticket", ticketId] as const;

  const ticket = useQuery({
    queryKey: ticketKey,
    queryFn: () => supportApi.fetchTicket(ticketId),
    staleTime: 10_000,
  });

  const reply = useMutation({
    mutationFn: () => supportApi.replyToTicket(ticketId, body.trim()),
    onSuccess: () => {
      setBody("");
      void queryClient.invalidateQueries({ queryKey: ticketKey });
      void queryClient.invalidateQueries({ queryKey: SUPPORT_TICKETS_KEY });
    },
    onError: () => Alert.alert(supportStrings.title, supportStrings.replyFailed),
  });

  const send = useCallback(() => {
    if (body.trim().length < 2) return;
    reply.mutate();
  }, [body, reply]);

  if (ticket.isPending) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  if (ticket.isError || !ticket.data) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>{supportStrings.loadFailed}</Text>
      </View>
    );
  }

  const closed = ticket.data.status === "CLOSED";

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + spacing["3xl"] },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.subject}>{ticket.data.subject}</Text>

      {ticket.data.messages.map((item) => {
        const fromStaff = item.sender?.type === "STAFF";
        return (
          <View
            key={item.id}
            style={[
              styles.bubble,
              fromStaff ? styles.bubbleStaff : styles.bubbleMine,
            ]}
          >
            <Text style={styles.author}>
              {fromStaff ? supportStrings.staffLabel : supportStrings.meLabel}
            </Text>
            <Text style={styles.body}>{item.body}</Text>
            <Text style={styles.when}>{formatDateTime(item.createdAt)}</Text>
          </View>
        );
      })}

      {closed ? (
        <Text style={styles.closed}>{supportStrings.closedNote}</Text>
      ) : (
        <View style={styles.replyBox}>
          <InputField
            label={supportStrings.replyLabel}
            placeholder={supportStrings.replyPlaceholder}
            value={body}
            onChangeText={setBody}
            maxLength={2000}
            multiline
            style={styles.multiline}
          />
          <PrimaryButton
            label={supportStrings.send}
            loading={reply.isPending}
            disabled={body.trim().length < 2}
            onPress={send}
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  content: { padding: spacing.xl, gap: spacing.md },
  center: {
    flex: 1,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  subject: {
    ...typography.subtitle,
    color: colors.textOnDark,
    textAlign: "right",
    writingDirection: "rtl",
  },
  bubble: {
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: spacing.md,
    gap: 2,
    maxWidth: "92%",
  },
  bubbleMine: {
    alignSelf: "flex-end",
    backgroundColor: withAlpha(colors.gold, 0.12),
  },
  bubbleStaff: {
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceDark,
  },
  author: { ...typography.caption, color: colors.gold, writingDirection: "rtl" },
  body: {
    ...typography.body,
    color: colors.textOnDark,
    textAlign: "right",
    writingDirection: "rtl",
  },
  when: {
    ...typography.caption,
    color: colors.textOnDarkSecondary,
    textAlign: "left",
    writingDirection: "ltr",
  },
  replyBox: { gap: spacing.md, marginTop: spacing.md },
  multiline: {
    minHeight: touchTarget.critical,
    paddingTop: spacing.md,
    textAlignVertical: "top",
  },
  closed: {
    ...typography.caption,
    color: colors.warning,
    textAlign: "right",
    writingDirection: "rtl",
    marginTop: spacing.md,
  },
  empty: {
    ...typography.body,
    color: colors.textOnDarkSecondary,
    textAlign: "center",
    writingDirection: "rtl",
  },
});
