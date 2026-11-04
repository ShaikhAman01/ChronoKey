import test from 'node:test';
import assert from 'node:assert/strict';

import { base32Encode, base32Decode } from '../src/base32.ts';

const ascii = (s: string) => new TextEncoder().encode(s);
const text = (b: Uint8Array) => new TextDecoder().decode(b);

// RFC 4648 Section 10 official test vectors
const vectors: [string, string][] = [
    ['', ''],
    ['f', 'MY======'],
    ['fo', 'MZXQ===='],
    ['foo', 'MZXW6==='],
    ['foob', 'MZXW6YQ='],
    ['fooba', 'MZXW6YTB'],
    ['foobar', 'MZXW6YTBOI======'],
];

for (const [plain, encoded] of vectors) {
    test(`base32Encode("${plain}") === "${encoded}"`, () => {
        assert.equal(base32Encode(ascii(plain)), encoded);
    });

    test(`base32Decode("${encoded}") === "${plain}"`, () => {
        assert.equal(text(base32Decode(encoded)), plain);
    });
}

test('base32Decode accepts lowercase, spaced secrets as authenticator apps show them', () => {
    assert.equal(text(base32Decode('mzxw 6ytb oi')), 'foobar');
    assert.equal(text(base32Decode('MZXW-6YTB-OI')), 'foobar');
});

test('base32Decode rejects characters outside the alphabet', () => {
    assert.throws(() => base32Decode('MZXW1'), /Invalid base32 character: 1/);
});

test('base32 round-trips random bytes', () => {
    const bytes = crypto.getRandomValues(new Uint8Array(37));
    assert.deepEqual(base32Decode(base32Encode(bytes)), bytes);
});
