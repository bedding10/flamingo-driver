import { api } from "./client";

/**
 * Mirrors what GET /wallet/me actually returns (WalletService.getWithTransactions).
 * Ledger entries carry a positive `amount` plus a `direction`, so the sign is
 * never encoded in the number itself.
 */
export type Wallet = {
  balance: number;
  currency: string;
  /** Non-withdrawable credit (e.g. coupon compensation), kept apart from balance. */
  lockedBalance: number;
  source: "LEDGER";
  transactions: Array<{
    id: string;
    amount: number | string;
    direction: "DEBIT" | "CREDIT";
    createdAt: string;
  }>;
  total: number;
  page: number;
  limit: number;
};

export async function fetchWallet(): Promise<Wallet> {
  const { data } = await api.get("/wallet/me");
  return data as Wallet;
}

/**
 * PHASE 5 correction, twice over.
 *
 * 1. `fetchMyPayouts()` used to call GET /payments/payouts/me. That route does
 *    not exist: PayoutsController exposes POST /, GET /queue, GET /,
 *    GET /:id and POST /:id/settle, all behind STAFF permissions. Any screen
 *    built on it would have shown a permanent error, so it is removed rather
 *    than kept as decoration.
 *
 * 2. The old comment in this file claimed "no driver-facing withdrawal endpoint
 *    exists". It does: WithdrawalsController.create is guarded by JwtAuthGuard
 *    ONLY (no STAFF role) and calls createForDriver(user.userId, ...), which
 *    resolves the Driver from the token, runs a risk assessment and reserves
 *    the amount in the ledger. So a driver CAN request a withdrawal, and the
 *    app now offers it.
 *
 * What still does not exist is a driver-facing LIST of withdrawal requests
 * (GET /withdrawals is STAFF only), so the app must not pretend to show a
 * withdrawal history.
 *
 * `idempotencyKey` is the server's own duplicate guard: when a key is replayed,
 * createForDriver returns the existing request instead of creating a second
 * one. It matters on a phone in a dead zone, where a retry is the normal case.
 */
export type WithdrawRequest = {
  id: string;
  amount: number | string;
  status: string;
  note?: string | null;
  createdAt?: string;
};

export async function requestWithdrawal(input: {
  amount: number;
  note?: string;
  idempotencyKey?: string;
}): Promise<WithdrawRequest> {
  const { data } = await api.post("/withdrawals", input);
  return data as WithdrawRequest;
}
