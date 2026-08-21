import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
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
import { alpha, RADIUS, SPACING, typo } from "../../theme/tokens";
import { useTokens, type Tokens } from "../../theme/useTokens";
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
const PROGRESS_HEIGHT = 6;

/**
 * The 12% / 40% washes that make the two banners readable on #101415 are barely
 * visible on the light #fff8f8 background, so both are raised per scheme.
 */
const BANNER_WASH = { dark: 0.12, light: 0.16 } as const;
const BANNER_BORDER = { dark: 0.4, light: 0.55 } as const;

/** One glyph per slot, mirroring the reference's id_card / car / shield set. */
const SLOT_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  LICENSE: "badge",
  // The ID_CARD slot carries the VTC permit (see SLOT_LABELS below).
  ID_CARD: "assignment-ind",
  INSURANCE: "shield",
  REGISTRATION: "directions-car",
  PROFILE_PHOTO: "person",
};

/**
 * Slot titles.
 *
 * Only ONE deviates from DOC_LABELS: Stitch asks for a VTC permit, which the
 * backend does not model at all. Rather than invent a DocumentType the server
 * would reject, the permit takes over the ID-card slot - the label changes, the
 * wire value stays DocumentType.ID_CARD.
 */
const SLOT_LABELS: Partial<Record<DocumentType, string>> = {
  ID_CARD: "\u0631\u062e\u0635\u0629 \u0627\u0644\u0646\u0642\u0644 (VTC)",
};

/**
 * State labels.
 *
 * These used to print the server enum verbatim (APPROVED / PENDING / ...). They
 * are kept in this file instead of src/i18n/strings.ts on purpose: that
 * catalogue must not be rewritten, and these six strings are used nowhere else.
 */
const STATE_LABELS = {
  APPROVED: "\u0645\u0648\u062b\u0651\u0642\u0629",
  PENDING:
    "\u0642\u064a\u062f \u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629",
  REJECTED: "\u0645\u0631\u0641\u0648\u0636\u0629",
  EXPIRED:
    "\u0645\u0646\u062a\u0647\u064a\u0629 \u0627\u0644\u0635\u0644\u0627\u062d\u064a\u0629",
  MISSING_REQUIRED: "\u0645\u0637\u0644\u0648\u0628\u0629",
  MISSING_OPTIONAL: "\u0627\u062e\u062a\u064a\u0627\u0631\u064a\u0629",
} as const;

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
 *
 * THEME: every colour comes from useTokens(), so the screen follows the
 * dark/light switch.
 */
export function DocumentsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { data: profile } = useDriverProfile();
  const { submit, pending, error, clearError } = useDocumentUpload();
  const [notice, setNotice] = useState<string | null>(null);
  const [datesFor, setDatesFor] = useState<DocumentType | null>(null);
  const t = useTokens();
  const styles = useMemo(() => makeStyles(t), [t]);

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

  const labelFor = (type: DocumentType) => SLOT_LABELS[type] ?? DOC_LABELS[type];

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
                {"\u2022 " + labelFor(type)}
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
            const tone = toneFor(t, status, required);

            return (
              <View key={type} style={[styles.card, t.shadowCard]}>
                <View style={[styles.rail, { backgroundColor: tone.color }]} />

                {/* Plain "row": mirrored by React Native under RTL. */}
                <View style={styles.cardHead}>
                  <View style={styles.slotIcon}>
                    <MaterialIcons
                      name={SLOT_ICONS[type] ?? "description"}
                      size={t.iconSize.lg}
                      color={t.colors.primary}
                    />
                  </View>
                  <View style={styles.slotText}>
                    <Text style={styles.slotTitle}>{labelFor(type)}</Text>
                    <View style={styles.stateRow}>
                      <MaterialIcons
                        name={tone.icon}
                        size={t.iconSize.md}
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
 * State rail, glyph and label for one slot. The colour is derived from the
 * server status only, so an unapproved document can never render green.
 */
function toneFor(
  t: Tokens,
  status: string | null | undefined,
  required: boolean,
): {
  color: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
} {
  switch (status) {
    case "APPROVED":
      return {
        color: t.semantic.success,
        icon: "check-circle",
        label: STATE_LABELS.APPROVED,
      };
    case "REJECTED":
      return {
        color: t.colors.error,
        icon: "error",
        label: STATE_LABELS.REJECTED,
      };
    case "EXPIRED":
      return {
        color: t.colors.error,
        icon: "event-busy",
        label: STATE_LABELS.EXPIRED,
      };
    case "PENDING":
      return {
        color: t.colors.onSurfaceVariant,
        icon: "pending",
        label: STATE_LABELS.PENDING,
      };
    default:
      // Nothing uploaded yet: an empty REQUIRED slot is a blocker, an empty
      // optional one is not.
      return required
        ? {
            color: t.colors.error,
            icon: "error",
            label: STATE_LABELS.MISSING_REQUIRED,
          }
        : {
            // surfaceVariant is almost the light background, so the rail would
            // vanish there; outline is the role that reads in both schemes.
            color:
              t.mode === "light" ? t.colors.outline : t.colors.surfaceVariant,
            icon: "pending",
            label: STATE_LABELS.MISSING_OPTIONAL,
          };
  }
}

function makeStyles(t: Tokens) {
  const light = t.mode === "light";
  const wash = BANNER_WASH[light ? "light" : "dark"];
  const border = BANNER_BORDER[light ? "light" : "dark"];

  return StyleSheet.create({
    root: { flex: 1, backgroundColor: t.colors.background },
    content: { paddingHorizontal: SPACING.gutter },
    heading: {
      ...typo("headlineXl"),
      color: t.colors.onSurface,
      textAlign: textAlignStart(),
    },
    subtitle: {
      ...typo("bodyLg"),
      color: t.colors.onSurfaceVariant,
      textAlign: textAlignStart(),
      marginTop: SPACING.xs,
    },
    progressTrack: {
      height: PROGRESS_HEIGHT,
      borderRadius: RADIUS.full,
      backgroundColor: light
        ? t.colors.outlineVariant
        : t.colors.surfaceVariant,
      marginTop: SPACING.lg,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      borderRadius: RADIUS.full,
      backgroundColor: t.colors.primaryContainer,
    },
    banner: {
      marginTop: SPACING.lg,
      padding: SPACING.lg,
      borderRadius: RADIUS.xl,
      backgroundColor: alpha(t.colors.error, wash),
      borderWidth: 1,
      borderColor: alpha(t.colors.error, border),
    },
    bannerTitle: {
      ...typo("labelMd"),
      color: t.colors.error,
      textAlign: textAlignStart(),
      marginBottom: SPACING.xs,
    },
    bannerText: {
      ...typo("bodyMd"),
      color: t.colors.onSurface,
      textAlign: textAlignStart(),
    },
    bannerOk: {
      marginTop: SPACING.lg,
      padding: SPACING.lg,
      borderRadius: RADIUS.xl,
      backgroundColor: alpha(t.semantic.success, wash),
      borderWidth: 1,
      borderColor: alpha(t.semantic.success, border),
    },
    bannerOkText: {
      ...typo("bodyMd"),
      color: t.colors.onSurface,
      textAlign: textAlignStart(),
    },
    hint: {
      ...typo("labelSm"),
      color: t.colors.onSurfaceVariant,
      textAlign: textAlignStart(),
      marginTop: SPACING.md,
    },
    error: {
      ...typo("bodyMd"),
      color: t.colors.error,
      textAlign: textAlignStart(),
      marginTop: SPACING.lg,
    },
    notice: {
      ...typo("bodyMd"),
      color: t.semantic.success,
      textAlign: textAlignStart(),
      marginTop: SPACING.lg,
    },
    list: { marginTop: SPACING.xl, gap: SPACING.lg },
    /** Stitch `glass-panel rounded-xl p-4` with the rail clipped to the radius. */
    card: {
      borderRadius: RADIUS.xl,
      backgroundColor: t.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: light
        ? t.colors.outlineVariant
        : alpha(t.colors.surfaceVariant, 0.6),
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
    cardHead: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: SPACING.md,
    },
    slotIcon: {
      width: SLOT_ICON,
      height: SLOT_ICON,
      borderRadius: RADIUS.full,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: t.colors.surfaceContainer,
    },
    slotText: { flex: 1, gap: SPACING.xs },
    slotTitle: {
      ...typo("titleMd"),
      color: t.colors.onSurface,
      textAlign: textAlignStart(),
    },
    stateRow: { flexDirection: "row", alignItems: "center", gap: SPACING.xs },
    stateText: { ...typo("labelSm"), letterSpacing: 1 },
  });
}
