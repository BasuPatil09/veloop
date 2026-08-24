import { useEffect, useState } from 'react';
import { winnerService } from '../services/winnerService';
import { getErrorMessage } from '../utils/errorMessages';

export function usePreviousWinners() {
  const [winners, setWinners] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    winnerService
      .getPreviousWinners()
      .then((data) => {
        if (!cancelled) setWinners(data);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, 'Unable to load previous winners.'));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { winners, isLoading, error };
}
