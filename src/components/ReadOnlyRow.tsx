import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { textAlignStart } from "../i18n";
import {
  radius,
  spacing,
  touchTarget,
  typography,
  usePalette,
  type Palette,
} from "../theme";

/**
 * A labelled value the driver can read but not change, with the reason under it.
 *
 * Every one of these exists because the SERVER refuses the edit, not because the
 * form was easier that way: the phone number is the identity Firebase
 * authenticates, the ride class is assigned during staff review, and the vehicle
 * verdict is review output. Showing the value with its reason is the honest
 * shape - hiding the field would leave the driver guessing why a car says
 * PENDING.
 *
 * PHASE 2: extracted from ProfileScreen when the vehicle block moved to its own
 * screen. The old version took its parent's StyleSheet as a `styles` prop, which
 * cannot serve two callers; it builds its own from the palette now.
 */
export function ReadOnlyRow({
  label,
  value,
  hint,
  ltr = false,
}: {
  label: string;
  value: string;
  hint: string;
  /** For Latin-script values such as an E.164 phone number. */
  ltr?: boolean;
}) {
  const palette = usePalette();
  const styles = useMemo(() => makeStyles(palette), [palette]);

  return (
    <View>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.readOnly}>
        <Text style={[styles.readOnlyValue, ltr ? styles.ltr : null]}>
          {value}
        </Text>
      </View>
      <Text style={styles.hint}>{hint}</Text>
    </View>
  );
}

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    fieldLabel: {
      ...typography.caption,
      color: palette.textSecondary,
      marginBottom: spacing.xs,
      textAlign: textAlignStart(),
    },
    readOnly: {
      minHeight: touchTarget.normal,
      justifyContent: "center",
      borderRadius: radius.md,
      backgroundColor: palette.surfaceSunken,
      borderWidth: 1,
      borderColor: palette.border,
      paddingHorizontal: spacing.lg,
    },
    readOnlyValue: {
      ...typography.body,
      color: palette.textSecondary,
      textAlign: textAlignStart(),
    },
    /**
     * writingDirection stays "ltr" so E.164 digits and a leading "+" are not
     * reordered by the bidi algorithm. The alignment is START rather than a
     * physical "left", because the value has to stay under its own label in
     * every language - the same call as SafetyScreen's rowPhone.
     */
    ltr: { textAlign: textAlignStart(), writingDirection: "ltr" },
    hint: {
      ...typography.caption,
      color: palette.textSecondary,
      marginTop: spacing.xs,
      textAlign: textAlignStart(),
    },
  });
