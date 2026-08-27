import { useCallback, useEffect, useState } from 'react';
import { participationService } from '../services/participationService';
import { getErrorMessage } from '../utils/errorMessages';

export function useMyParticipations() {
  const [participations, setParticipations] = useState(null); // null = not loaded yet, distinct from []
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    participationService
      .getMyParticipations()
      .then((data) => {
        if (!cancelled) setParticipations(data);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, 'Unable to load your entries.'));
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

  return { participations, isLoading, error, retry };
}
