import { useCallback, useEffect, useState } from 'react';
import { giveawayService } from '../services/giveawayService';
import { getErrorMessage } from '../utils/errorMessages';

export function useGiveaway(slug) {
  const [data, setData] = useState(null); // { prize, giveaway } | null
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    giveawayService
      .getBySlug(slug)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err?.response?.status === 404) {
          setNotFound(true);
        } else {
          setError(getErrorMessage(err, 'Unable to load this giveaway.'));
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug, reloadToken]);

  const retry = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setNotFound(false);
    setReloadToken((t) => t + 1);
  }, []);

  return { prize: data?.prize ?? null, giveaway: data?.giveaway ?? null, isLoading, error, notFound, retry };
}
