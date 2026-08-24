import { useEffect, useState } from 'react';
import { winnerService } from '../services/winnerService';
import { getErrorMessage } from '../utils/errorMessages';

export function useGiveawayWinners(giveawayId) {
  const [winners, setWinners] = useState([]);
  const [finalized, setFinalized] = useState(false);
  const [error, setError] = useState(null);
  const [isFetching, setIsFetching] = useState(true);

  const shouldFetch = Boolean(giveawayId);
  const isLoading = shouldFetch ? isFetching : false;

  useEffect(() => {
    if (!shouldFetch) return undefined;

    let cancelled = false;
    winnerService
      .getGiveawayWinners(giveawayId)
      .then((data) => {
        if (cancelled) return;
        setWinners(data.winners);
        setFinalized(data.finalized);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, 'Unable to load winners.'));
      })
      .finally(() => {
        if (!cancelled) setIsFetching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [shouldFetch, giveawayId]);

  return { winners, finalized, isLoading, error };
}
