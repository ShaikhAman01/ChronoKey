import { memo, useEffect, useState } from 'react';
import { generateHOTP, type Algorithm } from '../src/hotp.ts';
import { generateTOTP } from '../src/totp.ts';
import { HOTP_SECRET, HOTP_VECTORS, TOTP_SECRETS, TOTP_VECTORS } from '../src/vectors.ts';

const ALGORITHMS: Algorithm[] = ['SHA-1', 'SHA-256', 'SHA-512'];
const TIMES = [...new Set(TOTP_VECTORS.map((v) => v.time))];

function Cell({ actual, expected }: { actual: string; expected: string }) {
  const pass = actual === expected;
  return (
    <td className={pass ? undefined : 'is-fail'}>
      {actual}
      {!pass && <span className="expected"> expected {expected}</span>}
    </td>
  );
}

export const VectorsPanel = memo(function VectorsPanel() {
  const [totp, setTotp] = useState<string[] | null>(null);
  const [hotp, setHotp] = useState<string[] | null>(null);

  useEffect(() => {
    Promise.all(
      TOTP_VECTORS.map(({ time, algorithm }) =>
        generateTOTP(TOTP_SECRETS[algorithm], { algorithm, digits: 8, timestamp: time * 1000 }),
      ),
    ).then(setTotp);
    Promise.all(HOTP_VECTORS.map((_, counter) => generateHOTP(HOTP_SECRET, counter))).then(setHotp);
  }, []);

  const total = TOTP_VECTORS.length + HOTP_VECTORS.length;
  const passed =
    totp && hotp
      ? TOTP_VECTORS.filter((v, i) => totp[i] === v.code).length +
        HOTP_VECTORS.filter((code, i) => hotp[i] === code).length
      : null;

  return (
    <div className="vectors">
      <h2>Check it against the standard</h2>
      <p className="lede">
        The RFCs publish expected codes so that anyone can test their implementation. Your browser just
        computed all of them with the same code as above.
      </p>
      <p className={passed === total ? 'tally' : 'tally is-fail'} role="status">
        {passed === null ? 'Running the test values.' : `${passed} of ${total} match the published values.`}
      </p>

      {totp && hotp && (
        <>
          <div
            className="table-scroll"
            tabIndex={0}
            role="region"
            aria-label="RFC 6238 test values, scrollable"
          >
            <table>
              <caption>RFC 6238 codes, 8 digits and a 30 s step</caption>
              <thead>
                <tr>
                  <th scope="col">Unix time</th>
                  {ALGORITHMS.map((a) => (
                    <th scope="col" key={a}>
                      {a}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIMES.map((time) => (
                  <tr key={time}>
                    <th scope="row">{time}</th>
                    {ALGORITHMS.map((algorithm) => {
                      const i = TOTP_VECTORS.findIndex((v) => v.time === time && v.algorithm === algorithm);
                      return <Cell key={algorithm} actual={totp[i]!} expected={TOTP_VECTORS[i]!.code} />;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="table-scroll" tabIndex={0} role="region" aria-label="RFC 4226 test values, scrollable">
            <table>
              <caption>RFC 4226 codes, counters 0 to 9</caption>
              <tbody>
                <tr>
                  {HOTP_VECTORS.slice(0, 5).map((code, i) => (
                    <Cell key={i} actual={hotp[i]!} expected={code} />
                  ))}
                </tr>
                <tr>
                  {HOTP_VECTORS.slice(5).map((code, i) => (
                    <Cell key={i} actual={hotp[i + 5]!} expected={code} />
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
});
