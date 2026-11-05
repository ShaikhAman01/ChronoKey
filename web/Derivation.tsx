import { useLayoutEffect, useState, type CSSProperties, type ReactNode } from 'react';
import type { HotpSteps } from '../src/hotp.ts';
import type { Settings } from './App.tsx';

const hex = (byte: number) => byte.toString(16).padStart(2, '0').toUpperCase();

function Byte({
  value,
  index,
  picked,
  nibble,
  ...data
}: {
  value: number;
  index?: number;
  picked?: boolean;
  nibble?: boolean;
  [key: `data-${string}`]: number | undefined;
}) {
  const text = hex(value);
  return (
    <span className={picked ? 'byte is-picked' : 'byte'} {...data}>
      <span className="byte-value">
        {text[0]}
        {nibble ? <mark>{text[1]}</mark> : text[1]}
      </span>
      {index !== undefined && <span className="byte-index">{index}</span>}
    </span>
  );
}

function Step({
  n,
  title,
  note,
  children,
  className,
}: {
  n: number;
  title: string;
  note: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <li className={className ? `step ${className}` : 'step'}>
      <span className="balloon" aria-hidden="true">
        {n}
      </span>
      <div className="step-value">{children}</div>
      <div className="step-note">
        <h3>{title}</h3>
        <p>{note}</p>
      </div>
    </li>
  );
}

function Traces({ host, steps }: { host: HTMLElement | null; steps: HotpSteps }) {
  const [wires, setWires] = useState<{ d: string; length: number; x1: number; y1: number; x2: number; y2: number }[]>([]);
  const { offset, counter } = steps;
  const length = steps.hmac.length;

  useLayoutEffect(() => {
    if (!host) return;
    const measure = () => {
      const origin = host.getBoundingClientRect();
      const next = [];
      for (let i = 0; i < 4; i++) {
        const from = host.querySelector(`[data-hmac="${offset + i}"]`)?.getBoundingClientRect();
        const to = host.querySelector(`[data-slice="${i}"]`)?.getBoundingClientRect();
        if (!from || !to) continue;
        const x1 = from.left + from.width / 2 - origin.left;
        const y1 = from.bottom - origin.top;
        const x2 = to.left + to.width / 2 - origin.left;
        const y2 = to.top - origin.top;
        // Stacked so that no wire's vertical run lands on a neighbour's when the shift is a whole cell
        const bus = y2 - 14 - (x1 > x2 ? 3 - i : i) * 7;
        const length = bus - y1 + Math.abs(x2 - x1) + (y2 - bus);
        next.push({ d: `M${x1} ${y1}V${bus}H${x2}V${y2}`, length, x1, y1, x2, y2 });
      }
      setWires(next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(host);
    return () => observer.disconnect();
  }, [host, offset, length, counter]);

  return (
    <svg className="traces" aria-hidden="true">
      {wires.map((w, i) => (
        <g key={`${counter}-${offset}-${i}`}>
          <path
            d={w.d}
            style={{ '--length': `${w.length}px`, animationDelay: `${i * 40}ms` } as CSSProperties}
          />
          <circle cx={w.x1} cy={w.y1} r={3} />
          <circle cx={w.x2} cy={w.y2} r={3} />
        </g>
      ))}
    </svg>
  );
}

export function Derivation({
  steps,
  time,
  settings,
}: {
  steps: HotpSteps | null;
  time: number;
  settings: Settings;
}) {
  const [host, setHost] = useState<HTMLElement | null>(null);
  const { step, algorithm, digits } = settings;

  if (!steps) {
    return (
      <section className="derivation" aria-labelledby="derivation-title">
        <h2 id="derivation-title">How this code is made</h2>
        <p className="derivation-empty">Enter a valid secret above to see each step.</p>
      </section>
    );
  }

  const unix = Math.floor(time / 1000);
  const last = steps.hmac[steps.hmac.length - 1]!;
  const raw = new DataView(steps.slice.buffer, steps.slice.byteOffset).getUint32(0);
  const bits = raw.toString(2).padStart(32, '0');
  const binaryText = String(steps.binary);
  const kept = Math.min(digits, binaryText.length);

  return (
    <section className="derivation" aria-labelledby="derivation-title">
      <h2 id="derivation-title">How this code is made</h2>

      <div className="steps-host" ref={setHost}>
        {host && <Traces host={host} steps={steps} />}
        <div className="spine-clip" aria-hidden="true">
          <span className="spine-pulse" key={steps.counter.toString()} />
        </div>
        <ol className="steps" role="list">
          <Step
            n={1}
            title="Read the clock"
            note="Seconds since 1 January 1970, UTC. Your phone and the server both know this, so neither has to send it to the other."
          >
            <p className="figure">{unix}</p>
            <p className="figure-sub">{new Date(unix * 1000).toISOString().replace('T', ' ').slice(0, 19)} UTC</p>
          </Step>

          <Step
            n={2}
            title="Count the steps"
            note={`Rounded down. This number only changes every ${step} seconds, which is why the code stays the same for that long.`}
          >
            <p className="figure">
              {unix} ÷ {step} = <strong>{steps.counter.toString()}</strong>
            </p>
          </Step>

          <Step
            n={3}
            title="Write it as 8 bytes"
            note="The same counter in hexadecimal, most significant byte first. This is the message that gets signed."
          >
            <div className="bytes bytes-counter">
              {[...steps.counterBytes].map((b, i) => (
                <Byte key={i} value={b} />
              ))}
            </div>
          </Step>

          <Step
            n={4}
            title="Mix in the secret"
            note={`HMAC-${algorithm} signs the counter with your secret. Without the secret, nobody can work out these ${steps.hmac.length} bytes, even knowing the time.`}
          >
            <div className="bytes">
              {[...steps.hmac].map((b, i) => (
                <Byte
                  key={i}
                  value={b}
                  index={i}
                  picked={i >= steps.offset && i < steps.offset + 4}
                  nibble={i === steps.hmac.length - 1}
                  data-hmac={i}
                />
              ))}
            </div>
          </Step>

          <Step
            n={5}
            className="step-slice"
            title="Pick 4 of them"
            note={`The last hex digit of the last byte is ${hex(last)[1]}${steps.offset > 9 ? `, which means ${steps.offset}` : ''}. So the 4 bytes starting at position ${steps.offset} are kept.`}
          >
            <div className="bytes bytes-slice">
              {[...steps.slice].map((b, i) => (
                <Byte key={i} value={b} picked data-slice={i} />
              ))}
            </div>
          </Step>

          <Step
            n={6}
            title="Drop the top bit"
            note="Clearing the first bit keeps the number positive in every programming language. What's left is a plain integer."
          >
            <p className="bits">
              <span className="dropped">{bits[0]}</span>
              {bits.slice(1, 8)} {bits.slice(8, 16)} {bits.slice(16, 24)} {bits.slice(24)}
            </p>
            <p className="figure">= <strong>{steps.binary}</strong></p>
          </Step>

          <Step
            n={7}
            title="Keep the last digits"
            note={
              <>
                Dividing by 10<sup>{digits}</sup> and keeping the remainder leaves the last {digits} digits. If
                it comes out short, zeros are added at the front.
              </>
            }
          >
            <p className="figure">
              {binaryText.slice(0, binaryText.length - kept)}
              <mark>{binaryText.slice(binaryText.length - kept)}</mark>
            </p>
            <p className="figure-sub">
              The code is <strong>{steps.code}</strong>
            </p>
          </Step>
        </ol>
      </div>
    </section>
  );
}
