import type { Algorithm } from '../src/hotp.ts';
import type { Settings } from './App.tsx';

const ALGORITHMS: Algorithm[] = ['SHA-1', 'SHA-256', 'SHA-512'];

export function TitleBlock({
  settings,
  onChange,
}: {
  settings: Settings;
  onChange: (settings: Settings) => void;
}) {
  return (
    <dl className="title-block">
      <div>
        <dt>Standard</dt>
        <dd>RFC 6238</dd>
      </div>
      <div>
        <dt>
          <label htmlFor="setting-hash">Hash</label>
        </dt>
        <dd>
          <select
            id="setting-hash"
            value={settings.algorithm}
            onChange={(e) => onChange({ ...settings, algorithm: e.target.value as Algorithm })}
          >
            {ALGORITHMS.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </dd>
      </div>
      <div>
        <dt>
          <label htmlFor="setting-digits">Digits</label>
        </dt>
        <dd>
          <select
            id="setting-digits"
            value={settings.digits}
            onChange={(e) => onChange({ ...settings, digits: Number(e.target.value) })}
          >
            <option>6</option>
            <option>7</option>
            <option>8</option>
          </select>
        </dd>
      </div>
      <div>
        <dt>
          <label htmlFor="setting-step">Step</label>
        </dt>
        <dd>
          <select
            id="setting-step"
            value={settings.step}
            onChange={(e) => onChange({ ...settings, step: Number(e.target.value) })}
          >
            <option value={15}>15 s</option>
            <option value={30}>30 s</option>
            <option value={60}>60 s</option>
          </select>
        </dd>
      </div>
    </dl>
  );
}
