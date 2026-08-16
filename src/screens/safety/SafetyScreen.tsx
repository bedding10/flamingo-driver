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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SectionCard } from "../../components/SectionCard";
import { InputField } from "../../components/InputField";
import { PrimaryButton } from "../../components/PrimaryButton";
import { emergencyApi, safetyApi } from "../../api";
import type { EmergencyContact } from "../../api/emergency.api";
import type {
  SafetyIncident,
  SafetyIncidentStatus,
  SafetyIncidentType,
} from "../../api/safety.api";
import { safetyStrings } from "../../i18n/strings.support";
import { formatDateTime } from "../../utils/datetime";
import {
  radius,
  spacing,
  typography,
  usePalette,
  withAlpha,
  type Palette,
} from "../../theme";

const CONTACTS_KEY = ["emergency", "contacts", "me"] as const;
const INCIDENTS_KEY = ["safety", "incidents", "me"] as const;

const TYPE_LABELS: Record<SafetyIncidentType, string> = {
  SOS: safetyStrings.typeSos,
  ACCIDENT: safetyStrings.typeAccident,
  THREAT: safetyStrings.typeThreat,
  MEDICAL: safetyStrings.typeMedical,
  OTHER: safetyStrings.typeOther,
};

const STATUS_LABELS: Record<SafetyIncidentStatus, string> = {
  OPEN: safetyStrings.statusOpen,
  ACKNOWLEDGED: safetyStrings.statusAcknowledged,
  RESOLVED: safetyStrings.statusResolved,
  FALSE_ALARM: safetyStrings.statusFalseAlarm,
};

/**
 * PHASE 6 - the safety screen.
 *
 * This closes a real hole rather than adding a page: SafetyService.dispatchSos()
 * texts the reporter's emergency contacts with the position, and the driver app
 * had no way to save a single contact. Pressing SOS therefore alerted the
 * support team and nobody else.
 *
 * The SOS button itself deliberately stays on the trip card - a driver in
 * trouble must not have to open a menu - so this screen holds the setup and the
 * history, not a second trigger.
 */
export function SafetyScreen() {
  const insets = useSafeAreaInsets();
  const palette = usePalette();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relation, setRelation] = useState("");

  const contacts = useQuery({
    queryKey: CONTACTS_KEY,
    queryFn: () => emergencyApi.fetchMyContacts(),
    staleTime: 60_000,
  });

  const incidents = useQuery({
    queryKey: INCIDENTS_KEY,
    queryFn: () => safetyApi.myIncidents(),
    staleTime: 30_000,
  });

  const add = useMutation({
    mutationFn: () =>
      emergencyApi.createContact({
        name: name.trim(),
        phone: phone.trim(),
        relation: relation.trim() ? relation.trim() : undefined,
      }),
    onSuccess: () => {
      setName("");
      setPhone("");
      setRelation("");
      void queryClient.invalidateQueries({ queryKey: CONTACTS_KEY });
    },
    onError: () => Alert.alert(safetyStrings.title, safetyStrings.addFailed),
  });

  const remove = useMutation({
    mutationFn: (id: string) => emergencyApi.deleteContact(id),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: CONTACTS_KEY }),
    onError: () => Alert.alert(safetyStrings.title, safetyStrings.deleteFailed),
  });

  const submit = useCallback(() => {
    if (name.trim().length < 2) {
      Alert.alert(safetyStrings.title, safetyStrings.nameRequired);
      return;
    }
    if (phone.trim().length < 4) {
      Alert.alert(safetyStrings.title, safetyStrings.phoneRequired);
      return;
    }
    add.mutate();
  }, [add, name, phone]);

  const confirmRemove = useCallback(
    (contact: EmergencyContact) => {
      Alert.alert(safetyStrings.deleteTitle, safetyStrings.deleteBody, [
        { text: safetyStrings.cancel, style: "cancel" },
        {
          text: safetyStrings.confirm,
          style: "destructive",
          onPress: () => remove.mutate(contact.id),
        },
      ]);
    },
    [remove],
  );

  const contactItems: EmergencyContact[] = contacts.data ?? [];
  const incidentItems: SafetyIncident[] = incidents.data ?? [];

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + spacing["3xl"] },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.note}>
        <Text style={styles.noteText}>{safetyStrings.sosNote}</Text>
      </View>

      <SectionCard
        title={safetyStrings.contactsTitle}
        hint={safetyStrings.limitNote}
      >
        {contacts.isPending ? (
          <ActivityIndicator color={palette.primary} />
        ) : contactItems.length === 0 ? (
          <Text style={styles.warn}>
            {contacts.isError
              ? safetyStrings.contactsLoadFailed
              : safetyStrings.contactsEmpty}
          </Text>
        ) : (
          contactItems.map((contact) => (
            <View key={contact.id} style={styles.row}>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {contact.name}
                  {contact.relation ? " \u00b7 " + contact.relation : ""}
                </Text>
                <Text style={styles.rowPhone}>{contact.phone}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={safetyStrings.deleteContact}
                onPress={() => confirmRemove(contact)}
                style={styles.removeButton}
              >
                <Text style={styles.removeLabel}>
                  {safetyStrings.deleteContact}
                </Text>
              </Pressable>
            </View>
          ))
        )}

        <InputField
          label={safetyStrings.nameLabel}
          placeholder={safetyStrings.namePlaceholder}
          value={name}
          onChangeText={setName}
          maxLength={80}
        />
        <InputField
          label={safetyStrings.phoneLabel}
          placeholder={safetyStrings.phonePlaceholder}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          maxLength={20}
          numeric
        />
        <InputField
          label={safetyStrings.relationLabel}
          placeholder={safetyStrings.relationPlaceholder}
          value={relation}
          onChangeText={setRelation}
          maxLength={40}
        />
        <PrimaryButton
          label={safetyStrings.addContact}
          loading={add.isPending}
          onPress={submit}
        />
      </SectionCard>

      <SectionCard title={safetyStrings.incidentsTitle}>
        {incidents.isPending ? (
          <ActivityIndicator color={palette.primary} />
        ) : incidentItems.length === 0 ? (
          <Text style={styles.muted}>
            {incidents.isError
              ? safetyStrings.incidentsLoadFailed
              : safetyStrings.incidentsEmpty}
          </Text>
        ) : (
          incidentItems.map((incident) => (
            <View key={incident.id} style={styles.row}>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>
                  {(TYPE_LABELS[incident.type] ?? incident.type) +
                    " \u00b7 " +
                    (STATUS_LABELS[incident.status] ?? incident.status)}
                </Text>
                <Text style={styles.rowPhone}>
                  {formatDateTime(incident.createdAt)}
                </Text>
                <Text style={styles.muted}>
                  {(incident.tripId ? safetyStrings.withTrip : "") +
                    (incident.lat == null || incident.lng == null
                      ? (incident.tripId ? " \u00b7 " : "") +
                        safetyStrings.noPosition
                      : "")}
                </Text>
              </View>
            </View>
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
    note: {
      backgroundColor: withAlpha(palette.info, 0.12),
      borderColor: withAlpha(palette.info, 0.4),
      borderWidth: 1,
      borderRadius: radius.md,
      padding: spacing.md,
    },
    noteText: {
      ...typography.caption,
      color: palette.textPrimary,
      textAlign: "right",
      writingDirection: "rtl",
    },
    row: {
      flexDirection: "row-reverse",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
      backgroundColor: palette.surfaceSunken,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: palette.border,
      padding: spacing.md,
    },
    rowText: { flex: 1, gap: 2 },
    rowTitle: {
      ...typography.subtitle,
      color: palette.textPrimary,
      textAlign: "right",
      writingDirection: "rtl",
    },
    rowPhone: {
      ...typography.caption,
      color: palette.textSecondary,
      textAlign: "left",
      writingDirection: "ltr",
    },
    removeButton: {
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: withAlpha(palette.danger, 0.6),
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    removeLabel: { ...typography.caption, color: palette.danger },
    warn: {
      ...typography.caption,
      color: palette.warning,
      textAlign: "right",
      writingDirection: "rtl",
    },
    muted: {
      ...typography.caption,
      color: palette.textSecondary,
      textAlign: "right",
      writingDirection: "rtl",
    },
  });
