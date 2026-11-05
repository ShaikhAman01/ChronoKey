import { useMemo } from 'react';
import qrcode from 'qrcode-generator';
import { base32Encode } from '../src/base32.ts';
import { otpauthUri } from '../src/otpauth.ts';
import { TOTP_SECRETS } from '../src/vectors.ts';
import { newSecret, type Settings } from './App.tsx';

function QrCode({ data }: { data: string }) {
  const { size, path } = useMemo(() => {
    const qr = qrcode(0, 'L');
    qr.addData(data);
    qr.make();
    const count = qr.getModuleCount();
    let d = '';
    for (let row = 0; row < count; row++) {
      for (let col = 0; col < count; col++) {
        if (qr.isDark(row, col)) d += `M${col} ${row}h1v1h-1z`;
      }
    }
    return { size: count, path: d };
  }, [data]);

  return (
    <svg
      className="qr"
      viewBox={`-2 -2 ${size + 4} ${size + 4}`}
      role="img"
      aria-label="QR code for this secret, for scanning with an authenticator app"
      shapeRendering="crispEdges"
    >
      <rect x="-2" y="-2" width={size + 4} height={size + 4} fill="#fff" />
      <path d={path} fill="#10151C" />
    </svg>
  );
}

export function SecretPanel({
  text,
  error,
  settings,
  onChange,
}: {
  text: string;
  error: string | null;
  settings: Settings;
  onChange: (text: string) => void;
}) {
  const uri = error ? null : otpauthUri({ label: 'playground', secretBase32: text, ...settings });
  const isStandard = settings.algorithm === 'SHA-1' && settings.digits === 6 && settings.step === 30;

  const loadTestSecret = () => {
    onChange(base32Encode(new TextEncoder().encode(TOTP_SECRETS[settings.algorithm])));
  };

  return (
    <div className="secret">
      <label htmlFor="secret-input">Secret</label>
      <input
        id="secret-input"
        className="secret-input"
        value={text}
        spellCheck={false}
        autoComplete="off"
        autoCapitalize="characters"
        aria-invalid={error !== null}
        aria-describedby="secret-help"
        onChange={(e) => onChange(e.target.value)}
      />
      <p id="secret-help" className={error ? 'help is-error' : 'help'}>
        {error ?? 'Base32, the format authenticator apps use. Spaces are fine.'}
      </p>
      <div className="controls">
        <button type="button" onClick={() => onChange(newSecret())}>
          Generate new secret
        </button>
        <button type="button" onClick={loadTestSecret}>
          Use RFC test secret
        </button>
      </div>

      <div className="scan">
        {uri ? <QrCode data={uri} /> : <div className="qr qr-empty" />}
        <p>
          Scan this with an authenticator app, and your phone will show the same code.
          {!isStandard && ' Many apps ignore custom settings, so use SHA-1, 6 digits and 30 s for this.'}
        </p>
      </div>
    </div>
  );
}
