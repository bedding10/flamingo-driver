import { create } from "zustand";
import type { DriverAvailability, DriverProfile } from "../types/driver";
import {
  CACHE_KEYS,
  readCachedJson,
  writeCachedJson,
} from "../services/storage.service";

type DriverState = {
  profile: DriverProfile | null;
  /** Mirrors profile.availability but is written optimistically by the toggle. */
  availability: DriverAvailability;
  setProfile: (profile: DriverProfile) => void;
  setAvailability: (availability: DriverAvailability) => void;
  reset: () => void;
};

/**
 * `online` is intentionally NOT stored as a boolean.
 *
 * The server has three availability values and ON_TRIP is not "online plus a
 * flag": while it is set, the server rejects availability changes. Keeping the
 * enum makes that state impossible to lose.
 */
export const useDriverStore = create<DriverState>((set) => ({
  // A cached profile lets the home screen render the car and status instantly
  // on a cold start instead of flashing an empty shell.
  profile: readCachedJson<DriverProfile>(CACHE_KEYS.driverProfile),
  availability:
    readCachedJson<DriverProfile>(CACHE_KEYS.driverProfile)?.availability ??
    "OFFLINE",

  setProfile: (profile) => {
    writeCachedJson(CACHE_KEYS.driverProfile, profile);
    set({ profile, availability: profile.availability });
  },

  setAvailability: (availability) => set({ availability }),

  reset: () => set({ profile: null, availability: "OFFLINE" }),
}));

/** Derived selector: the server only allows going online when APPROVED. */
export const canGoOnline = (state: DriverState) =>
  state.profile?.status === "APPROVED";

export const isOnline = (state: DriverState) =>
  state.availability === "ONLINE" || state.availability === "ON_TRIP";
