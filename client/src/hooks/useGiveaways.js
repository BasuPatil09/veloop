import { useCallback, useEffect, useState } from 'react';
import { giveawayService } from '../services/giveawayService';
import { getErrorMessage } from '../utils/errorMessages';

/**
 * Fetches the current (active + upcoming) giveaways with loading/error/empty handling.
 *
 * Note on the effect shape: state transitions to "loading" happen in `retry` (an event
 * handler), never synchronously inside the effect body itself — only the terminal
 * setState calls (success/error/done) happen there, inside the async callbacks. This
 * avoids a synchronous setState-in-effect on every re-run and is the pattern reused by
 * the other data-fetching hooks (useGiveawayStats, and Phase 3's useParticipation/useClaim).
 */
export function useGiveaways() {
  const [giveaways, setGiveaways] = useState(null); // null = not loaded yet, distinct from []
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    giveawayService
      .getCurrent()
      .then((data) => {
        if (cancelled) return;
        setGiveaways(data);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, 'Unable to load giveaways.'));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const retry = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setReloadToken((t) => t + 1);
  }, []);

  return { giveaways, isLoading, error, retry };
}
