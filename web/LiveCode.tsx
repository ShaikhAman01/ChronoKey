import type { CSSProperties } from 'react';
import { secondsRemaining } from '../src/totp.ts';

function groupCode(code: string): [string, string] {
  const middle = Math.ceil(code.length / 2);
  return [code.slice(0, middle), code.slice(middle)];
}

export function LiveCode({
  code,
  digits,
  step,
  time,
  paused,
  onSetPaused,
}: {
  code: string | null;
  digits: number;
  step: number;
  time: number;
  paused: boolean;
  onSetPaused: (time: number | null) => void;
}) {
  const left = secondsRemaining(time, step);
  const into = step - left;
  const stepStart = Math.floor(time / 1000 / step) * step * 1000;
  const [first, second] = groupCode(code ?? '-'.repeat(digits));

  return (
    <div className="live">
      <p
        className="code"
        style={{ '--digits': digits } as CSSProperties}
        aria-label={code ? `Current code ${code}` : 'No code yet'}
      >
        <span className="code-digits" key={code ?? 'empty'} aria-hidden="true">
          {[...first].map((d, i) => (
            <span className="digit" key={i} style={{ animationDelay: `${i * 35}ms` }}>
              {d}
            </span>
          ))}
          <span className="code-gap" />
          {[...second].map((d, i) => (
            <span className="digit" key={i} style={{ animationDelay: `${(first.length + i) * 35}ms` }}>
              {d}
            </span>
          ))}
        </span>
      </p>

      <div className="scale">
        <input
          type="range"
          min={0}
          max={step}
          value={into}
          aria-label={`Seconds into this ${step} second step`}
          aria-valuetext={`${left} seconds left`}
          style={{ '--ticks': step } as CSSProperties}
          onChange={(e) => {
            const seconds = Math.min(Number(e.target.value), step - 1);
            onSetPaused(stepStart + seconds * 1000);
          }}
        />
        <div className="scale-labels">
          <span>0 s</span>
          <span className="scale-left">{left} s left</span>
          <span>{step} s</span>
        </div>
      </div>

      <div className="controls">
        {paused ? (
          <button type="button" className="primary" onClick={() => onSetPaused(null)}>
            Back to now
          </button>
        ) : (
          <button type="button" onClick={() => onSetPaused(time)}>
            Pause time
          </button>
        )}
        <button type="button" onClick={() => onSetPaused(time - step * 1000)}>
          Previous step
        </button>
        <button type="button" onClick={() => onSetPaused(time + step * 1000)}>
          Next step
        </button>
      </div>

      <p className="status" role="status">
        {paused
          ? 'Time is paused, so this code won’t match your phone. Drag the scale to scrub.'
          : 'Live. Drag the scale or pause to take a closer look.'}
      </p>
    </div>
  );
}
