import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SectionCard } from "../../components/SectionCard";
import { InputField } from "../../components/InputField";
import { PrimaryButton } from "../../components/PrimaryButton";
import { supportApi } from "../../api";
import type {
  SupportTicketSummary,
  TicketStatus,
} from "../../api/support.api";
import { textAlignEnd, textAlignStart } from "../../i18n";
import { supportStrings } from "../../i18n/strings.support";
import { formatDateTime } from "../../utils/datetime";
import type { DriverStackParamList } from "../../navigation/types";
import {
  radius,
  spacing,
  touchTarget,
  typography,
  usePalette,
  type Palette,
} from "../../theme";

export const SUPPORT_TICKETS_KEY = ["support", "tickets", "me"] as const;

const STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: supportStrings.statusOpen,
  PENDING: supportStrings.statusPending,
  RESOLVED: supportStrings.statusResolved,
  CLOSED: supportStrings.statusClosed,
};

/**
 * PHASE 6 - support tickets.
 *
 * One screen for both halves of the job: opening a ticket and reading the ones
 * already open. They are together because a driver with an unanswered ticket
 * must see it before opening a second one about the same problem - duplicate
 * tickets are what buries a real case in the support queue.
 *
 * PHASE 1 (R-11): `rowHead` was `"row-reverse"` and four text styles carried
 * hardcoded direction.
 */
export function SupportScreen() {
  const insets = useSafeAreaInsets();
  const palette = usePalette();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const navigation =
    useNavigation<NativeStackNavigationProp<DriverStackParamList>>();
  const queryClient = useQueryClient();

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const tickets = useQuery({
    queryKey: SUPPORT_TICKETS_KEY,
    queryFn: () => supportApi.fetchMyTickets(1, 20),
    staleTime: 15_000,
  });

  const create = useMutation({
    mutationFn: () =>
      supportApi.createTicket({
        subject: subject.trim(),
        message: message.trim(),
      }),
    onSuccess: (ticket) => {
      setSubject("");
      setMessage("");
      void queryClient.invalidateQueries({ queryKey: SUPPORT_TICKETS_KEY });
      navigation.navigate("Ticket", { ticketId: ticket.id });
    },
    onError: () => Alert.alert(supportStrings.title, supportStrings.createFailed),
  });

  const submit = useCallback(() => {
    if (subject.trim().length < 2) {
      Alert.alert(supportStrings.title, supportStrings.subjectRequired);
      return;
    }
    if (message.trim().length < 2) {
      Alert.alert(supportStrings.title, supportStrings.messageRequired);
      return;
    }
    create.mutate();
  }, [create, message, subject]);

  const items: SupportTicketSummary[] = tickets.data?.items ?? [];

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + spacing["3xl"] },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <SectionCard title={supportStrings.newTitle}>
        <InputField
          label={supportStrings.subjectLabel}
          placeholder={supportStrings.subjectPlaceholder}
          value={subject}
          onChangeText={setSubject}
          maxLength={200}
        />
        <InputField
          label={supportStrings.messageLabel}
          placeholder={supportStrings.messagePlaceholder}
          value={message}
          onChangeText={setMessage}
          maxLength={2000}
          multiline
          style={styles.multiline}
        />
        <PrimaryButton
          label={supportStrings.submit}
          loading={create.isPending}
          onPress={submit}
        />
      </SectionCard>

      <SectionCard title={supportStrings.myTickets}>
        {tickets.isPending ? (
          <ActivityIndicator color={palette.primary} />
        ) : items.length === 0 ? (
          <Text style={styles.empty}>
            {tickets.isError ? supportStrings.loadFailed : supportStrings.empty}
          </Text>
        ) : (
          items.map((ticket) => (
            <Pressable
              key={ticket.id}
              accessibilityRole="button"
              accessibilityLabel={ticket.subject}
              onPress={() =>
                navigation.navigate("Ticket", { ticketId: ticket.id })
              }
              style={({ pressed }) => [
                styles.row,
                pressed ? styles.pressed : null,
              ]}
            >
              <View style={styles.rowHead}>
                <Text style={styles.rowSubject} numberOfLines={1}>
                  {ticket.subject}
                </Text>
                <Text style={styles.status}>
                  {STATUS_LABELS[ticket.status] ?? ticket.status}
                </Text>
              </View>
              <Text style={styles.when}>{formatDateTime(ticket.updatedAt)}</Text>
            </Pressable>
          ))
        )}
      </SectionCard>
    </ScrollView>
  );
}

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: palette.background },
    content: { padding: spacing.xl, gap: spacing.md },
    multiline: {
      minHeight: touchTarget.critical + spacing.xl,
      paddingTop: spacing.md,
      textAlignVertical: "top",
    },
    row: {
      backgroundColor: palette.surfaceSunken,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: palette.border,
      padding: spacing.md,
      gap: 2,
    },
    pressed: { opacity: 0.85 },
    // Plain "row": mirrored by React Native under RTL.
    rowHead: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    rowSubject: {
      ...typography.subtitle,
      color: palette.textPrimary,
      flex: 1,
      textAlign: textAlignStart(),
    },
    status: {
      ...typography.caption,
      color: palette.primaryText,
    },
    // Trailing timestamp, LTR digits. Was a physical "left", which is trailing
    // in Arabic but leading in French and English.
    when: {
      ...typography.caption,
      color: palette.textMuted,
      textAlign: textAlignEnd(),
      writingDirection: "ltr",
    },
    empty: {
      ...typography.body,
      color: palette.textSecondary,
      textAlign: textAlignStart(),
    },
  });
