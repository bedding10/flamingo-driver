import { useEffect, useMemo, useState } from "react";

/**
 * A countdown that is always driven by a server deadline.
 *
 * The ride offer sheet, the negotiation waiting state and the prize-pool timer
 * all show a shrinking ring. The duration is NOT a constant in this app: the
 * server sends `expiresInMs` with `ride:offer`, and the offer dies when the
 * server says it does. Passing `expiresAt` (a wall-clock deadline) rather than
 * a duration means a re-render, a backgrounded app or a slow socket can never
 * make the UI disagree with the backend.
 */
export type Countdown = {
  /** Milliseconds left, floored at 0. */
  remainingMs: number;
  /** Whole seconds left, for a label. */
  remainingSec: number;
  /** 1 at the start, 0 at the deadline. Feeds CountdownRing. */
  progress: number;
  expired: boolean;
};

export function useCountdown(
  /** Epoch ms deadline, or null when nothing is running. */
  expiresAt: number | null,
  /** Full window in ms, e.g. the offer's `expiresInMs`. */
  totalMs: number,
  tickMs = 200,
): Countdown {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (expiresAt === null) return undefined;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), tickMs);
    return () => clearInterval(id);
  }, [expiresAt, tickMs]);

  return useMemo(() => {
    if (expiresAt === null) {
      return { remainingMs: 0, remainingSec: 0, progress: 0, expired: false };
    }
    const remainingMs = Math.max(0, expiresAt - now);
    const progress =
      totalMs > 0 ? Math.min(1, Math.max(0, remainingMs / totalMs)) : 0;
    return {
      remainingMs,
      remainingSec: Math.ceil(remainingMs / 1000),
      progress,
      expired: remainingMs <= 0,
    };
  }, [expiresAt, now, totalMs]);
}
