import { create } from "zustand";
import type { RideOffer, Trip, TripStatus } from "../types/trip";
import { isTerminalTripStatus } from "../types/trip";

type TripState = {
  /** The offer currently on screen, if any. One at a time by design. */
  offer: RideOffer | null;
  currentTrip: Trip | null;
  setOffer: (offer: RideOffer | null) => void;
  /** Drops the offer only if it is the one that expired. */
  expireOffer: (tripId: string) => void;
  setCurrentTrip: (trip: Trip | null) => void;
  applyStatus: (tripId: string, status: TripStatus) => void;
  clear: () => void;
};

export const useTripStore = create<TripState>((set, get) => ({
  offer: null,
  currentTrip: null,

  setOffer: (offer) => set({ offer }),

  // Guarded on tripId: a late ride:offer_expired for a previous offer must not
  // wipe the fresh one the driver is about to accept.
  expireOffer: (tripId) => {
    if (get().offer?.tripId === tripId) set({ offer: null });
  },

  setCurrentTrip: (currentTrip) => set({ currentTrip }),

  applyStatus: (tripId, status) => {
    const current = get().currentTrip;
    if (!current || current.id !== tripId) return;
    // Terminal statuses clear the trip so the home screen can never stay stuck
    // on a finished ride - the exact bug that had to be fixed in the passenger
    // app twice.
    set({
      currentTrip: isTerminalTripStatus(status) ? null : { ...current, status },
    });
  },

  clear: () => set({ offer: null, currentTrip: null }),
}));
