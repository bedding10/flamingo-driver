import { Platform } from "react-native";

/**
 * Type scale, aligned with the passenger app's design system.
 *
 * PHASE 7: sizes, weights and letter spacing now match
 * passenger `src/design/theme.ts` token for token, so a heading in one app is
 * the same heading in the other. The tokens the passenger app has and this app
 * lacked (`banner`, `headline`, `menuItem`) are added; the driver-only tokens
 * (`label`, `numeric`) are kept because a fare, a countdown and an earnings
 * figure have no equivalent in the passenger UI.
 *
 * FONT FAMILY - deliberate, documented divergence:
 * the passenger app loads Poppins + Cairo, roughly 400 KB plus a font gate at
 * boot. The driver app is opened dozens of times a day on entry-level hardware
 * and spends that budget on boot speed instead, so it uses the system face.
 * Nothing here blocks the first frame. The weights below keep headings heavy on
 * the Arabic system face too, which is what carries the shared identity.
 */
const family = Platform.select({ ios: "System", default: "sans-serif" });
const familyMedium = Platform.select({
  ios: "System",
  default: "sans-serif-medium",
});

export const typography = {
  /** Huge banner headline. Matches passenger `banner`. */
  banner: {
    fontFamily: familyMedium,
    fontSize: 30,
    fontWeight: "900" as const,
    lineHeight: 34,
    letterSpacing: -0.4,
  },
  display: {
    fontFamily: familyMedium,
    fontSize: 30,
    fontWeight: "900" as const,
    lineHeight: 36,
    letterSpacing: -0.6,
  },
  headline: {
    fontFamily: familyMedium,
    fontSize: 24,
    fontWeight: "800" as const,
    lineHeight: 29,
    letterSpacing: -0.4,
  },
  /** Menu entries, matching the passenger drawer. */
  menuItem: {
    fontFamily: familyMedium,
    fontSize: 24,
    fontWeight: "800" as const,
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  title: {
    fontFamily: familyMedium,
    fontSize: 18,
    fontWeight: "700" as const,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontFamily: familyMedium,
    fontSize: 16,
    fontWeight: "600" as const,
    lineHeight: 22,
  },
  body: {
    fontFamily: family,
    fontSize: 15,
    fontWeight: "600" as const,
    lineHeight: 21,
  },
  label: {
    fontFamily: familyMedium,
    fontSize: 13,
    fontWeight: "700" as const,
    lineHeight: 18,
  },
  caption: {
    fontFamily: family,
    fontSize: 12.5,
    fontWeight: "600" as const,
    lineHeight: 16,
  },
  /** Fare, countdown, earnings: numbers read at a glance. Driver-only. */
  numeric: {
    fontFamily: familyMedium,
    fontSize: 28,
    fontWeight: "800" as const,
    lineHeight: 34,
    letterSpacing: -0.4,
  },
} as const;

export type TypeToken = keyof typeof typography;
