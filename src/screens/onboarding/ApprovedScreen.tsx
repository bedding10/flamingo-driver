import React, { useMemo } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "../../components/Icon";
import { approvedStrings } from "../../i18n/strings.approved";
import { AppText, Button, ListRow } from "../../ui";
import {
  radius,
  spacing,
  usePalette,
  withAlpha,
  type Palette,
} from "../../theme";

/**
 * The moment the account turns APPROVED.
 *
 * Not a route. `ApprovalGate` renders it once, between the onboarding stack and
 * the working app, because approval is a transition rather than a destination -
 * there is nothing to come back to it for.
 *
 * It earns its place by answering "what now": the driver has just spent days
 * waiting on an operator, and the one thing they do not know is that being
 * approved is not the same as being online. Hence three next steps instead of
 * confetti alone.
 */
export function ApprovedScreen({ onContinue }: { onContinue: () => void }) {
  const insets = useSafeAreaInsets();
  const palette = usePalette();
  const styles = useMemo(() => makeStyles(palette), [palette]);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing["3xl"] },
        { paddingBottom: insets.bottom + spacing.xl },
      ]}
    >
      <AppText variant="caption" tone="secondary">
        {approvedStrings.brand}
      </AppText>

      <View style={styles.seal}>
        <Icon name="check" size={36} color={palette.online} />
      </View>

      <AppText variant="display" style={styles.centered}>
        {approvedStrings.title}
      </AppText>
      <AppText variant="body" tone="secondary" style={styles.centered}>
        {approvedStrings.subtitle}
      </AppText>

      <View style={styles.steps}>
        <AppText variant="caption" tone="secondary">
          {approvedStrings.nextTitle}
        </AppText>

        <ListRow
          icon="car"
          iconTone="success"
          title={approvedStrings.stepOnline}
          subtitle={approvedStrings.stepOnlineHint}
        />
        <ListRow
          icon="negotiate"
          iconTone="brand"
          title={approvedStrings.stepRequests}
          subtitle={approvedStrings.stepRequestsHint}
        />
        <ListRow
          icon="receipt"
          iconTone="neutral"
          title={approvedStrings.stepDocuments}
          subtitle={approvedStrings.stepDocumentsHint}
        />
      </View>

      <Button
        label={approvedStrings.cta}
        icon="check"
        glow
        onPress={onContinue}
        style={styles.cta}
      />
    </ScrollView>
  );
}

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: palette.background },
    content: {
      flexGrow: 1,
      paddingHorizontal: spacing.xl,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.md,
    },
    seal: {
      width: 96,
      height: 96,
      borderRadius: radius.pill,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: withAlpha(palette.online, 0.14),
      borderWidth: 1,
      borderColor: withAlpha(palette.online, 0.45),
      marginVertical: spacing.lg,
    },
    centered: { textAlign: "center" },
    steps: { alignSelf: "stretch", gap: spacing.sm, marginTop: spacing.xl },
    cta: { alignSelf: "stretch", marginTop: spacing["2xl"] },
  });
