import { useEffect, useState } from 'react';
import { generateTOTP, verifyTOTP, type VerifyResult } from '../src/totp.ts';
import type { Settings } from './App.tsx';

const WINDOW = [
  { offset: -1, label: 'Previous step' },
  { offset: 0, label: 'This step' },
  { offset: 1, label: 'Next step' },
];

function resultMessage(token: string, digits: number, result: VerifyResult | null): string {
  if (!token) return `Type a ${digits}-digit code, or pick one above.`;
  if (token.length < digits) return `Keep typing. This setup needs ${digits} digits.`;
  if (!result) return '';
  if (result.delta === 0) return 'Accepted. This is the code for the current step.';
  if (result.delta === -1) {
    return 'Accepted, one step late. Servers allow this because typing takes time and clocks drift.';
  }
  if (result.delta === 1) return 'Accepted, one step early. The phone’s clock is slightly ahead of the server’s.';
  return 'Rejected. This code isn’t valid in any of the 3 steps checked.';
}

export function VerifyPanel({
  secret,
  counter,
  settings,
}: {
  secret: Uint8Array | null;
  counter: bigint;
  settings: Settings;
}) {
  const { algorithm, digits, step } = settings;
  const [token, setToken] = useState('');
  const [codes, setCodes] = useState<string[]>([]);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const timestamp = Number(counter) * step * 1000;

  useEffect(() => {
    if (!secret) {
      setCodes([]);
      return;
    }
    let stale = false;
    Promise.all(
      WINDOW.map(({ offset }) =>
        generateTOTP(secret, { algorithm, digits, step, timestamp: timestamp + offset * step * 1000 }),
      ),
    ).then((next) => {
      if (!stale) setCodes(next);
    });
    return () => {
      stale = true;
    };
  }, [secret, algorithm, digits, step, timestamp]);

  useEffect(() => {
    if (!secret || token.length !== digits) {
      setResult(null);
      return;
    }
    let stale = false;
    verifyTOTP(secret, token, { algorithm, digits, step, timestamp }).then((next) => {
      if (!stale) setResult(next);
    });
    return () => {
      stale = true;
    };
  }, [secret, token, algorithm, digits, step, timestamp]);

  const accepted = result?.valid === true;
  const rejected = result?.valid === false;

  return (
    <div className="verify">
      <h2>Check a code</h2>
      <p className="lede">
        A server works out the codes for the steps around now and accepts any of them, so a code typed
        just as it expires still works.
      </p>

      <div className="window">
        {WINDOW.map(({ offset, label }, i) => (
          <button
            type="button"
            key={offset}
            className={result?.delta === offset ? 'window-cell is-match' : 'window-cell'}
            disabled={!codes[i]}
            onClick={() => setToken(codes[i] ?? '')}
          >
            <span className="window-label">{label}</span>
            <span className="window-code">{codes[i] ?? '-'.repeat(digits)}</span>
          </button>
        ))}
      </div>

      <label htmlFor="verify-input">Code to check</label>
      <input
        id="verify-input"
        className={rejected ? 'verify-input is-rejected' : 'verify-input'}
        value={token}
        inputMode="numeric"
        autoComplete="off"
        maxLength={digits}
        disabled={!secret}
        aria-describedby="verify-result"
        onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
      />
      <p id="verify-result" className={accepted ? 'result is-accepted' : 'result'} role="status">
        {secret ? resultMessage(token, digits, result) : 'Enter a valid secret above to check codes.'}
      </p>

      <p className="aside">
        Every digit of every step gets compared, even after a match, so a check doesn’t finish
        sooner for a worse guess.
      </p>
    </div>
  );
}
