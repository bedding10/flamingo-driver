import React from "react";
import Svg, { Circle, Path } from "react-native-svg";
import type { StyleProp, ViewStyle } from "react-native";

/**
 * PHASE 7.5 - the icon set.
 *
 * Before this, navigation and menu rows used single glyph characters
 * (\u2261, \u25CE, \u25A4) and an emoji for the brand. Those render at a
 * different weight on every device font and cannot be coloured or sized
 * consistently, which is exactly why the interface looked improvised.
 *
 * These are stroke icons drawn as SVG paths on a 24x24 grid, one visual family,
 * one stroke width, taking their colour from the theme. react-native-svg is
 * already a dependency (ProfileAvatar renders the level frames with it), so no
 * new package and no icon font is introduced.
 *
 * `chevron` points LEFT because the app is RTL: "forward" in an Arabic layout
 * moves toward the left edge.
 */
export type IconName =
  | "requests"
  | "map"
  | "menu"
  | "user"
  | "document"
  | "wallet"
  | "car"
  | "bell"
  | "support"
  | "shield"
  | "legal"
  | "logout"
  | "chevron"
  | "star"
  | "share"
  | "target"
  | "moon"
  | "sun"
  | "clock"
  | "check";

const PATHS: Record<IconName, string[]> = {
  requests: [
    "M8 6h13",
    "M8 12h13",
    "M8 18h13",
    "M3 6h.01",
    "M3 12h.01",
    "M3 18h.01",
  ],
  map: [
    "M1 6l7-3 8 3 7-3v15l-7 3-8-3-7 3z",
    "M8 3v15",
    "M16 6v15",
  ],
  menu: ["M3 6h18", "M3 12h18", "M3 18h18"],
  user: ["M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"],
  document: [
    "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z",
    "M14 2v6h6",
    "M9 13h6",
    "M9 17h6",
  ],
  wallet: [
    "M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
    "M3 11h18",
    "M16 15h2",
  ],
  car: [
    "M3 14l1.7-5.1A2 2 0 0 1 6.6 7.5h10.8a2 2 0 0 1 1.9 1.4L21 14v4h-2.2",
    "M3 18v-4",
    "M5.2 18h9.6",
    "M4 14h16",
  ],
  bell: [
    "M18 9a6 6 0 1 0-12 0c0 6-2.5 8-2.5 8h17S18 15 18 9",
    "M13.7 21a2 2 0 0 1-3.4 0",
  ],
  support: [
    "M21 15a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z",
    "M9.5 9.5a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.1.9-1.1 1.6",
  ],
  shield: ["M12 22s8-4 8-10V5.5L12 2.5 4 5.5V12c0 6 8 10 8 10z", "M9 12l2 2 4-4"],
  legal: [
    "M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z",
    "M4 17h16",
    "M9 7h7",
  ],
  logout: ["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "M16 17l5-5-5-5", "M21 12H9"],
  chevron: ["M15 18l-6-6 6-6"],
  star: [
    "M12 3l2.9 5.9 6.1.9-4.5 4.3 1.1 6-5.6-3-5.6 3 1.1-6L3 9.8l6.1-.9z",
  ],
  share: [
    "M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7",
    "M16 6l-4-4-4 4",
    "M12 2v13",
  ],
  target: ["M12 2v3", "M12 19v3", "M2 12h3", "M19 12h3"],
  moon: ["M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z"],
  sun: [
    "M12 2v2",
    "M12 20v2",
    "M2 12h2",
    "M20 12h2",
    "M4.9 4.9l1.4 1.4",
    "M17.7 17.7l1.4 1.4",
    "M4.9 19.1l1.4-1.4",
    "M17.7 6.3l1.4-1.4",
  ],
  clock: ["M12 7v5l3 2"],
  check: ["M20 6L9 17l-5-5"],
};

/** Circles are separate so a stroke path never has to fake one. */
const CIRCLES: Partial<Record<IconName, Array<[number, number, number]>>> = {
  user: [[12, 7, 4]],
  car: [
    [7, 18, 1.8],
    [17, 18, 1.8],
  ],
  target: [
    [12, 12, 7],
    [12, 12, 1.6],
  ],
  clock: [[12, 12, 9]],
};

export function Icon({
  name,
  size = 24,
  color,
  strokeWidth = 1.8,
  style,
}: {
  name: IconName;
  size?: number;
  color: string;
  strokeWidth?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={style}
    >
      {PATHS[name].map((d) => (
        <Path
          key={d}
          d={d}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {(CIRCLES[name] ?? []).map(([cx, cy, r]) => (
        <Circle
          key={String(cx) + ":" + String(cy) + ":" + String(r)}
          cx={cx}
          cy={cy}
          r={r}
          stroke={color}
          strokeWidth={strokeWidth}
        />
      ))}
    </Svg>
  );
}
