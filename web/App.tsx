import { useMemo, useState } from 'react';
import { base32Decode, base32Encode } from '../src/base32.ts';
import type { Algorithm } from '../src/hotp.ts';
import { counterAt } from '../src/totp.ts';
import { Derivation } from './Derivation.tsx';
import { useDerivation, useNow } from './hooks.ts';
import { LiveCode } from './LiveCode.tsx';
import { SecretPanel } from './SecretPanel.tsx';
import { TitleBlock } from './TitleBlock.tsx';

export interface Settings {
  algorithm: Algorithm;
  digits: number;
  step: number;
}

export function newSecret(): string {
  return base32Encode(crypto.getRandomValues(new Uint8Array(20)));
}

function parseSecret(text: string): { key: Uint8Array | null; error: string | null } {
  if (!text.trim()) return { key: null, error: 'Enter a secret, or generate a new one.' };
  try {
    const key = base32Decode(text);
    if (key.length === 0) return { key: null, error: 'Enter a secret, or generate a new one.' };
    return { key, error: null };
  } catch {
    return { key: null, error: 'Secrets only use the letters A to Z and the digits 2 to 7.' };
  }
}

export function App() {
  const [secretText, setSecretText] = useState(newSecret);
  const [settings, setSettings] = useState<Settings>({ algorithm: 'SHA-1', digits: 6, step: 30 });
  const [pausedAt, setPausedAt] = useState<number | null>(null);

  const now = useNow(pausedAt === null);
  const time = pausedAt ?? now;
  const { key, error } = useMemo(() => parseSecret(secretText), [secretText]);
  const counter = counterAt(time, settings.step);
  const steps = useDerivation(key, counter, settings.algorithm, settings.digits);

  return (
    <div className="sheet">
      <header className="sheet-head">
        <div>
          <h1>ChronoKey</h1>
          <p className="tagline">
            Watch a 2FA code being built from the clock and a secret, one step at a time.
          </p>
        </div>
        <TitleBlock settings={settings} onChange={setSettings} />
      </header>

      <main>
        <section className="hero" aria-label="Current code">
          <LiveCode
            code={key ? steps?.code ?? null : null}
            digits={settings.digits}
            step={settings.step}
            time={time}
            paused={pausedAt !== null}
            onSetPaused={setPausedAt}
          />
          <SecretPanel
            text={secretText}
            error={error}
            settings={settings}
            onChange={setSecretText}
          />
        </section>

        <Derivation steps={key ? steps : null} time={time} settings={settings} />
      </main>

      <footer className="sheet-foot">
        <p>
          Everything runs in this browser. Nothing you type is sent or saved. This is a learning
          tool, so don't paste secrets from real accounts.
        </p>
        <p>
          Built to <a href="https://www.rfc-editor.org/rfc/rfc6238">RFC 6238</a> and{' '}
          <a href="https://www.rfc-editor.org/rfc/rfc4226">RFC 4226</a>.{' '}
          <a href="https://github.com/ShaikhAman01/ChronoKey">Source on GitHub</a>.
        </p>
      </footer>
    </div>
  );
}
