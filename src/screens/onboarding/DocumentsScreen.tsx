import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  DocumentDatesModal,
  type DocumentDates,
} from "../../components/DocumentDatesModal";
import { useDocumentUpload } from "../../hooks/useDocumentUpload";
import { useDriverProfile } from "../../hooks/useDriverProfile";
import { textAlignStart } from "../../i18n";
import { strings } from "../../i18n/strings";
import { DOC_LABELS, p1 } from "../../i18n/strings.phase1";
import {
  alpha,
  COLORS,
  ICON_SIZE,
  RADIUS,
  SEMANTIC,
  SHADOW_CARD,
  SPACING,
  typo,
} from "../../theme/tokens";
import {
  DRIVER_DOC_SLOTS,
  REQUIRED_DRIVER_DOC_TYPES,
  displayDocumentStatus,
  documentNeedsDates,
  latestDocument,
  missingRequiredDocuments,
  type DocumentType,
} from "../../types/driver";
import { HEADER_HEIGHT, PillButton, StickyHeader } from "../../ui";

/** Stitch draws the slot icon well at `w-10 h-10` and the state rail at `w-1`. */
const SLOT_ICON = 40;
const RAIL_WIDTH = 4;

/** One glyph per slot, mirroring the reference's id_card / car / shield set. */
const SLOT_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  LICENSE: "badge",
  ID_CARD: "credit-card",
  INSURANCE: "shield",
  REGISTRATION: "directions-car",
  PROFILE_PHOTO: "person",
};

/**
 * Stitch `document_upload_list`.
 *
 * The document slots the server accepts, no more and no less: DOC_TYPES and
 * REQUIRED_DRIVER_DOC_TYPES are the source of truth.
 *
 * A document is submitted, not approved: POST /driver/me/documents always stores
 * status PENDING, and only an operator can change it. Nothing here pretends
 * otherwise - and the EXPIRED badge it can show is the server's own display
 * rule, not a local decision to invalidate anything.
 *
 * Order of operations, deliberate:
 *   1. dates (typed off the paper, validated locally)
 *   2. photo source
 *   3. upload + register
 * Asking for dates after the photo would throw the photo away on any typo.
 *
 * REBUILT ON THE REFERENCE: each slot is its own rounded-12 card with a
 * state-coloured rail down its leading edge, a 40px icon well, an uppercase
 * state label and a pill action - replacing the single bordered list. The
 * reference's "View" button is NOT built: the stored document has no client-side
 * viewer route yet, and a button that opens nothing is worse than no button.
 *
 * The state colour is DERIVED from the server status, so the rail cannot show
 * green for a document an operator has not approved.
 */
export function DocumentsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
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
    <View style={styles.root}>
      <StickyHeader
        onBackPress={navigation.canGoBack() ? navigation.goBack : undefined}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + HEADER_HEIGHT + SPACING.xl,
            paddingBottom: insets.bottom + SPACING.xxl,
          },
        ]}
      >
        <Text style={styles.heading}>{strings.documents.title}</Text>
        <Text style={styles.subtitle}>{strings.documents.subtitle}</Text>

        {/* Stitch's onboarding progress bar, fed by the real slot counts. */}
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.round(
                  ((REQUIRED_DRIVER_DOC_TYPES.length - missing.length) /
                    REQUIRED_DRIVER_DOC_TYPES.length) *
                    100,
                )}%`,
              },
            ]}
          />
        </View>

        {missing.length > 0 ? (
          <View style={styles.banner}>
            <Text style={styles.bannerTitle}>{p1.documents.missingTitle}</Text>
            {missing.map((type) => (
              <Text key={type} style={styles.bannerText}>
                {"\u2022 " + DOC_LABELS[type]}
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
          {DRIVER_DOC_SLOTS.map((type) => {
            const document = latestDocument(documents, type);
            const status = displayDocumentStatus(document);
            const required = REQUIRED_DRIVER_DOC_TYPES.some(
              (item) => item === type,
            );
            const tone = toneFor(status, required);

            return (
              <View key={type} style={[styles.card, SHADOW_CARD]}>
                <View style={[styles.rail, { backgroundColor: tone.color }]} />

                {/* Plain "row": mirrored by React Native under RTL. */}
                <View style={styles.cardHead}>
                  <View style={styles.slotIcon}>
                    <MaterialIcons
                      name={SLOT_ICONS[type] ?? "description"}
                      size={ICON_SIZE.lg}
                      color={COLORS.primaryFixedDim}
                    />
                  </View>
                  <View style={styles.slotText}>
                    <Text style={styles.slotTitle}>{DOC_LABELS[type]}</Text>
                    <View style={styles.stateRow}>
                      <MaterialIcons
                        name={tone.icon}
                        size={ICON_SIZE.md}
                        color={tone.color}
                      />
                      <Text style={[styles.stateText, { color: tone.color }]}>
                        {tone.label}
                      </Text>
                    </View>
                  </View>
                </View>

                <PillButton
                  label={
                    document
                      ? strings.documents.reupload
                      : strings.documents.upload
                  }
                  variant={document ? "secondary" : "primary"}
                  leadingIcon={document ? "replay" : "file-upload"}
                  loading={pending === type}
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
    </View>
  );
}

/**
 * State rail, glyph and label for one slot.
 *
 * The label is the server's own enum, not a translated invention: there is no
 * string key for "verified" or "expired" in the catalogue yet, and printing an
 * untranslated key would be worse than printing the status the API returned.
 * Flagged for the i18n pass.
 */
function toneFor(
  status: string | null | undefined,
  required: boolean,
): {
  color: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
} {
  switch (status) {
    case "APPROVED":
      return { color: SEMANTIC.success, icon: "check-circle", label: status };
    case "REJECTED":
    case "EXPIRED":
      return { color: COLORS.error, icon: "error", label: status };
    case "PENDING":
      return {
        color: COLORS.onSurfaceVariant,
        icon: "pending",
        label: status,
      };
    default:
      // Nothing uploaded yet: an empty REQUIRED slot is a blocker, an empty
      // optional one is not.
      return required
        ? { color: COLORS.error, icon: "error", label: p1.documents.missingTitle }
        : {
            color: COLORS.surfaceVariant,
            icon: "pending",
            label: p1.documents.missingTitle,
          };
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: SPACING.gutter },
  heading: {
    ...typo("headlineXl"),
    color: COLORS.onSurface,
    textAlign: textAlignStart(),
  },
  subtitle: {
    ...typo("bodyLg"),
    color: COLORS.onSurfaceVariant,
    textAlign: textAlignStart(),
    marginTop: SPACING.xs,
  },
  progressTrack: {
    height: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceVariant,
    marginTop: SPACING.lg,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryContainer,
  },
  banner: {
    marginTop: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    backgroundColor: alpha(COLORS.error, 0.12),
    borderWidth: 1,
    borderColor: alpha(COLORS.error, 0.4),
  },
  bannerTitle: {
    ...typo("labelMd"),
    color: COLORS.error,
    textAlign: textAlignStart(),
    marginBottom: SPACING.xs,
  },
  bannerText: {
    ...typo("bodyMd"),
    color: COLORS.onSurface,
    textAlign: textAlignStart(),
  },
  bannerOk: {
    marginTop: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    backgroundColor: alpha(SEMANTIC.success, 0.12),
    borderWidth: 1,
    borderColor: alpha(SEMANTIC.success, 0.4),
  },
  bannerOkText: {
    ...typo("bodyMd"),
    color: COLORS.onSurface,
    textAlign: textAlignStart(),
  },
  hint: {
    ...typo("labelSm"),
    color: COLORS.onSurfaceVariant,
    textAlign: textAlignStart(),
    marginTop: SPACING.md,
  },
  error: {
    ...typo("bodyMd"),
    color: COLORS.error,
    textAlign: textAlignStart(),
    marginTop: SPACING.lg,
  },
  notice: {
    ...typo("bodyMd"),
    color: SEMANTIC.success,
    textAlign: textAlignStart(),
    marginTop: SPACING.lg,
  },
  list: { marginTop: SPACING.xl, gap: SPACING.lg },
  /** Stitch `glass-panel rounded-xl p-4` with the rail clipped to the radius. */
  card: {
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 1,
    borderColor: alpha(COLORS.surfaceVariant, 0.6),
    padding: SPACING.lg,
    gap: SPACING.lg,
    overflow: "hidden",
  },
  /** Leading edge, so `start` rather than `left`: it flips with the layout. */
  rail: {
    position: "absolute",
    top: 0,
    bottom: 0,
    insetInlineStart: 0,
    width: RAIL_WIDTH,
  },
  cardHead: { flexDirection: "row", alignItems: "flex-start", gap: SPACING.md },
  slotIcon: {
    width: SLOT_ICON,
    height: SLOT_ICON,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceContainer,
  },
  slotText: { flex: 1, gap: SPACING.xs },
  slotTitle: {
    ...typo("titleMd"),
    color: COLORS.onSurface,
    textAlign: textAlignStart(),
  },
  stateRow: { flexDirection: "row", alignItems: "center", gap: SPACING.xs },
  stateText: { ...typo("labelSm"), letterSpacing: 1 },
});
