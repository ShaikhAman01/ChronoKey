import test from 'node:test';
import assert from 'node:assert/strict';

import { counterAt, generateTOTP, secondsRemaining, verifyTOTP } from '../src/totp.ts';
import { TOTP_SECRETS, TOTP_VECTORS } from '../src/vectors.ts';

for (const { time, algorithm, code } of TOTP_VECTORS) {
  test(`generateTOTP matches RFC 6238 vector: ${algorithm} at t=${time}`, async () => {
    const actual = await generateTOTP(TOTP_SECRETS[algorithm], { algorithm, digits: 8, timestamp: time * 1000 });
    assert.equal(actual, code);
  });
}

test('counterAt and secondsRemaining follow the 30 s step', () => {
  assert.equal(counterAt(59_000), 1n);
  assert.equal(counterAt(60_000), 2n);
  assert.equal(secondsRemaining(59_000), 1);
  assert.equal(secondsRemaining(60_000), 30);
  assert.equal(counterAt(20_000_000_000_000), 666666666n);
});

test('generateTOTP defaults to the current time', async () => {
  const now = Date.now;
  Date.now = () => 59_000;
  try {
    assert.equal(await generateTOTP(TOTP_SECRETS['SHA-1'], { digits: 8 }), '94287082');
  } finally {
    Date.now = now;
  }
});

// RFC 6238 Appendix B: t = 1111111109 -> 07081804
const SECRET = TOTP_SECRETS['SHA-1'];
const T = 1_111_111_109_000;
const opts = { digits: 8, timestamp: T };
const codeAt = (timestamp: number) => generateTOTP(SECRET, { digits: 8, timestamp });

test('verifyTOTP accepts the code for the current step', async () => {
  assert.deepEqual(await verifyTOTP(SECRET, '07081804', opts), { valid: true, delta: 0 });
});

test('verifyTOTP accepts a code from one step ago', async () => {
  assert.deepEqual(await verifyTOTP(SECRET, await codeAt(T - 30_000), opts), { valid: true, delta: -1 });
});

test('verifyTOTP accepts a code from one step ahead', async () => {
  assert.deepEqual(await verifyTOTP(SECRET, await codeAt(T + 30_000), opts), { valid: true, delta: 1 });
});

test('verifyTOTP rejects a code from outside the window', async () => {
  assert.deepEqual(await verifyTOTP(SECRET, await codeAt(T - 90_000), opts), { valid: false, delta: null });
});

test('verifyTOTP widens the window on request', async () => {
  const stale = await codeAt(T - 90_000);
  assert.deepEqual(await verifyTOTP(SECRET, stale, { ...opts, window: 3 }), { valid: true, delta: -3 });
});

test('verifyTOTP rejects a token of the wrong length or with non-digits', async () => {
  assert.deepEqual(await verifyTOTP(SECRET, '0708180', opts), { valid: false, delta: null });
  assert.deepEqual(await verifyTOTP(SECRET, '0708180a', opts), { valid: false, delta: null });
});

test('verifyTOTP rejects a wrong code', async () => {
  assert.deepEqual(await verifyTOTP(SECRET, '00000000', opts), { valid: false, delta: null });
});
