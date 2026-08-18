import React, { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { COMPLAINT_REASONS, type ComplaintReason } from "../api/complaints.api";
import { requestStrings } from "../i18n/strings.requests";
import { AppText, BottomSheet, Button, Input, ListRow } from "../ui";
import { withAlpha } from "../theme";

export type ReportTarget = {
  fareQuoteId: string;
  againstUserId: string;
  passengerName: string | null;
};

/**
 * Reporting a request before any trip exists.
 *
 * The reasons come from COMPLAINT_REASONS in complaints.api, which mirrors the
 * Prisma enum, so this list cannot drift from what the dashboard can review. A
 * hand-written copy here would be the usual way that drift starts.
 *
 * There is no cancel button: the sheet closes on a backdrop tap or the Android
 * back gesture, which is what a docked sheet is expected to do.
 */
export function ReportRequestSheet({
  target,
  busy,
  onClose,
  onSubmit,
}: {
  target: ReportTarget | null;
  busy: boolean;
  onClose: () => void;
  onSubmit: (input: {
    fareQuoteId: string;
    againstUserId: string;
    reason: ComplaintReason;
    message?: string;
  }) => void;
}) {
  const [reason, setReason] = useState<ComplaintReason | null>(null);
  const [note, setNote] = useState("");
  const quoteId = target?.fareQuoteId ?? null;

  // A new target is a new complaint: never carry a reason over from the card
  // the driver looked at a moment ago.
  useEffect(() => {
    setReason(null);
    setNote("");
  }, [quoteId]);

  return (
    <Modal
      visible={target != null}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={requestStrings.dismiss}
          onPress={onClose}
          style={styles.backdrop}
        />

        <BottomSheet>
          <AppText variant="title">{requestStrings.reportTitle}</AppText>
          <AppText variant="caption" tone="secondary">
            {target?.passengerName
              ? `${requestStrings.reportHint} (${target.passengerName})`
              : requestStrings.reportHint}
          </AppText>

          <View>
            {COMPLAINT_REASONS.map((value) => (
              <ListRow
                key={value}
                title={requestStrings.reasons[value] ?? value}
                icon={value === reason ? "check" : "flag"}
                iconTone={value === reason ? "brand" : "neutral"}
                showChevron={false}
                onPress={() => setReason(value)}
              />
            ))}
          </View>

          <Input
            label={requestStrings.reportNoteLabel}
            value={note}
            onChangeText={setNote}
            multiline
            maxLength={2000}
            editable={!busy}
          />

          <Button
            label={requestStrings.reportSend}
            icon="flag"
            loading={busy}
            disabled={!reason || !target}
            onPress={() => {
              if (!reason || !target) return;
              onSubmit({
                fareQuoteId: target.fareQuoteId,
                againstUserId: target.againstUserId,
                reason,
                // The hook falls back to the reason label when this is empty,
                // and the server requires a non-empty message.
                message: note.trim() || undefined,
              });
            }}
          />
        </BottomSheet>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: withAlpha("#000000", 0.6),
  },
});
