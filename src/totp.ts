import { hotpSteps, type HotpOptions, type HotpSteps } from './hotp.ts';

export interface TotpOptions extends HotpOptions {
    step?: number;
    timestamp?: number;
    t0?: number;
}

export interface VerifyOptions extends TotpOptions {
    window?: number;
}

export interface VerifyResult {
    valid: boolean;
    delta: number | null;
}

export function counterAt(timestamp: number, step = 30, t0 = 0): bigint {
    if (!(step > 0)) {
        throw new RangeError('step must be a positive number of seconds');
    }
    return BigInt(Math.floor((Math.floor(timestamp / 1000) - t0) / step));
}

export function secondsRemaining(timestamp: number, step = 30, t0 = 0): number {
    return step - ((Math.floor(timestamp / 1000) - t0) % step);
}

export async function totpSteps(
    secret: string | Uint8Array,
    { step = 30, timestamp = Date.now(), t0 = 0, ...hotp }: TotpOptions = {},
): Promise<HotpSteps> {
    return hotpSteps(secret, counterAt(timestamp, step, t0), hotp);
}

export async function generateTOTP(secret: string | Uint8Array, options: TotpOptions = {}): Promise<string> {
    return (await totpSteps(secret, options)).code;
}

// Compares every byte even after a mismatch, so the time taken does not reveal how much of the code was right.
function constantTimeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) {
        diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return diff === 0;
}

export async function verifyTOTP(
    secret: string | Uint8Array,
    token: string,
    options: VerifyOptions = {},
): Promise<VerifyResult> {
    const { window = 1, timestamp = Date.now(), step = 30, digits = 6, ...rest } = options;

    if (token.length !== digits || !/^\d+$/.test(token)) {
        return { valid: false, delta: null };
    }

    // Check the whole window instead of returning on the first match, again so timing stays uniform
    let delta: number | null = null;
    for (let offset = -window; offset <= window; offset++) {
        const candidate = await generateTOTP(secret, {
            ...rest,
            step,
            digits,
            timestamp: timestamp + offset * step * 1000,
        });
        if (constantTimeEqual(candidate, token) && delta === null) {
            delta = offset;
        }
    }

    return { valid: delta !== null, delta };
}
