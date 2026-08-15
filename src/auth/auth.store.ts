import { create } from "zustand";
import { authApi } from "../api";
import { clearTokens, saveTokens, tokens } from "../services/storage.service";
import type { AuthUser } from "../types/driver";
import { useDriverStore } from "../stores/driver.store";
import { useTripStore } from "../stores/trip.store";
import { useLocationStore } from "../stores/location.store";
import { signOutFirebase } from "./firebase";

export type AuthStatus =
  /** Reading the keystore; the UI shows the boot screen. */
  | "loading"
  | "authenticated"
  | "unauthenticated";

type AuthState = {
  status: AuthStatus;
  user: AuthUser | null;
  /** Reads stored tokens once at launch and validates them against /auth/me. */
  bootstrap: () => Promise<void>;
  /** Stores tokens from POST /auth/firebase and loads the account. */
  signIn: (input: {
    accessToken: string;
    refreshToken: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
};

function resetDomainStores() {
  useDriverStore.getState().reset();
  useTripStore.getState().clear();
  useLocationStore.getState().reset();
}

export const useAuthStore = create<AuthState>((set) => ({
  status: "loading",
  user: null,

  bootstrap: async () => {
    const stored = await tokens();
    if (!stored.access && !stored.refresh) {
      set({ status: "unauthenticated", user: null });
      return;
    }
    try {
      const user = await authApi.fetchMe();
      set({ status: "authenticated", user });
    } catch (error) {
      // An expired access token is refreshed transparently by the axios
      // interceptor, so reaching here means the session is really gone OR the
      // phone is offline. In the offline case the tokens are kept and the
      // driver stays signed in with cached data; only a real rejection clears
      // them (the interceptor already did that).
      const stillHasTokens = await tokens();
      if (stillHasTokens.refresh) {
        set({ status: "authenticated", user: null });
        return;
      }
      set({ status: "unauthenticated", user: null });
      void error;
    }
  },

  signIn: async ({ accessToken, refreshToken }) => {
    // Tokens are written to secure storage FIRST: fetchMe goes through the axios
    // interceptor, which reads the Authorization header from the keystore.
    await saveTokens(accessToken, refreshToken);
    try {
      const user = await authApi.fetchMe();
      set({ status: "authenticated", user });
    } catch (error) {
      // The exchange succeeded but the account could not be read. Do not leave
      // half a session behind: drop the tokens and let the driver retry.
      await clearTokens();
      set({ status: "unauthenticated", user: null });
      throw error;
    }
  },

  signOut: async () => {
    // Best effort: the server session should be revoked, but a network failure
    // must never trap the driver in a signed-in shell.
    try {
      await authApi.logout();
    } catch {
      // ignored on purpose
    }
    await clearTokens();
    await signOutFirebase();
    resetDomainStores();
    set({ status: "unauthenticated", user: null });
  },
}));
