import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DocumentRow } from "../../components/DocumentRow";
import { strings } from "../../i18n/strings";
import { colors, radius, spacing, typography, withAlpha } from "../../theme";
import { useDriverProfile } from "../../hooks/useDriverProfile";
import { useDocumentUpload } from "../../hooks/useDocumentUpload";
import {
  DOCUMENT_TYPES,
  latestDocument,
  type DocumentType,
} from "../../types/driver";

/**
 * The five document slots the server accepts, no more and no less: DOC_TYPES in
 * driver-self.dto.ts is the source of truth.
 *
 * A document is submitted, not approved: POST /driver/me/documents always stores
 * status PENDING, and only an operator can change it. Nothing in this screen
 * pretends otherwise.
 */
export function DocumentsScreen() {
  const insets = useSafeAreaInsets();
  const { data: profile } = useDriverProfile();
  const { submit, pending, error, clearError } = useDocumentUpload();
  const [notice, setNotice] = useState<string | null>(null);

  const pick = (type: DocumentType) => {
    clearError();
    setNotice(null);
    Alert.alert(strings.documents.sourceTitle, undefined, [
      {
        text: strings.documents.sourceCamera,
        onPress: () => {
          void submit(type, "camera").then((ok) => {
            if (ok) setNotice(strings.documents.uploaded);
          });
        },
      },
      {
        text: strings.documents.sourceLibrary,
        onPress: () => {
          void submit(type, "library").then((ok) => {
            if (ok) setNotice(strings.documents.uploaded);
          });
        },
      },
      { text: strings.common.cancel, style: "cancel" },
    ]);
  };

  const hasRejected = (profile?.documents ?? []).some(
    (document) => document.status === "REJECTED",
  );

  return (
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

      {hasRejected ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{strings.documents.rejectedHint}</Text>
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {notice && !error ? <Text style={styles.notice}>{notice}</Text> : null}

      <View style={styles.list}>
        {DOCUMENT_TYPES.map((type, index) => (
          <View key={type}>
            {index > 0 ? <View style={styles.separator} /> : null}
            <DocumentRow
              title={strings.documents[type]}
              document={latestDocument(profile?.documents, type)}
              uploading={pending === type}
              onPress={() => pick(type)}
            />
          </View>
        ))}
      </View>
    </ScrollView>
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
    backgroundColor: withAlpha(colors.danger, 0.12),
    borderWidth: 1,
    borderColor: withAlpha(colors.danger, 0.4),
  },
  bannerText: {
    ...typography.body,
    color: colors.textOnDark,
    textAlign: "right",
    writingDirection: "rtl",
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
