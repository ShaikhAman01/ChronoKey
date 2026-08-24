import test from 'node:test';
import assert from 'node:assert/strict';

import { generateTOTP, verifyTOTP } from '../src/totp.ts';

const RFC_SECRET = '12345678901234567890';

test('generateTOTP matches RFC 6238 test vector for 59 seconds', () => {
  const now = Date.now;
  Date.now = () => 59_000;

  try {
    assert.equal(generateTOTP(RFC_SECRET, 8, 30), '94287082');
  } finally {
    Date.now = now;
  }
});

test('generateTOTP accepts an explicit timestamp', () => {
  assert.equal(generateTOTP(RFC_SECRET, 8, 30, 59_000), '94287082');
});

// RFC 6238 Appendix B: t = 1111111109 -> 07081804
const T = 1_111_111_109_000;
const opts = { digits: 8, step: 30, timestamp: T };

test('verifyTOTP accepts the code for the current step', () => {
  assert.deepEqual(verifyTOTP(RFC_SECRET, '07081804', opts), { valid: true, delta: 0 });
});

test('verifyTOTP accepts a code from one step ago', () => {
  const late = generateTOTP(RFC_SECRET, 8, 30, T - 30_000);
  assert.deepEqual(verifyTOTP(RFC_SECRET, late, opts), { valid: true, delta: -1 });
});

test('verifyTOTP accepts a code from one step ahead', () => {
  const early = generateTOTP(RFC_SECRET, 8, 30, T + 30_000);
  assert.deepEqual(verifyTOTP(RFC_SECRET, early, opts), { valid: true, delta: 1 });
});

test('verifyTOTP rejects a code from outside the window', () => {
  const stale = generateTOTP(RFC_SECRET, 8, 30, T - 90_000);
  assert.deepEqual(verifyTOTP(RFC_SECRET, stale, opts), { valid: false, delta: null });
});

test('verifyTOTP widens the window on request', () => {
  const stale = generateTOTP(RFC_SECRET, 8, 30, T - 90_000);
  assert.deepEqual(verifyTOTP(RFC_SECRET, stale, { ...opts, window: 3 }), { valid: true, delta: -3 });
});

test('verifyTOTP rejects a token of the wrong length', () => {
  assert.deepEqual(verifyTOTP(RFC_SECRET, '0708180', opts), { valid: false, delta: null });
});

test('verifyTOTP rejects a wrong code', () => {
  assert.deepEqual(verifyTOTP(RFC_SECRET, '00000000', opts), { valid: false, delta: null });
});
