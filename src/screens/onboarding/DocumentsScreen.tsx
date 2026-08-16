import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DocumentRow } from "../../components/DocumentRow";
import {
  DocumentDatesModal,
  type DocumentDates,
} from "../../components/DocumentDatesModal";
import { strings } from "../../i18n/strings";
import { DOC_LABELS, p1 } from "../../i18n/strings.phase1";
import { colors, radius, spacing, typography, withAlpha } from "../../theme";
import { useDriverProfile } from "../../hooks/useDriverProfile";
import { useDocumentUpload } from "../../hooks/useDocumentUpload";
import {
  DRIVER_DOC_SLOTS,
  REQUIRED_DRIVER_DOC_TYPES,
  displayDocumentStatus,
  documentNeedsDates,
  latestDocument,
  missingRequiredDocuments,
  type DocumentType,
} from "../../types/driver";

/**
 * The document slots the server accepts, no more and no less: DOC_TYPES and
 * REQUIRED_DRIVER_DOC_TYPES in driver-self.dto.ts are the source of truth.
 *
 * A document is submitted, not approved: POST /driver/me/documents always
 * stores status PENDING, and only an operator can change it. Nothing in this
 * screen pretends otherwise - and the EXPIRED badge it can now show is the
 * server's own display rule, not a local decision to invalidate anything.
 *
 * PHASE 1 order of operations, and it is deliberate:
 *   1. dates (typed off the paper, validated locally)
 *   2. photo source
 *   3. upload + register
 * Asking for dates after the photo would throw the photo away on any typo.
 */
export function DocumentsScreen() {
  const insets = useSafeAreaInsets();
  const { data: profile } = useDriverProfile();
  const { submit, pending, error, clearError } = useDocumentUpload();
  const [notice, setNotice] = useState<string | null>(null);
  const [datesFor, setDatesFor] = useState<DocumentType | null>(null);

  const askSource = (type: DocumentType, dates: DocumentDates) => {
    Alert.alert(strings.documents.sourceTitle, undefined, [
      {
        text: strings.documents.sourceCamera,
        onPress: () => {
          void submit(type, "camera", dates).then((ok) => {
            if (ok) setNotice(strings.documents.uploaded);
          });
        },
      },
      {
        text: strings.documents.sourceLibrary,
        onPress: () => {
          void submit(type, "library", dates).then((ok) => {
            if (ok) setNotice(strings.documents.uploaded);
          });
        },
      },
      { text: strings.common.cancel, style: "cancel" },
    ]);
  };

  const start = (type: DocumentType) => {
    clearError();
    setNotice(null);
    if (documentNeedsDates(type)) {
      setDatesFor(type);
      return;
    }
    askSource(type, {});
  };

  const documents = profile?.documents;
  const missing = missingRequiredDocuments(documents);
  const hasRejected = (documents ?? []).some(
    (document) => displayDocumentStatus(document) === "REJECTED",
  );

  return (
    <>
      <ScrollView
        style={styles.root}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.xl },
          { paddingBottom: insets.bottom + spacing["3xl"] },
        ]}
      >
        <Text style={styles.heading}>{strings.documents.title}</Text>
        <Text style={styles.subtitle}>{strings.documents.subtitle}</Text>

        {missing.length > 0 ? (
          <View style={styles.banner}>
            <Text style={styles.bannerTitle}>{p1.documents.missingTitle}</Text>
            {missing.map((type) => (
              <Text key={type} style={styles.bannerText}>
                • {DOC_LABELS[type]}
              </Text>
            ))}
          </View>
        ) : (
          <View style={styles.bannerOk}>
            <Text style={styles.bannerOkText}>{p1.documents.allSubmitted}</Text>
          </View>
        )}

        {hasRejected ? (
          <Text style={styles.hint}>{strings.documents.rejectedHint}</Text>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {notice && !error ? <Text style={styles.notice}>{notice}</Text> : null}

        <View style={styles.list}>
          {DRIVER_DOC_SLOTS.map((type, index) => {
            const document = latestDocument(documents, type);
            return (
              <View key={type}>
                {index > 0 ? <View style={styles.separator} /> : null}
                <DocumentRow
                  title={DOC_LABELS[type]}
                  document={document}
                  status={displayDocumentStatus(document)}
                  required={REQUIRED_DRIVER_DOC_TYPES.some(
                    (required) => required === type,
                  )}
                  uploading={pending === type}
                  onPress={() => start(type)}
                />
              </View>
            );
          })}
        </View>
      </ScrollView>

      <DocumentDatesModal
        type={datesFor}
        onCancel={() => setDatesFor(null)}
        onConfirm={(type, dates) => {
          setDatesFor(null);
          askSource(type, dates);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  content: { paddingHorizontal: spacing.xl },
  heading: {
    ...typography.title,
    color: colors.textOnDark,
    textAlign: "right",
    writingDirection: "rtl",
  },
  subtitle: {
    ...typography.body,
    color: colors.textOnDarkSecondary,
    textAlign: "right",
    writingDirection: "rtl",
    marginTop: spacing.xs,
  },
  banner: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.card,
    backgroundColor: withAlpha(colors.warning, 0.12),
    borderWidth: 1,
    borderColor: withAlpha(colors.warning, 0.4),
  },
  bannerTitle: {
    ...typography.label,
    color: colors.warning,
    textAlign: "right",
    writingDirection: "rtl",
    marginBottom: spacing.xs,
  },
  bannerText: {
    ...typography.body,
    color: colors.textOnDark,
    textAlign: "right",
    writingDirection: "rtl",
  },
  bannerOk: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.card,
    backgroundColor: withAlpha(colors.online, 0.12),
    borderWidth: 1,
    borderColor: withAlpha(colors.online, 0.4),
  },
  bannerOkText: {
    ...typography.body,
    color: colors.textOnDark,
    textAlign: "right",
    writingDirection: "rtl",
  },
  hint: {
    ...typography.caption,
    color: colors.textOnDarkSecondary,
    textAlign: "right",
    writingDirection: "rtl",
    marginTop: spacing.md,
  },
  error: {
    ...typography.body,
    color: colors.danger,
    textAlign: "right",
    writingDirection: "rtl",
    marginTop: spacing.lg,
  },
  notice: {
    ...typography.body,
    color: colors.online,
    textAlign: "right",
    writingDirection: "rtl",
    marginTop: spacing.lg,
  },
  list: {
    marginTop: spacing.xl,
    backgroundColor: colors.surfaceDark,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  separator: { height: 1, backgroundColor: colors.divider },
});
