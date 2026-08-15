import React, { useEffect } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { onAuthenticationFailure } from "../api/client";
import {
  connectSocket,
  disconnectSocket,
  ensureSocketConnection,
} from "../socket/socket.service";
import {
  registerPushToken,
  unregisterPushToken,
} from "../services/push.service";
import { useAuthStore } from "./auth.store";

/**
 * Owns the session lifecycle:
 *
 * 1. reads the keystore once at launch,
 * 2. turns an unrecoverable 401 into a sign-out (single place),
 * 3. keeps exactly one socket alive while a session exists,
 * 4. registers this device for push while a session exists - the socket's
 *    background-delivery fallback (see push.service.ts),
 * 5. re-checks the link and refreshes server state when the app is resumed,
 * 6. drops every cached query on sign-out.
 *
 * The socket is tied to the SESSION, not to a screen, because ride offers are
 * pushed to the driver's personal room and must arrive on any screen. Push
 * registration follows the same rule, for the same reason.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const status = useAuthStore((state) => state.status);
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const signOut = useAuthStore((state) => state.signOut);
  const queryClient = useQueryClient();

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => onAuthenticationFailure(() => signOut()), [signOut]);

  useEffect(() => {
    if (status !== "authenticated") {
      // Nothing cached may outlive a session: the next driver on this phone
      // must never see the previous one's data.
      queryClient.clear();
      return;
    }
    connectSocket();
    return () => disconnectSocket();
  }, [status, queryClient]);

  useEffect(() => {
    if (status !== "authenticated") return;
    void registerPushToken();
    return () => void unregisterPushToken();
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const onChange = (next: AppStateStatus) => {
      if (next !== "active") return;
      // The socket service also listens for this transition; calling it here
      // too is harmless (it is a no-op when already connected) and covers the
      // case where the socket was opened before this listener existed.
      ensureSocketConnection();
      // Approval status and the profile may have changed while the app slept.
      void queryClient.invalidateQueries({ queryKey: ["driver", "me"] });
    };
    const subscription = AppState.addEventListener("change", onChange);
    return () => subscription.remove();
  }, [status, queryClient]);

  return <>{children}</>;
}
