import { useCallback, useEffect, useRef, useState } from 'react';
import { participationService } from '../services/participationService';
import { getErrorMessage } from '../utils/errorMessages';
import { useAuth } from './useAuth';

/**
 * The idempotency key is generated once per join attempt and REUSED across
 * retries (e.g. the user clicks Confirm & Join again after a network error) —
 * regenerating it on every click would defeat its purpose (architecture doc,
 * section J). A fresh key is only created on the next page visit.
 *
 * Note on isStatusLoading: it's derived from isFetchingStatus rather than set
 * directly in the "nothing to fetch" early-exit branch of the effect — setState
 * only ever happens inside the async .then/.catch/.finally callbacks, never
 * synchronously in the effect body (same pattern as useGiveaways/useGiveawayStats).
 */
export function useParticipation(prizeId) {
  const { isAuthenticated, updateBalance } = useAuth();
  const [joined, setJoined] = useState(false);
  const [participation, setParticipation] = useState(null);
  const [isFetchingStatus, setIsFetchingStatus] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState(null);
  const idempotencyKeyRef = useRef(null);

  const shouldFetchStatus = Boolean(isAuthenticated && prizeId);
  const isStatusLoading = shouldFetchStatus ? isFetchingStatus : false;

  useEffect(() => {
    if (!shouldFetchStatus) return undefined;

    let cancelled = false;

    participationService
      .getMyStatus(prizeId)
      .then((data) => {
        if (cancelled) return;
        setJoined(data.joined);
        setParticipation(data.participation);
      })
      .catch(() => {
        // Non-fatal — if the status check fails, the CTA just falls back to
        // "Join", and the join call itself will still correctly reject a true
        // duplicate server-side.
      })
      .finally(() => {
        if (!cancelled) setIsFetchingStatus(false);
      });

    return () => {
      cancelled = true;
    };
  }, [shouldFetchStatus, prizeId]);

  const join = useCallback(async () => {
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = crypto.randomUUID();
    }

    setIsJoining(true);
    setJoinError(null);
    try {
      const result = await participationService.join(prizeId, idempotencyKeyRef.current);
      setJoined(true);
      setParticipation(result.participation);
      if (result.transaction) {
        updateBalance(result.transaction.currency.toLowerCase(), result.transaction.balanceAfter);
      }
      return result;
    } catch (err) {
      setJoinError(getErrorMessage(err, "We couldn't complete your entry. Please try again."));
      throw err;
    } finally {
      setIsJoining(false);
    }
  }, [prizeId, updateBalance]);

  const resetJoinError = useCallback(() => setJoinError(null), []);

  return { joined, participation, isStatusLoading, join, isJoining, joinError, resetJoinError };
}
