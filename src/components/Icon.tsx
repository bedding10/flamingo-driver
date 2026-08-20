import React from "react";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { I18nManager, type StyleProp, type TextStyle } from "react-native";

/**
 * PHASE 1 - the icon system.
 *
 * WHAT CHANGED AND WHY
 * The previous version drew 20 hand-written SVG paths. Stitch uses 137 distinct
 * Material Symbols names across its 53 screens, so a hand-drawn set could never
 * cover the reference and every missing glyph became an approximation (the call
 * affordance was rendering a speech bubble). This is now one icon FONT family
 * behind one component, so a new screen names an icon instead of asking for a
 * drawing.
 *
 * HONEST NOTE ON THE FAMILY
 * The owner asked for Material Symbols Outlined. That is a Google font that has
 * to be bundled as a file, and my build environment has no network access, so I
 * cannot add the genuine Material Symbols file in this commit. What ships here
 * is the outlined Material family Expo already bundles - MaterialCommunityIcons
 * from `@expo/vector-icons`, a transitive dependency of `expo`, so no install -
 * using its `-outline` variants, which is the same visual language (outlined,
 * 24px grid, rounded joins) as the reference.
 *
 * The mapping is centralised in `GLYPHS` for exactly this reason: switching to
 * the genuine Material Symbols Outlined font later is a change to this one file,
 * with no screen touched.
 *
 * The public API is unchanged - `<Icon name="star" size={22} color={...} />` -
 * so every existing call site keeps working, and every name they use is still a
 * valid `IconName`.
 *
 * DIRECTION (PHASE 1, R-11)
 * `GLYPHS` holds the LEFT-TO-RIGHT glyph for every name. The handful of names
 * that mean a direction rather than a thing - `chevron`, `back`, `forward` -
 * also appear in `MIRRORED`, and are swapped when the layout direction is RTL.
 * A call site therefore asks for a MEANING ("go deeper", "go back") and this
 * component picks the arrow that points the right way in the current language.
 *
 * Before this, `chevron` was hardcoded to `chevron-left` because the app was
 * Arabic-only and "forward" moved toward the left edge. That is wrong the
 * moment French or English is selectable, which they now are.
 */

export type IconName =
  // ---- names that already existed (kept, same meaning) -------------------
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
  | "check"
  // ---- added in PHASE 1, from the Stitch screens -------------------------
  | "chevronRight"
  | "back"
  | "forward"
  | "close"
  | "phone"
  | "chat"
  | "place"
  | "navigate"
  | "directions"
  | "myLocation"
  | "starOutline"
  | "starHalf"
  | "trophy"
  | "medal"
  | "fire"
  | "trending"
  | "payments"
  | "cash"
  | "card"
  | "bank"
  | "transfer"
  | "topUp"
  | "search"
  | "filter"
  | "refresh"
  | "warning"
  | "info"
  | "error"
  | "success"
  | "eye"
  | "eyeOff"
  | "flag"
  | "block"
  | "noConnection"
  | "power"
  | "camera"
  | "upload"
  | "image"
  | "calendar"
  | "edit"
  | "delete"
  | "more"
  | "plus"
  | "minus"
  | "settings"
  | "history"
  | "bellActive"
  | "people"
  | "help"
  | "verified"
  | "timer"
  | "speed"
  | "compass"
  | "bookmark"
  | "zone"
  | "sos"
  | "receipt"
  | "gift"
  | "negotiate"
  // vehicle features, chosen by the driver from the dashboard catalogue
  | "featureAc"
  | "featurePets"
  | "featureMusic"
  | "featureSmoking"
  | "featureWifi"
  | "featureLuggage";

type GlyphName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

/**
 * Semantic name -> glyph, written for a LEFT-TO-RIGHT layout. The app never
 * writes a glyph name at a call site, so a wrong or renamed glyph can only ever
 * be wrong in one place.
 */
const GLYPHS: Record<IconName, GlyphName> = {
  requests: "format-list-bulleted",
  map: "map-outline",
  menu: "menu",
  user: "account-outline",
  document: "file-document-outline",
  wallet: "wallet-outline",
  car: "car",
  bell: "bell-outline",
  support: "headset",
  shield: "shield-check-outline",
  legal: "gavel",
  logout: "logout",
  // "go deeper" / disclosure. Mirrored in RTL.
  chevron: "chevron-right",
  star: "star",
  share: "share-variant-outline",
  target: "crosshairs-gps",
  moon: "weather-night",
  sun: "white-balance-sunny",
  clock: "clock-outline",
  check: "check",

  // Physical by name: always points right, whatever the direction. Use
  // `chevron` for disclosure rows so they mirror correctly.
  chevronRight: "chevron-right",
  back: "arrow-left",
  forward: "arrow-right",
  close: "close",
  phone: "phone-outline",
  chat: "chat-outline",
  place: "map-marker-outline",
  navigate: "navigation-variant-outline",
  directions: "directions",
  myLocation: "crosshairs-gps",
  starOutline: "star-outline",
  starHalf: "star-half-full",
  trophy: "trophy-outline",
  medal: "medal-outline",
  fire: "fire",
  trending: "trending-up",
  payments: "cash-multiple",
  cash: "cash",
  card: "credit-card-outline",
  bank: "bank-outline",
  transfer: "swap-horizontal",
  topUp: "plus-circle-outline",
  search: "magnify",
  filter: "filter-variant",
  refresh: "refresh",
  warning: "alert-outline",
  info: "information-outline",
  error: "alert-circle-outline",
  success: "check-circle-outline",
  eye: "eye-outline",
  eyeOff: "eye-off-outline",
  flag: "flag-outline",
  block: "cancel",
  noConnection: "wifi-off",
  power: "power",
  camera: "camera-outline",
  upload: "file-upload-outline",
  image: "image-outline",
  calendar: "calendar-blank-outline",
  edit: "pencil-outline",
  delete: "delete-outline",
  more: "dots-vertical",
  plus: "plus",
  minus: "minus",
  settings: "cog-outline",
  history: "history",
  bellActive: "bell-badge-outline",
  people: "account-group-outline",
  help: "help-circle-outline",
  verified: "check-decagram",
  timer: "timer-outline",
  speed: "speedometer",
  compass: "compass-outline",
  bookmark: "bookmark-outline",
  zone: "map-marker-radius-outline",
  sos: "alert-octagon-outline",
  receipt: "receipt",
  gift: "gift-outline",
  negotiate: "swap-horizontal",

  featureAc: "snowflake",
  featurePets: "paw",
  featureMusic: "music-note-outline",
  featureSmoking: "smoking",
  featureWifi: "wifi",
  featureLuggage: "bag-suitcase-outline",
};

/**
 * The only names whose glyph depends on the layout direction. Everything absent
 * from this table renders identically in both directions - a wallet is a wallet.
 *
 * Deliberately NOT in here: `transfer` and `negotiate` (a symmetric two-way
 * arrow, correct either way), `trending` (a chart, not a pointer), `navigate`
 * and `directions` (map glyphs whose meaning is the vehicle heading, not the
 * reading order).
 */
const MIRRORED: Partial<Record<IconName, GlyphName>> = {
  chevron: "chevron-left",
  back: "arrow-right",
  forward: "arrow-left",
};

/**
 * Resolves a semantic name to the glyph that points the right way in the
 * current layout direction.
 *
 * `I18nManager.isRTL` is read at render time rather than captured in a module
 * constant. The value cannot change without a reload, so both are correct
 * today, but reading it here keeps the component honest if that ever changes.
 */
export function glyphFor(name: IconName): GlyphName {
  if (I18nManager.isRTL) {
    const mirrored = MIRRORED[name];
    if (mirrored) return mirrored;
  }
  return GLYPHS[name];
}

export function Icon({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconName;
  size?: number;
  color: string;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <MaterialCommunityIcons
      name={glyphFor(name)}
      size={size}
      color={color}
      style={style}
    />
  );
}
