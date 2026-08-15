import { api } from "./client";

/**
 * Wallet is READ ONLY for a driver.
 *
 * GET /wallet/me is the only wallet route, and no driver-facing withdrawal
 * endpoint exists (money-out lives in staff-only modules). A "request payout"
 * button would therefore be a lie, so it is not built.
 */
/**
 * Mirrors what GET /wallet/me actually returns (WalletService.getWithTransactions).
 * The previous shape declared `id` and `updatedAt`, which the server never sends,
 * and omitted the locked balance and the entry list entirely.
 */
export type Wallet = {
  balance: number;
  currency: string;
  /** Non-withdrawable credit (e.g. coupon compensation), kept apart from balance. */
  lockedBalance: number;
  source: "LEDGER";
  /** Ledger entries: amount is always positive, `direction` gives the sign. */
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

/** GET /payments/payouts/me - history of payouts already made by the company. */
export async function fetchMyPayouts() {
  const { data } = await api.get("/payments/payouts/me");
  return data as unknown;
}
