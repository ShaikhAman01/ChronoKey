import test from 'node:test';
import assert from 'node:assert/strict';

import { generateTOTP } from '../src/totp.ts';

test('generateTOTP matches RFC 6238 test vector for 59 seconds', () => {
  const now = Date.now;
  Date.now = () => 59_000;

  try {
    assert.equal(generateTOTP('12345678901234567890', 8, 30), '94287082');
  } finally {
    Date.now = now;
  }
});
