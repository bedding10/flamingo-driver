import { create } from "zustand";

export type DriverFix = {
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  /** Device timestamp in ms, used to drop stale fixes. */
  timestamp: number;
};

type LocationState = {
  permission: "unknown" | "granted" | "denied";
  fix: DriverFix | null;
  setPermission: (permission: LocationState["permission"]) => void;
  setFix: (fix: DriverFix) => void;
  reset: () => void;
};

/**
 * Holds only the LAST fix.
 *
 * A driver phone produces a fix every few seconds for hours. Keeping a trail in
 * state would grow without bound and re-render the map on every append; the
 * server already persists the track (TRACK_PERSIST_INTERVAL_SEC = 4) and
 * exposes it through GET /driver/trips/:id/track.
 */
export const useLocationStore = create<LocationState>((set) => ({
  permission: "unknown",
  fix: null,
  setPermission: (permission) => set({ permission }),
  setFix: (fix) => set({ fix }),
  reset: () => set({ fix: null }),
}));
