import test from 'node:test';
import assert from 'node:assert/strict';

import { base32Encode, base32Decode } from '../src/base32.ts';

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
        assert.equal(base32Encode(Buffer.from(plain, 'ascii')), encoded);
    });

    test(`base32Decode("${encoded}") === "${plain}"`, () => {
        assert.equal(base32Decode(encoded).toString('ascii'), plain);
    });
}
