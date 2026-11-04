import test from 'node:test';
import assert from 'node:assert/strict';

import { generateHOTP, hotpSteps } from '../src/hotp.ts';
import { HOTP_SECRET, HOTP_VECTORS } from '../src/vectors.ts';

const hex = (b: Uint8Array) => Buffer.from(b).toString('hex');

HOTP_VECTORS.forEach((expected, counter) => {
  test(`generateHOTP matches RFC 4226 vector for counter ${counter}`, async () => {
    assert.equal(await generateHOTP(HOTP_SECRET, counter), expected);
  });
});

test('hotpSteps exposes the RFC 4226 intermediate values for counter 0', async () => {
  const steps = await hotpSteps(HOTP_SECRET, 0);
  assert.equal(hex(steps.counterBytes), '0000000000000000');
  assert.equal(hex(steps.hmac), 'cc93cf18508d94934c64b65d8ba7667fb7cde4b0');
  assert.equal(steps.offset, 0);
  assert.equal(hex(steps.slice), 'cc93cf18');
  assert.equal(steps.binary, 0x4c93cf18);
  assert.equal(steps.code, '755224');
});

test('hotpSteps writes the counter big-endian', async () => {
  const steps = await hotpSteps(HOTP_SECRET, 0x0102030405n);
  assert.equal(hex(steps.counterBytes), '0000000102030405');
});

test('generateHOTP rejects an empty secret', async () => {
  await assert.rejects(generateHOTP('', 0), /Secret must not be empty/);
});

test('generateHOTP rejects out-of-range digits and counters', async () => {
  await assert.rejects(generateHOTP(HOTP_SECRET, 0, { digits: 5 }), RangeError);
  await assert.rejects(generateHOTP(HOTP_SECRET, -1), RangeError);
  await assert.rejects(generateHOTP(HOTP_SECRET, 2n ** 64n), RangeError);
});
