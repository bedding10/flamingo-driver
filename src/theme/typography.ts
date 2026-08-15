import { Platform } from "react-native";

/**
 * System fonts only.
 *
 * The passenger app loads Poppins + Cairo, which costs roughly 400 KB and a
 * font gate at boot. The driver app is opened dozens of times a day on
 * entry-level hardware, so it spends that budget on boot speed instead.
 * Nothing here blocks the first frame.
 */
const family = Platform.select({ ios: "System", default: "sans-serif" });
const familyMedium = Platform.select({
  ios: "System",
  default: "sans-serif-medium",
});

export const typography = {
  display: { fontFamily: familyMedium, fontSize: 34, fontWeight: "700" as const, lineHeight: 40 },
  title: { fontFamily: familyMedium, fontSize: 22, fontWeight: "700" as const, lineHeight: 28 },
  subtitle: { fontFamily: familyMedium, fontSize: 17, fontWeight: "600" as const, lineHeight: 24 },
  body: { fontFamily: family, fontSize: 15, fontWeight: "400" as const, lineHeight: 22 },
  label: { fontFamily: familyMedium, fontSize: 13, fontWeight: "600" as const, lineHeight: 18 },
  caption: { fontFamily: family, fontSize: 12, fontWeight: "400" as const, lineHeight: 16 },
  /** Fare, countdown, earnings: numbers read at a glance. */
  numeric: { fontFamily: familyMedium, fontSize: 28, fontWeight: "700" as const, lineHeight: 34 },
} as const;
