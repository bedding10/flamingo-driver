import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BrandMark } from "../../components/BrandMark";
import { config } from "../../config";
import { legalStrings } from "../../i18n/strings.phase7";
import { colors, radius, spacing, typography } from "../../theme";

/**
 * PHASE 7 - terms, privacy and the build identity.
 *
 * The text describes what this app actually does, verified against the code:
 * location is published only while ONLINE or ON_TRIP (the tracking effect on
 * the home screen stops it otherwise), documents go to project storage and are
 * read by staff, the wallet is a ledger the app cannot write to, and emergency
 * contacts are used only by the SOS fan-out. Nothing here links to a page that
 * does not exist: there is no hosted terms URL in this project's config, and
 * inventing one would be a dead link inside a legal screen.
 *
 * The version block reads the NATIVE values through config.app, so what the
 * driver reports to support is what the store actually installed.
 */
export function LegalScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + spacing["3xl"] },
      ]}
    >
      <Section title={legalStrings.termsTitle} body={legalStrings.termsBody} />
      <Section
        title={legalStrings.privacyTitle}
        body={legalStrings.privacyBody}
      />
      <Section title={legalStrings.dataTitle} body={legalStrings.dataBody} />
      <Section
        title={legalStrings.supportTitle}
        body={legalStrings.supportBody}
      />

      <View style={styles.card}>
        <Text style={styles.title}>{legalStrings.versionTitle}</Text>
        <Text style={styles.mono}>{config.app.version}</Text>
        <Text style={styles.mono}>
          {legalStrings.buildLabel + ": " + (config.app.build ?? "\u2014")}
        </Text>
        <Text style={styles.mono}>
          {legalStrings.packageLabel + ": " + config.app.bundleId}
        </Text>
      </View>

      <BrandMark compact style={styles.brand} />
    </ScrollView>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  content: { padding: spacing.xl, gap: spacing.md },
  card: {
    backgroundColor: colors.surfaceDark,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    ...typography.subtitle,
    color: colors.gold,
    textAlign: "right",
    writingDirection: "rtl",
  },
  body: {
    ...typography.body,
    color: colors.textOnDarkSecondary,
    textAlign: "right",
    writingDirection: "rtl",
  },
  mono: {
    ...typography.caption,
    color: colors.textOnDarkSecondary,
    textAlign: "left",
    writingDirection: "ltr",
  },
  brand: { alignSelf: "center", marginTop: spacing.md },
});
