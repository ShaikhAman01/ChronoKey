import type { Algorithm } from './hotp.ts';

// RFC 4226 Appendix D: secret "12345678901234567890", 6 digits, counters 0-9
export const HOTP_SECRET = '12345678901234567890';
export const HOTP_VECTORS = [
    '755224', '287082', '359152', '969429', '338314',
    '254676', '287922', '162583', '399871', '520489',
];

// RFC 6238 Appendix B: 8 digits, 30 s step, one ASCII secret per hash
export const TOTP_SECRETS: Record<Algorithm, string> = {
    'SHA-1': '12345678901234567890',
    'SHA-256': '12345678901234567890123456789012',
    'SHA-512': '1234567890123456789012345678901234567890123456789012345678901234',
};

export interface TotpVector {
    time: number;
    algorithm: Algorithm;
    code: string;
}

const table: [number, string, string, string][] = [
    [59, '94287082', '46119246', '90693936'],
    [1111111109, '07081804', '68084774', '25091201'],
    [1111111111, '14050471', '67062674', '99943326'],
    [1234567890, '89005924', '91819424', '93441116'],
    [2000000000, '69279037', '90698825', '38618901'],
    [20000000000, '65353130', '77737706', '47863826'],
];

export const TOTP_VECTORS: TotpVector[] = table.flatMap(([time, sha1, sha256, sha512]) => [
    { time, algorithm: 'SHA-1', code: sha1 },
    { time, algorithm: 'SHA-256', code: sha256 },
    { time, algorithm: 'SHA-512', code: sha512 },
]);
