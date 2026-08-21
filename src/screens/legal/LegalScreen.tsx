/**
 * LegalScreen — terms and privacy, published from the dashboard only.
 *
 * The app used to ship its own legal copy inside legalStrings. It no longer
 * does: every paragraph now comes from GET /public/legal?audience=DRIVER, i.e.
 * from LegalDocument rows the operator writes and publishes in the admin panel.
 * That way the terms can change without shipping a new build, which is also
 * what the app stores expect (an in-app, always-reachable terms and privacy
 * page).
 *
 * legalStrings is still used, but only for the screen chrome (title, build card
 * labels). Its old termsBody / privacyBody / dataBody / supportBody constants
 * are deliberately no longer rendered — they mentioned an SOS system that no
 * longer exists in this app.
 *
 * Theming: converted to useTokens(), so this screen finally honours light mode
 * instead of the dark-only flat colours it used before.
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { legalApi, toApiError } from "../../api";
import type { PublicLegalDocument } from "../../api/legal.api";
import { config } from "../../config";
import { textAlignStart } from "../../i18n";
import { legalStrings } from "../../i18n/strings.phase7";
import { RADIUS, SPACING, alpha, typo } from "../../theme/tokens";
import { useTokens, type Tokens } from "../../theme/useTokens";
import { PillButton } from "../../ui";

/** Screen copy that is not legal text, so it stays in the build. */
const COPY = {
  loading: "جارٍ تحميل الشروط والخصوصية من الخادم…",
  failed: "تعذّر تحميل الشروط والخصوصية. تحقّق من الاتصال ثم أعد المحاولة.",
  retry: "إعادة المحاولة",
  empty:
    "لم تُنشر بعد أي مستندات قانونية من لوحة التحكم. تُكتب الشروط وسياسة الخصوصية في اللوحة ثم تظهر هنا تلقائيًا.",
  managedHint: "يُحرّر هذا النص من لوحة التحكم عبر الخادم.",
  versionTag: "النسخة",
  effectiveAt: "يسري من",
} as const;

/** Reading order: the two documents the stores ask for come first. */
const TYPE_ORDER: PublicLegalDocument["type"][] = [
  "TERMS_OF_SERVICE",
  "PRIVACY_POLICY",
  "DRIVER_AGREEMENT",
  "COOKIE_POLICY",
  "REFUND_POLICY",
];

function sortDocuments(items: PublicLegalDocument[]): PublicLegalDocument[] {
  return [...items].sort(
    (a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type),
  );
}

/** Dates arrive as ISO strings; only the day matters on this screen. */
function formatDay(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

export function LegalScreen() {
  const t = useTokens();
  const styles = useMemo(() => makeStyles(t), [t]);

  const [documents, setDocuments] = useState<PublicLegalDocument[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await legalApi.fetchPublicLegalDocuments();
      setDocuments(sortDocuments(items));
    } catch (caught) {
      setError(toApiError(caught).message || COPY.failed);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    // The same body as `load`, but guarded so a fast back-navigation cannot
    // write state into an unmounted screen.
    (async () => {
      try {
        const items = await legalApi.fetchPublicLegalDocuments();
        if (active) setDocuments(sortDocuments(items));
      } catch (caught) {
        if (active) setError(toApiError(caught).message || COPY.failed);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {loading ? (
        <View style={styles.card}>
          <ActivityIndicator color={t.colors.primary} />
          <Text style={[styles.body, textAlignStart()]}>{COPY.loading}</Text>
        </View>
      ) : null}

      {!loading && error ? (
        <View style={styles.card}>
          <Text style={[styles.title, textAlignStart()]}>
            {legalStrings.title}
          </Text>
          <Text style={[styles.body, textAlignStart()]}>{error}</Text>
          <PillButton
            label={COPY.retry}
            variant="secondary"
            onPress={load}
            style={styles.retry}
          />
        </View>
      ) : null}

      {!loading && !error && documents && documents.length === 0 ? (
        <View style={styles.card}>
          <Text style={[styles.title, textAlignStart()]}>
            {legalStrings.title}
          </Text>
          <Text style={[styles.body, textAlignStart()]}>{COPY.empty}</Text>
        </View>
      ) : null}

      {!loading && !error
        ? (documents ?? []).map((doc) => {
            const effective = formatDay(doc.effectiveAt ?? doc.publishedAt);
            return (
              <View key={doc.id} style={styles.card}>
                <Text style={[styles.title, textAlignStart()]}>
                  {doc.title}
                </Text>
                <Text style={[styles.meta, textAlignStart()]}>
                  {COPY.versionTag} {doc.version}
                  {effective ? "  ·  " + COPY.effectiveAt + " " + effective : ""}
                </Text>
                {doc.summary ? (
                  <Text style={[styles.summary, textAlignStart()]}>
                    {doc.summary}
                  </Text>
                ) : null}
                <Text style={[styles.body, textAlignStart()]}>{doc.body}</Text>
              </View>
            );
          })
        : null}

      {!loading && !error ? (
        <Text style={[styles.hint, textAlignStart()]}>{COPY.managedHint}</Text>
      ) : null}

      <View style={styles.card}>
        <Text style={[styles.title, textAlignStart()]}>
          {legalStrings.versionTitle}
        </Text>
        <Text style={styles.mono}>{config.app.version}</Text>
        <Text style={styles.mono}>
          {legalStrings.buildLabel}: {config.app.build}
        </Text>
        <Text style={styles.mono}>
          {legalStrings.packageLabel}: {config.app.bundleId}
        </Text>
      </View>
    </ScrollView>
  );
}

function makeStyles(t: Tokens) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: t.colors.background },
    content: {
      padding: t.spacing.container,
      paddingBottom: t.spacing.xxl * 2,
      gap: t.spacing.lg,
    },
    card: {
      backgroundColor: t.colors.surfaceContainer,
      borderRadius: RADIUS.card,
      borderWidth: 1,
      borderColor: t.colors.outlineVariant,
      padding: SPACING.xl,
      gap: SPACING.md,
      ...t.shadowCard,
    },
    title: { ...typo("title-md"), color: t.colors.onSurface },
    meta: { ...typo("label-sm"), color: t.colors.onSurfaceVariant },
    summary: {
      ...typo("label-md"),
      color: t.colors.onSurface,
      backgroundColor: alpha(t.colors.primaryContainer, 0.12),
      borderRadius: RADIUS.lg,
      padding: SPACING.md,
    },
    body: { ...typo("body-md"), color: t.colors.onSurfaceVariant },
    hint: { ...typo("label-sm"), color: t.colors.onSurfaceVariant },
    retry: { alignSelf: "flex-start" },
    // Build identity is an identifier, never mirrored, even in an RTL layout.
    mono: {
      ...typo("label-md"),
      color: t.colors.onSurfaceVariant,
      textAlign: "left",
      writingDirection: "ltr",
    },
  });
}

export default LegalScreen;
