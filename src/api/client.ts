import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { config } from "../config";
import { clearTokens, saveTokens, tokens } from "../services/storage.service";

export const api = axios.create({
  baseURL: config.api.url,
  timeout: config.api.timeoutMs,
  headers: { Accept: "application/json" },
});

let authenticationFailureHandler: (() => void | Promise<void>) | null = null;

/**
 * Registers the single place that reacts to an unrecoverable 401 (the refresh
 * itself was rejected). AuthProvider wires this to sign-out so a dead session
 * can never stay on screen.
 */
export function onAuthenticationFailure(handler: () => void | Promise<void>) {
  authenticationFailureHandler = handler;
  return () => {
    if (authenticationFailureHandler === handler) {
      authenticationFailureHandler = null;
    }
  };
}

api.interceptors.request.use(async (request) => {
  const stored = await tokens();
  if (stored.access) {
    request.headers.Authorization = "Bearer " + stored.access;
  }
  return request;
});

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

/** One refresh at a time; parallel 401s all await the same promise. */
let refreshing: Promise<string> | null = null;

/** Refreshing these would recurse or is meaningless. */
const neverRefresh = (url?: string) =>
  ["/auth/refresh", "/auth/login", "/auth/register", "/auth/firebase"].some(
    (route) => String(url ?? "").includes(route),
  );

async function refreshAccessToken(): Promise<string> {
  const stored = await tokens();
  if (!stored.refresh) throw new Error("NO_REFRESH_TOKEN");
  const response = await axios.post(
    config.api.url + "/auth/refresh",
    { refreshToken: stored.refresh },
    { timeout: config.api.timeoutMs, headers: { Accept: "application/json" } },
  );
  await saveTokens(response.data.accessToken, response.data.refreshToken);
  return response.data.accessToken as string;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const request = error.config as RetryConfig | undefined;
    if (
      error.response?.status !== 401 ||
      !request ||
      request._retry ||
      neverRefresh(request.url)
    ) {
      throw error;
    }
    request._retry = true;
    refreshing ??= refreshAccessToken().finally(() => {
      refreshing = null;
    });
    try {
      request.headers.Authorization = "Bearer " + (await refreshing);
      return await api(request);
    } catch (refreshError) {
      // A refresh that failed because the phone has no network is NOT an
      // invalid session. Signing the driver out in a tunnel would be a hostile
      // bug, so only a real server rejection clears the keystore.
      if (axios.isAxiosError(refreshError) && !refreshError.response) {
        throw refreshError;
      }
      await clearTokens();
      await authenticationFailureHandler?.();
      throw refreshError;
    }
  },
);

export type ApiError = {
  code: string;
  message: string;
  status?: number;
  /** True when the request never reached the server. */
  offline: boolean;
};

/** Normalizes anything thrown by axios into one shape the UI can branch on. */
export function toApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { code?: string; message?: string | string[] }
      | undefined;
    const rawMessage = Array.isArray(data?.message)
      ? data?.message[0]
      : data?.message;
    return {
      code: data?.code ?? (error.response ? "REQUEST_FAILED" : "NETWORK_ERROR"),
      message: rawMessage ?? error.message,
      status: error.response?.status,
      offline: !error.response,
    };
  }
  return {
    code: "UNKNOWN_ERROR",
    message: error instanceof Error ? error.message : String(error),
    offline: false,
  };
}
