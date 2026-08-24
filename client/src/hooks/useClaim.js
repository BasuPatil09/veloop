import { useCallback, useEffect, useState } from 'react';
import { claimService } from '../services/claimService';
import { getErrorMessage } from '../utils/errorMessages';
import { useAuth } from './useAuth';

export function useClaim(prizeId) {
  const { isAuthenticated } = useAuth();
  const [isWinner, setIsWinner] = useState(false);
  const [winner, setWinner] = useState(null);
  const [claim, setClaim] = useState(null);
  const [isFetching, setIsFetching] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const shouldFetch = Boolean(isAuthenticated && prizeId);
  const isLoading = shouldFetch ? isFetching : false;

  useEffect(() => {
    if (!shouldFetch) return undefined;

    let cancelled = false;
    claimService
      .getMyClaim(prizeId)
      .then((data) => {
        if (cancelled) return;
        setIsWinner(data.isWinner);
        setWinner(data.winner);
        setClaim(data.claim);
      })
      .catch(() => {
        // Non-fatal — falls back to "not a winner", which is the safe default.
      })
      .finally(() => {
        if (!cancelled) setIsFetching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [shouldFetch, prizeId]);

  const submitClaim = useCallback(
    async (payload) => {
      setIsSubmitting(true);
      setSubmitError(null);
      try {
        const result = await claimService.submitClaim(prizeId, payload);
        setClaim(result.claim);
        return result;
      } catch (err) {
        setSubmitError(getErrorMessage(err, "We couldn't submit your claim. Please try again."));
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [prizeId],
  );

  return { isWinner, winner, claim, isLoading, submitClaim, isSubmitting, submitError };
}
