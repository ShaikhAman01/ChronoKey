import { timingSafeEqual } from 'node:crypto';

import { generateHOTP } from './hotp.ts';

const T0 = 0;

export function generateTOTP(
    secret: string | Buffer,
    digits: number = 6,
    step: number = 30,
    timestamp: number = Date.now(),
): string {
    const counter = Math.floor((Math.floor(timestamp / 1000) - T0) / step);
    return generateHOTP(secret, counter, digits);
}

export interface VerifyOptions {
    digits?: number;
    step?: number;
    window?: number;
    timestamp?: number;
}

export interface VerifyResult {
    valid: boolean;
    delta: number | null;
}

export function verifyTOTP(
    secret: string | Buffer,
    token: string,
    options: VerifyOptions = {},
): VerifyResult {
    const { digits = 6, step = 30, window = 1, timestamp = Date.now() } = options;

    if (token.length !== digits) {
        return { valid: false, delta: null };
    }

    const supplied = Buffer.from(token, 'ascii');
    let delta: number | null = null;

    for (let offset = -window; offset <= window; offset++) {
        const candidate = generateTOTP(secret, digits, step, timestamp + offset * step * 1000);
        const matched = timingSafeEqual(Buffer.from(candidate, 'ascii'), supplied);
        if (matched && delta === null) {
            delta = offset;
        }
    }

    return { valid: delta !== null, delta };
}
