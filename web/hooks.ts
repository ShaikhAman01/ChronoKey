import { useEffect, useState } from 'react';
import { hotpSteps, type Algorithm, type HotpSteps } from '../src/hotp.ts';

// Ticks on the second boundary, so the countdown and the code change together
export function useNow(running: boolean): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!running) return;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const current = Date.now();
      setNow(current);
      timer = setTimeout(tick, 1000 - (current % 1000));
    };
    tick();
    return () => clearTimeout(timer);
  }, [running]);

  return now;
}

export function useDerivation(
  key: Uint8Array | null,
  counter: bigint,
  algorithm: Algorithm,
  digits: number,
): HotpSteps | null {
  const [steps, setSteps] = useState<HotpSteps | null>(null);

  useEffect(() => {
    if (!key) {
      setSteps(null);
      return;
    }
    let stale = false;
    hotpSteps(key, counter, { algorithm, digits }).then((result) => {
      if (!stale) setSteps(result);
    });
    return () => {
      stale = true;
    };
  }, [key, counter, algorithm, digits]);

  return steps;
}
