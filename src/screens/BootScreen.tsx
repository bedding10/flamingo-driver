import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "../theme";

/** Shown while the keystore is read. Deliberately cheap: no images, no fonts. */
export function BootScreen() {
  return (
    <View style={styles.root}>
      <Text style={styles.brand}>flaminGO</Text>
      <Text style={styles.role}>DRIVER</Text>
      <ActivityIndicator color={colors.gold} style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.ink,
  },
  brand: { ...typography.display, color: colors.gold },
  role: {
    ...typography.label,
    color: colors.textOnDarkSecondary,
    letterSpacing: 4,
    marginTop: spacing.xs,
  },
  spinner: { marginTop: spacing["3xl"] },
});
