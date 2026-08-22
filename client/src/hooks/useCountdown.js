import { useEffect, useState } from 'react';

function getTimeParts(msRemaining) {
  const clamped = Math.max(0, msRemaining);
  const totalSeconds = Math.floor(clamped / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    isComplete: clamped <= 0,
  };
}

/**
 * Pure display timer — ticks down to targetDate client-side but never decides
 * ACTIVE/ENDED on its own. When it reaches zero the caller should re-fetch from
 * the backend, which remains the sole authority on giveaway status
 * (architecture doc, section H).
 */
export function useCountdown(targetDate) {
  const target = targetDate ? new Date(targetDate).getTime() : null;
  const [parts, setParts] = useState(() => getTimeParts(target ? target - Date.now() : 0));

  useEffect(() => {
    if (!target) return undefined;

    const tick = () => setParts(getTimeParts(target - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  return parts;
}
