import { useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { earningsApi, walletApi } from "../api";

export const WALLET_KEY = ["wallet", "me"] as const;
export const EARNINGS_KEY = ["driver", "earnings"] as const;

/**
 * Wallet and earnings are two different servers truths, deliberately kept as
 * two queries:
 *
 * - GET /wallet/me is the LEDGER balance (what the company owes right now),
 * - GET /driver/me/earnings is the per-trip income history and its aggregates.
 *
 * Merging them into one number would be a guess, and money must not be guessed
 * on the driver's screen.
 */
export function useWallet() {
  return useQuery({
    queryKey: WALLET_KEY,
    queryFn: walletApi.fetchWallet,
    staleTime: 30_000,
  });
}

export function useEarnings() {
  return useQuery({
    queryKey: EARNINGS_KEY,
    queryFn: earningsApi.fetchEarnings,
    staleTime: 30_000,
  });
}

function newIdempotencyKey(): string {
  return `wd-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * POST /withdrawals.
 *
 * The idempotency key is generated once and REUSED for every retry of the same
 * attempt, then rotated after a success. That is the only correct order: a
 * retry after a timeout must not create a second request, while a second
 * deliberate withdrawal must not be swallowed as a duplicate of the first.
 *
 * The amount is validated again on the server (positive, min 1, risk
 * assessment, ledger reservation), so the client check is a courtesy, not the
 * rule.
 */
export function useWithdrawal() {
  const queryClient = useQueryClient();
  const keyRef = useRef<string | null>(null);

  return useMutation({
    mutationFn: (input: { amount: number; note?: string }) => {
      if (!keyRef.current) keyRef.current = newIdempotencyKey();
      return walletApi.requestWithdrawal({
        amount: input.amount,
        note: input.note,
        idempotencyKey: keyRef.current,
      });
    },
    onSuccess: () => {
      keyRef.current = null;
      // The reservation moves money out of the withdrawable balance, so the
      // wallet on screen is stale the moment this returns.
      void queryClient.invalidateQueries({ queryKey: WALLET_KEY });
    },
  });
}
