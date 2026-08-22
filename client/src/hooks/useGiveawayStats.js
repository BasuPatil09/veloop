import { useCallback, useEffect, useState } from 'react';
import { giveawayService } from '../services/giveawayService';
import { getErrorMessage } from '../utils/errorMessages';

export function useGiveawayStats() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    giveawayService
      .getStats()
      .then((data) => {
        if (cancelled) return;
        setStats(data);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, 'Unable to load stats.'));
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

  return { stats, isLoading, error, retry };
}
