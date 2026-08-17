import React from "react";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import type { StyleProp, TextStyle } from "react-native";

/**
 * PHASE 1 - the icon system.
 *
 * WHAT CHANGED AND WHY
 * The previous version drew 20 hand-written SVG paths. Stitch uses 117 distinct
 * Material Symbols names across its 38 screens, so a hand-drawn set could never
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
 * so all eight existing call sites keep working, and every name they use is
 * still a valid `IconName`.
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
 * Semantic name -> glyph. The app never writes a glyph name at a call site, so
 * a wrong or renamed glyph can only ever be wrong in one place.
 *
 * `chevron` points LEFT: in an Arabic layout "forward" moves toward the left
 * edge, and every existing call site relies on that.
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
  chevron: "chevron-left",
  star: "star",
  share: "share-variant-outline",
  target: "crosshairs-gps",
  moon: "weather-night",
  sun: "white-balance-sunny",
  clock: "clock-outline",
  check: "check",

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
      name={GLYPHS[name]}
      size={size}
      color={color}
      style={style}
    />
  );
}
